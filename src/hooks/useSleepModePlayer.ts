import { useState, useRef, useEffect, useCallback } from "react";
import { resolveAudioSource, cachePlayingAudio } from "@/lib/quran-audio";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useDeviceId } from "@/hooks/useDeviceId";
import { mobileAudioManager, configurePlaybackAudioSession } from "@/lib/mobile-audio";
import { getReciterById } from "@/lib/reciters";
import { SURAH_META } from "@/data/surah-meta";

export interface SleepModePrefs {
  reciterId: string;
  surahNumber: number;
  timerMinutes: number;
  quranVolume: number;
}

const PREFS_KEYS = {
  reciter: "wise-sleep-mode-reciter",
  timer: "wise-sleep-mode-timer",
  surah: "wise-sleep-mode-surah",
  quranVolume: "wise-sleep-mode-quran-volume",
} as const;

/**
 * Broadcast that the user's Sleep Mode preferences changed (reciter,
 * surah, timer, or volume). Listened to by the home Sleep Mode tile so
 * its label ("30m · Alafasy") refreshes without a reload after the
 * user adjusts settings on the Sleep page.
 */
export const SLEEP_PREFS_CHANGED_EVENT = "wise-sleep-prefs-changed";

function readPrefs(): SleepModePrefs {
  return {
    reciterId: localStorage.getItem(PREFS_KEYS.reciter) ?? "alafasy",
    surahNumber: Number(localStorage.getItem(PREFS_KEYS.surah) ?? 36),
    timerMinutes: Number(localStorage.getItem(PREFS_KEYS.timer) ?? 30),
    quranVolume: Number(localStorage.getItem(PREFS_KEYS.quranVolume) ?? 80),
  };
}

function loadPrefs(): SleepModePrefs {
  return readPrefs();
}

/**
 * Public read accessor for the persisted Sleep Mode prefs. Safe to
 * call outside the hook (e.g. from the home tile) without instantiating
 * the player.
 */
export function loadSleepModePrefs(): SleepModePrefs {
  return readPrefs();
}

/**
 * True when the user has saved at least one Sleep Mode pref. Used by
 * the home tile to decide between the "tap to set up" empty state
 * and the "{timer}m · {reciter}" summary.
 */
export function hasConfiguredSleepMode(): boolean {
  return (
    localStorage.getItem(PREFS_KEYS.reciter) !== null ||
    localStorage.getItem(PREFS_KEYS.timer) !== null ||
    localStorage.getItem(PREFS_KEYS.surah) !== null ||
    localStorage.getItem(PREFS_KEYS.quranVolume) !== null
  );
}

function savePrefs(prefs: SleepModePrefs) {
  localStorage.setItem(PREFS_KEYS.reciter, prefs.reciterId);
  localStorage.setItem(PREFS_KEYS.surah, String(prefs.surahNumber));
  localStorage.setItem(PREFS_KEYS.timer, String(prefs.timerMinutes));
  localStorage.setItem(PREFS_KEYS.quranVolume, String(prefs.quranVolume));
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent(SLEEP_PREFS_CHANGED_EVENT, { detail: prefs }));
    } catch {
      /* ignore — best-effort notification */
    }
  }
}

const FADE_OUT_START_SECS = 180;
const SLEEP_CHANNEL = "sleep" as const;

export function useSleepModePlayer() {
  const { user } = useAuth();
  const deviceId = useDeviceId();

  const [prefs, setPrefsState] = useState<SleepModePrefs>(loadPrefs);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(prefs.timerMinutes * 60);
  const [hasError, setHasError] = useState(false);
  // True when navigator.onLine is false AND the requested surah/reciter pair
  // is not in IDB. Surfaced to the page so it can show an actionable
  // "you're offline and this surah isn't downloaded" empty state instead of
  // a generic playback error.
  const [isOfflineUncached, setIsOfflineUncached] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  const quranAudioRef = useRef<HTMLAudioElement | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const isPlayingRef = useRef(false);
  const hasStartedRef = useRef(false);
  // Monotonically increasing token. Each play() call captures a token; any
  // async continuation that finds the global token has moved on bails out.
  // This protects against rapid play -> stop -> play (or play -> play with
  // different prefs) where an older play()'s post-await continuation could
  // otherwise mutate state and start a stale playback after a newer action.
  const playTokenRef = useRef(0);
  // Holds the object URL when we're playing from a cached IDB blob, so we
  // can revoke it on stop / track change. Network URLs are stored as null
  // (nothing to revoke).
  const blobUrlRef = useRef<string | null>(null);
  // Late-bound dispatch table for OS Media Session action handlers
  // registered inside play(). Using a ref breaks the otherwise
  // unavoidable circular reference with pause()/resume() (which are
  // declared after play() so they can call back into the same state).
  const playbackControlsRef = useRef<{ pause: () => void; resume: () => Promise<void> } | null>(null);

  const setPrefs = useCallback((updates: Partial<SleepModePrefs>) => {
    setPrefsState((prev) => {
      const next = { ...prev, ...updates };
      savePrefs(next);
      return next;
    });
  }, []);

  // Sleep mode intentionally does NOT acquire a screen wake-lock: the user wants
  // the screen to turn off while audio continues to play. The audio element keeps
  // playing in the background via the OS media session, with no battery cost from
  // a forced-on screen.

  const detachAudioListeners = useCallback((audio: HTMLAudioElement | null) => {
    if (!audio) return;
    audio.ontimeupdate = null;
    audio.onloadedmetadata = null;
    audio.onplaying = null;
    audio.onwaiting = null;
    audio.onerror = null;
    audio.onended = null;
  }, []);

  // Wire (or unwire) the OS Media Session controls. iOS standalone
  // PWAs aggressively suspend background playback unless they see a
  // populated MediaMetadata + at least one valid action handler — once
  // we set those, the lock-screen controls light up and audio keeps
  // playing through screen-off and the silent switch.
  const updateMediaSession = useCallback((currentPrefs: SleepModePrefs, playing: boolean) => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const reciter = getReciterById(currentPrefs.reciterId);
    const surah = SURAH_META.find((s) => s.number === currentPrefs.surahNumber);
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: surah ? surah.name : `Surah ${currentPrefs.surahNumber}`,
        artist: reciter.name,
        album: "Wise Quran — Sleep Mode",
        artwork: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      });
      navigator.mediaSession.playbackState = playing ? "playing" : "paused";
    } catch {
      /* ignore — older browsers don't support every artwork field */
    }
  }, []);

  const clearMediaSession = useCallback(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = "none";
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.setActionHandler("stop", null);
    } catch {
      /* ignore */
    }
  }, []);

  const cleanupBlobUrl = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  }, []);

  const stopAll = useCallback(() => {
    // Invalidate any in-flight play() continuation so it cannot mutate state
    // or start playback after we stop.
    playTokenRef.current += 1;
    if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }
    if (fadeIntervalRef.current) { clearInterval(fadeIntervalRef.current); fadeIntervalRef.current = null; }
    detachAudioListeners(quranAudioRef.current);
    if (hasStartedRef.current) {
      // Only touch the shared audio element if Sleep Mode actually used it.
      mobileAudioManager.stop(SLEEP_CHANNEL, true);
    }
    cleanupBlobUrl();
    clearMediaSession();
    quranAudioRef.current = null;
    hasStartedRef.current = false;
    isPlayingRef.current = false;
    setIsPlaying(false);
    setIsLoading(false);
    setAudioCurrentTime(0);
    setAudioDuration(0);
  }, [detachAudioListeners, cleanupBlobUrl, clearMediaSession]);

  const saveSession = useCallback((completed: boolean) => {
    if (!sessionIdRef.current) return;
    // Fire-and-forget. We never want a Supabase write to block the
    // playback teardown — and Sleep Mode is mostly used while signed
    // out, so the row may not exist anyway.
    void supabase
      .from("sleep_mode_sessions")
      .update({ completed, ended_at: new Date().toISOString() })
      .eq("id", sessionIdRef.current)
      .then(() => {}, () => {});
  }, []);

  const startSession = useCallback((currentPrefs: SleepModePrefs) => {
    // Fire-and-forget so the playback critical path is NOT gated on a
    // Supabase round-trip (which on iOS standalone PWAs frequently
    // stalls under network handoff between Wi-Fi and cellular). The
    // session row is purely analytical — playback must start whether
    // or not the insert ever succeeds.
    void supabase
      .from("sleep_mode_sessions")
      .insert({
        user_id: user?.id ?? null,
        device_id: user ? null : deviceId,
        reciter_id: currentPrefs.reciterId,
        surah_number: currentPrefs.surahNumber,
        timer_minutes: currentPrefs.timerMinutes,
        nature_sound: null,
        completed: false,
      })
      .select("id")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.id) sessionIdRef.current = data.id;
      }, () => {});
  }, [user, deviceId]);

  const startFadeOut = useCallback((currentQuranVol: number) => {
    let qVol = currentQuranVol / 100;
    const steps = FADE_OUT_START_SECS / 2;
    const qDecrement = qVol / steps;

    fadeIntervalRef.current = setInterval(() => {
      qVol = Math.max(0, qVol - qDecrement);
      if (quranAudioRef.current) quranAudioRef.current.volume = qVol;
      if (qVol <= 0) {
        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      }
    }, 2000);
  }, []);

  const play = useCallback(async (overridePrefs?: SleepModePrefs) => {
    // stopAll() bumps playTokenRef. Capture the new token AFTER, so this
    // play() invocation has its own identity for staleness checks below.
    stopAll();
    const myToken = ++playTokenRef.current;
    const isStale = () => playTokenRef.current !== myToken;

    setHasError(false);
    setIsOfflineUncached(false);
    setIsLoading(true);

    // iOS 17+: declare this as a "playback" audio session so the
    // hardware silent switch does not mute Sleep Mode and the OS
    // keeps the audio alive in the background. Must run inside the
    // user-gesture tick that originated this play(), which it does
    // because togglePlay() calls play() directly from the click
    // handler.
    configurePlaybackAudioSession();

    const currentPrefs = overridePrefs ?? (await new Promise<SleepModePrefs>((res) => {
      setPrefsState((p) => { res(p); return p; });
    }));

    // === iOS-safe audio bring-up ===
    // Grab the shared, properly-configured audio element for the "sleep" channel
    // (playsInline, webkit-playsinline, crossOrigin="anonymous", preload="auto"
    // are all set on it by mobileAudioManager.getAudio). Then call prime()
    // SYNCHRONOUSLY inside this user-gesture-initiated call so the underlying
    // .play() of the silent unlock MP3 happens within the activation tick —
    // this is what registers the element as "user-activated" on iOS Safari /
    // standalone PWA mode. The promise can resolve later, but the gesture has
    // been "spent" on this element, not lost.
    const audio = mobileAudioManager.getAudio(SLEEP_CHANNEL);
    quranAudioRef.current = audio;
    hasStartedRef.current = true;

    const primePromise = mobileAudioManager.prime(SLEEP_CHANNEL);

    try {
      // These can run after the gesture; the element is already activated.
      await primePromise;
      if (isStale()) return;

      // Resolve the audio source: if the surah is downloaded for this
      // reciter, this returns a blob: URL backed by IndexedDB and Sleep
      // Mode plays fully offline. Otherwise it returns the network URL
      // (when online) or null (when offline AND uncached).
      const source = await resolveAudioSource(currentPrefs.reciterId, currentPrefs.surahNumber);
      if (isStale()) {
        // We were superseded while resolving; revoke any blob URL we
        // were about to use so it doesn't leak.
        if (source?.cached) URL.revokeObjectURL(source.url);
        return;
      }
      if (!source) {
        // Offline and not cached. Surface a structured empty-state to
        // the page rather than a generic playback failure.
        setIsOfflineUncached(true);
        stopAll();
        return;
      }
      if (source.cached) {
        // Track for revocation on stop / next track.
        blobUrlRef.current = source.url;
      }

      // Re-attach fresh listeners after prime (prime restores src, but we want
      // to drive the timer/loader UI off the real reciter audio element).
      detachAudioListeners(audio);
      audio.ontimeupdate = () => setAudioCurrentTime(audio.currentTime);
      audio.onloadedmetadata = () => setAudioDuration(audio.duration);
      audio.onplaying = () => setIsLoading(false);
      audio.onwaiting = () => setIsLoading(true);
      audio.onerror = () => {
        if (isStale()) return;
        setHasError(true);
        setIsLoading(false);
        stopAll();
      };
      audio.onended = () => {
        // Surah ended naturally before the timer ran out — stop and
        // let the user pick another. (Looping is intentionally not
        // forced; the timer-driven fade-out is the user-visible
        // "the session is done" signal.)
        if (isStale()) return;
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        saveSession(true);
        stopAll();
      };

      const totalSecs = currentPrefs.timerMinutes * 60;
      setRemainingSeconds(totalSecs);

      // mobileAudioManager.play sets the src, runs audio.load(), and calls
      // .play() — with a single retry-after-load fallback if the first call
      // is rejected (which iOS occasionally does on cold start). Works
      // identically for blob: and https: URLs on iOS Safari / standalone.
      await mobileAudioManager.play(SLEEP_CHANNEL, source.url, {
        forceLoad: true,
        volume: currentPrefs.quranVolume / 100,
      });
      if (isStale()) {
        // A newer action superseded us. The "sleep" channel is shared, so
        // we MUST NOT call mobileAudioManager.stop() here — the newer
        // play() already called stopAll() before incrementing the token,
        // and any subsequent .play() it issues owns the channel from this
        // point on. Stopping here would race-kill the newer playback.
        //
        // We must also NOT touch blobUrlRef.current via cleanupBlobUrl():
        // by the time this stale branch runs, the newer play()'s own
        // stopAll() has already wiped our reference, and that newer
        // play() may have since reassigned blobUrlRef.current to ITS new
        // blob URL. Instead, revoke the local `source.url` directly
        // (the URL we ourselves created via createObjectURL), so we leak
        // nothing and we don't risk revoking the in-use newer URL.
        if (source.cached) {
          URL.revokeObjectURL(source.url);
        }
        return;
      }

      isPlayingRef.current = true;
      setIsPlaying(true);

      // OS lock-screen / Control Center: title, artist, artwork +
      // play/pause/stop handlers. Without these, iOS silently
      // suspends the audio after a few seconds of screen-off in a
      // standalone PWA — this is the single biggest cause of "Sleep
      // Mode plays for 5 seconds then stops" reports.
      //
      // We dispatch through `playbackControlsRef` (assigned just below
      // the pause/resume declarations) so this runs cleanly without
      // forward-reference issues.
      updateMediaSession(currentPrefs, true);
      if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
        try {
          navigator.mediaSession.setActionHandler("play", () => {
            void playbackControlsRef.current?.resume();
          });
          navigator.mediaSession.setActionHandler("pause", () => {
            playbackControlsRef.current?.pause();
          });
          navigator.mediaSession.setActionHandler("stop", () => {
            saveSession(false);
            stopAll();
          });
        } catch {
          /* ignore */
        }
      }

      // Background-cache the surah after a successful network play, so the
      // next Sleep session for this reciter+surah will work offline. No-op
      // if it's already cached (we'd be on the blob: URL branch above).
      if (!source.cached && navigator.onLine) {
        cachePlayingAudio(currentPrefs.reciterId, currentPrefs.surahNumber, source.url).catch(() => {});
      }

      // Fire-and-forget — see startSession() for why we don't await.
      startSession(currentPrefs);

      let elapsed = 0;
      timerIntervalRef.current = setInterval(() => {
        elapsed += 1;
        const remaining = totalSecs - elapsed;
        setRemainingSeconds(remaining);

        if (remaining === FADE_OUT_START_SECS) {
          startFadeOut(currentPrefs.quranVolume);
        }

        if (remaining <= 0) {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          saveSession(true);
          stopAll();
        }
      }, 1000);
    } catch {
      if (isStale()) return;
      setHasError(true);
      setIsLoading(false);
      stopAll();
    }
  }, [stopAll, startSession, startFadeOut, saveSession, detachAudioListeners, updateMediaSession]);

  const pause = useCallback(() => {
    quranAudioRef.current?.pause();
    if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }
    if (fadeIntervalRef.current) { clearInterval(fadeIntervalRef.current); fadeIntervalRef.current = null; }
    isPlayingRef.current = false;
    setIsPlaying(false);
    if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
      try { navigator.mediaSession.playbackState = "paused"; } catch { /* ignore */ }
    }
  }, []);

  const resume = useCallback(async () => {
    if (!quranAudioRef.current) return;
    // Resume on the same activated element — no src swap, so iOS allows it.
    await mobileAudioManager.play(SLEEP_CHANNEL).catch(() => {});
    isPlayingRef.current = true;
    setIsPlaying(true);
    if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
      try { navigator.mediaSession.playbackState = "playing"; } catch { /* ignore */ }
    }

    setPrefsState((currentPrefs) => {
      let elapsed = currentPrefs.timerMinutes * 60 - remainingSeconds;
      const totalSecs = currentPrefs.timerMinutes * 60;

      timerIntervalRef.current = setInterval(() => {
        elapsed += 1;
        const remaining = totalSecs - elapsed;
        setRemainingSeconds(remaining);
        if (remaining === FADE_OUT_START_SECS) {
          startFadeOut(currentPrefs.quranVolume);
        }
        if (remaining <= 0) {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          saveSession(true);
          stopAll();
        }
      }, 1000);

      return currentPrefs;
    });
  }, [remainingSeconds, startFadeOut, saveSession, stopAll]);

  // Keep the ref pointing at the latest stable identities so any
  // already-registered Media Session action handler always dispatches
  // to the current pause/resume implementation.
  useEffect(() => {
    playbackControlsRef.current = { pause, resume };
  }, [pause, resume]);

  const togglePlay = useCallback(async () => {
    if (isLoading) return;
    if (!isPlaying && !quranAudioRef.current) {
      setPrefsState((currentPrefs) => {
        play(currentPrefs);
        return currentPrefs;
      });
    } else if (isPlaying) {
      pause();
    } else {
      await resume();
    }
  }, [isLoading, isPlaying, play, pause, resume]);

  useEffect(() => {
    setRemainingSeconds(prefs.timerMinutes * 60);
  }, [prefs.timerMinutes]);

  useEffect(() => {
    if (quranAudioRef.current) {
      quranAudioRef.current.volume = prefs.quranVolume / 100;
    }
  }, [prefs.quranVolume]);

  useEffect(() => {
    if (isPlayingRef.current && quranAudioRef.current) {
      setPrefsState((currentPrefs) => {
        play(currentPrefs);
        return currentPrefs;
      });
    }
  }, [prefs.reciterId, prefs.surahNumber]);

  useEffect(() => {
    return () => {
      stopAll();
      if (sessionIdRef.current) saveSession(false);
    };
  }, []);

  return {
    prefs,
    setPrefs,
    isPlaying,
    isLoading,
    hasError,
    isOfflineUncached,
    remainingSeconds,
    audioCurrentTime,
    audioDuration,
    togglePlay,
    stop: () => { saveSession(false); stopAll(); setRemainingSeconds(prefs.timerMinutes * 60); },
  };
}
