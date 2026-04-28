import { resolveAudioSource, cachePlayingAudio } from "@/lib/quran-audio";
import { supabase } from "@/lib/supabase";
import { mobileAudioManager, configurePlaybackAudioSession } from "@/lib/mobile-audio";
import { getReciterById } from "@/lib/reciters";
import { SURAH_META } from "@/data/surah-meta";
import {
  setSleepSessionState,
  resetSleepSessionState,
} from "@/lib/sleep-session-store";

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

function persistPrefs(prefs: SleepModePrefs) {
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

export interface SleepPlayerSnapshot {
  prefs: SleepModePrefs;
  isPlaying: boolean;
  isLoading: boolean;
  hasError: boolean;
  isOfflineUncached: boolean;
  remainingSeconds: number;
  audioCurrentTime: number;
  audioDuration: number;
}

function createInitialSnapshot(): SleepPlayerSnapshot {
  const prefs = readPrefs();
  return {
    prefs,
    isPlaying: false,
    isLoading: false,
    hasError: false,
    isOfflineUncached: false,
    remainingSeconds: prefs.timerMinutes * 60,
    audioCurrentTime: 0,
    audioDuration: 0,
  };
}

/**
 * Module-level Sleep Mode player. Owns audio orchestration, the
 * countdown timer, and the public state snapshot. Lives outside React
 * so audio + the timer survive page navigation — the home Sleep Mode
 * tile can read live status while the user is on the home screen, and
 * re-entering the Sleep page picks back up the same active session
 * instead of starting fresh.
 */
function createSleepModePlayer() {
  let snapshot: SleepPlayerSnapshot = createInitialSnapshot();
  const listeners = new Set<() => void>();

  let audio: HTMLAudioElement | null = null;
  let timerInterval: ReturnType<typeof setInterval> | null = null;
  let fadeInterval: ReturnType<typeof setInterval> | null = null;
  let sessionId: string | null = null;
  let hasStarted = false;
  // Monotonically increasing token. Each play() call captures a token; any
  // async continuation that finds the global token has moved on bails out.
  // This protects against rapid play -> stop -> play (or play -> play with
  // different prefs) where an older play()'s post-await continuation could
  // otherwise mutate state and start a stale playback after a newer action.
  let playToken = 0;
  // Holds the object URL when we're playing from a cached IDB blob, so we
  // can revoke it on stop / track change. Network URLs are stored as null
  // (nothing to revoke).
  let blobUrl: string | null = null;

  // Auth context (user id + device id) used to attribute the supabase
  // session insert. The hook keeps this in sync from React via
  // setAuthContext() so the singleton never has to peek into React.
  let authContext: { userId: string | null; deviceId: string | null } = {
    userId: null,
    deviceId: null,
  };

  function setSnapshot(updates: Partial<SleepPlayerSnapshot>) {
    snapshot = { ...snapshot, ...updates };
    for (const listener of listeners) listener();
  }

  function setPrefsInternal(updater: (prev: SleepModePrefs) => SleepModePrefs) {
    const next = updater(snapshot.prefs);
    persistPrefs(next);
    setSnapshot({ prefs: next });
  }

  function detachAudioListeners(target: HTMLAudioElement | null) {
    if (!target) return;
    target.ontimeupdate = null;
    target.onloadedmetadata = null;
    target.onplaying = null;
    target.onwaiting = null;
    target.onerror = null;
    target.onended = null;
  }

  // Wire (or unwire) the OS Media Session controls. iOS standalone
  // PWAs aggressively suspend background playback unless they see a
  // populated MediaMetadata + at least one valid action handler — once
  // we set those, the lock-screen controls light up and audio keeps
  // playing through screen-off and the silent switch.
  function updateMediaSession(currentPrefs: SleepModePrefs, playing: boolean) {
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
  }

  function clearMediaSession() {
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
    clearMediaPositionState();
  }

  // Push the live countdown into the OS media controls. iOS Control
  // Center / lock screen and Android Chrome notification render this
  // as a progress bar that ticks down in real time, giving the user a
  // visible "N minutes left" without needing to open the PWA.
  //
  // We model the Sleep timer as a track of length `totalSecs` and pass
  // `elapsedSecs` as the current position — this maps cleanly onto the
  // existing media UI metaphor (elapsed on the left, remaining on the
  // right). When `playing` is true we report playbackRate: 1 so the OS
  // can extrapolate sub-second progress between our 1Hz updates;
  // playbackRate: 0 freezes the bar on pause.
  function updateMediaPositionState(
    totalSecs: number,
    elapsedSecs: number,
    playing: boolean,
  ) {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    if (typeof navigator.mediaSession.setPositionState !== "function") return;
    if (!Number.isFinite(totalSecs) || totalSecs <= 0) return;
    const clampedElapsed = Math.max(0, Math.min(elapsedSecs, totalSecs));
    try {
      navigator.mediaSession.setPositionState({
        duration: totalSecs,
        position: clampedElapsed,
        playbackRate: playing ? 1 : 0,
      });
    } catch {
      /* ignore — Safari throws on invalid values; bail rather than crash playback */
    }
  }

  function clearMediaPositionState() {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    if (typeof navigator.mediaSession.setPositionState !== "function") return;
    try {
      navigator.mediaSession.setPositionState();
    } catch {
      /* ignore */
    }
  }

  function cleanupBlobUrl() {
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
      blobUrl = null;
    }
  }

  function stopAll() {
    // Invalidate any in-flight play() continuation so it cannot mutate state
    // or start playback after we stop.
    playToken += 1;
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    if (fadeInterval) {
      clearInterval(fadeInterval);
      fadeInterval = null;
    }
    detachAudioListeners(audio);
    if (hasStarted) {
      // Only touch the shared audio element if Sleep Mode actually used it.
      mobileAudioManager.stop(SLEEP_CHANNEL, true);
    }
    cleanupBlobUrl();
    clearMediaSession();
    audio = null;
    hasStarted = false;
    setSnapshot({
      isPlaying: false,
      isLoading: false,
      audioCurrentTime: 0,
      audioDuration: 0,
    });
    // Drop the global session entry — the home tile falls back to the
    // saved-prefs label.
    resetSleepSessionState();
  }

  function saveSession(completed: boolean) {
    if (!sessionId) return;
    const id = sessionId;
    sessionId = null;
    // Fire-and-forget. We never want a Supabase write to block the
    // playback teardown — and Sleep Mode is mostly used while signed
    // out, so the row may not exist anyway.
    void supabase
      .from("sleep_mode_sessions")
      .update({ completed, ended_at: new Date().toISOString() })
      .eq("id", id)
      .then(() => {}, () => {});
  }

  function startSession(currentPrefs: SleepModePrefs) {
    // Fire-and-forget so the playback critical path is NOT gated on a
    // Supabase round-trip (which on iOS standalone PWAs frequently
    // stalls under network handoff between Wi-Fi and cellular). The
    // session row is purely analytical — playback must start whether
    // or not the insert ever succeeds.
    void supabase
      .from("sleep_mode_sessions")
      .insert({
        user_id: authContext.userId ?? null,
        device_id: authContext.userId ? null : authContext.deviceId,
        reciter_id: currentPrefs.reciterId,
        surah_number: currentPrefs.surahNumber,
        timer_minutes: currentPrefs.timerMinutes,
        nature_sound: null,
        completed: false,
      })
      .select("id")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.id) sessionId = data.id;
      }, () => {});
  }

  function startFadeOut(currentQuranVol: number) {
    let qVol = currentQuranVol / 100;
    const steps = FADE_OUT_START_SECS / 2;
    const qDecrement = qVol / steps;

    fadeInterval = setInterval(() => {
      qVol = Math.max(0, qVol - qDecrement);
      if (audio) audio.volume = qVol;
      if (qVol <= 0) {
        if (fadeInterval) clearInterval(fadeInterval);
      }
    }, 2000);
  }

  function startTimerInterval(totalSecs: number, initialElapsed: number, currentPrefs: SleepModePrefs) {
    let elapsed = initialElapsed;
    timerInterval = setInterval(() => {
      elapsed += 1;
      const remaining = totalSecs - elapsed;
      setSnapshot({ remainingSeconds: remaining });
      setSleepSessionState({ remainingSeconds: Math.max(0, remaining) });
      // Cap at totalSecs so the OS progress bar doesn't overshoot in the
      // tick where we're about to call stopAll().
      updateMediaPositionState(totalSecs, Math.min(elapsed, totalSecs), true);

      if (remaining === FADE_OUT_START_SECS) {
        startFadeOut(currentPrefs.quranVolume);
      }

      if (remaining <= 0) {
        if (timerInterval) {
          clearInterval(timerInterval);
          timerInterval = null;
        }
        saveSession(true);
        stopAll();
      }
    }, 1000);
  }

  async function play(overridePrefs?: SleepModePrefs) {
    // stopAll() bumps playToken. Capture the new token AFTER, so this
    // play() invocation has its own identity for staleness checks below.
    stopAll();
    const myToken = ++playToken;
    const isStale = () => playToken !== myToken;

    setSnapshot({ hasError: false, isOfflineUncached: false, isLoading: true });

    // iOS 17+: declare this as a "playback" audio session so the
    // hardware silent switch does not mute Sleep Mode and the OS
    // keeps the audio alive in the background. Must run inside the
    // user-gesture tick that originated this play(), which it does
    // because togglePlay() calls play() directly from the click
    // handler.
    configurePlaybackAudioSession();

    const currentPrefs = overridePrefs ?? snapshot.prefs;

    // === iOS-safe audio bring-up ===
    // Grab the shared, properly-configured audio element for the "sleep" channel
    // (playsInline, webkit-playsinline, crossOrigin="anonymous", preload="auto"
    // are all set on it by mobileAudioManager.getAudio). Then call prime()
    // SYNCHRONOUSLY inside this user-gesture-initiated call so the underlying
    // .play() of the silent unlock MP3 happens within the activation tick —
    // this is what registers the element as "user-activated" on iOS Safari /
    // standalone PWA mode. The promise can resolve later, but the gesture has
    // been "spent" on this element, not lost.
    const localAudio = mobileAudioManager.getAudio(SLEEP_CHANNEL);
    audio = localAudio;
    hasStarted = true;

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
        setSnapshot({ isOfflineUncached: true });
        stopAll();
        return;
      }
      if (source.cached) {
        // Track for revocation on stop / next track.
        blobUrl = source.url;
      }

      // Re-attach fresh listeners after prime (prime restores src, but we want
      // to drive the timer/loader UI off the real reciter audio element).
      detachAudioListeners(localAudio);
      localAudio.ontimeupdate = () => setSnapshot({ audioCurrentTime: localAudio.currentTime });
      localAudio.onloadedmetadata = () => setSnapshot({ audioDuration: localAudio.duration });
      localAudio.onplaying = () => setSnapshot({ isLoading: false });
      localAudio.onwaiting = () => setSnapshot({ isLoading: true });
      localAudio.onerror = () => {
        if (isStale()) return;
        setSnapshot({ hasError: true, isLoading: false });
        stopAll();
      };
      localAudio.onended = () => {
        // Surah ended naturally before the timer ran out — stop and
        // let the user pick another. (Looping is intentionally not
        // forced; the timer-driven fade-out is the user-visible
        // "the session is done" signal.)
        if (isStale()) return;
        if (timerInterval) {
          clearInterval(timerInterval);
          timerInterval = null;
        }
        saveSession(true);
        stopAll();
      };

      const totalSecs = currentPrefs.timerMinutes * 60;
      setSnapshot({ remainingSeconds: totalSecs });

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
        // We must also NOT touch the module-level blobUrl via cleanupBlobUrl():
        // by the time this stale branch runs, the newer play()'s own
        // stopAll() has already wiped our reference, and that newer
        // play() may have since reassigned blobUrl to ITS new URL.
        // Instead, revoke the local `source.url` directly (the URL we
        // ourselves created via createObjectURL), so we leak nothing
        // and we don't risk revoking the in-use newer URL.
        if (source.cached) {
          URL.revokeObjectURL(source.url);
        }
        return;
      }

      setSnapshot({ isPlaying: true });
      // Publish the live session to the global store so the home Sleep
      // Mode tile can show "playing · Nm left" without re-instantiating
      // this player.
      setSleepSessionState({
        status: "playing",
        remainingSeconds: totalSecs,
        totalSeconds: totalSecs,
        reciterId: currentPrefs.reciterId,
        surahNumber: currentPrefs.surahNumber,
      });

      // OS lock-screen / Control Center: title, artist, artwork +
      // play/pause/stop handlers. Without these, iOS silently
      // suspends the audio after a few seconds of screen-off in a
      // standalone PWA — this is the single biggest cause of "Sleep
      // Mode plays for 5 seconds then stops" reports.
      updateMediaSession(currentPrefs, true);
      // Seed the lock-screen progress bar at 0 so it appears
      // immediately, before the first 1-second timer tick fires.
      updateMediaPositionState(totalSecs, 0, true);
      if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
        try {
          navigator.mediaSession.setActionHandler("play", () => {
            void resume();
          });
          navigator.mediaSession.setActionHandler("pause", () => {
            pause();
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

      startTimerInterval(totalSecs, 0, currentPrefs);
    } catch {
      if (isStale()) return;
      setSnapshot({ hasError: true, isLoading: false });
      stopAll();
    }
  }

  function pause() {
    audio?.pause();
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    if (fadeInterval) {
      clearInterval(fadeInterval);
      fadeInterval = null;
    }
    setSnapshot({ isPlaying: false });
    setSleepSessionState({ status: "paused" });
    if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
      try {
        navigator.mediaSession.playbackState = "paused";
      } catch {
        /* ignore */
      }
    }
    // Freeze the lock-screen progress bar at the paused position
    // (playbackRate: 0) so it stops ticking until the user resumes.
    const totalSecsAtPause = snapshot.prefs.timerMinutes * 60;
    const elapsedAtPause = totalSecsAtPause - snapshot.remainingSeconds;
    updateMediaPositionState(totalSecsAtPause, elapsedAtPause, false);
  }

  async function resume() {
    if (!audio) return;
    // Resume on the same activated element — no src swap, so iOS allows it.
    await mobileAudioManager.play(SLEEP_CHANNEL).catch(() => {});
    setSnapshot({ isPlaying: true });
    setSleepSessionState({ status: "playing" });
    if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
      try {
        navigator.mediaSession.playbackState = "playing";
      } catch {
        /* ignore */
      }
    }

    const currentPrefs = snapshot.prefs;
    const totalSecs = currentPrefs.timerMinutes * 60;
    const elapsed = totalSecs - snapshot.remainingSeconds;
    // Refresh positionState with playbackRate: 1 so the OS resumes
    // extrapolating the bar before the next timer tick lands.
    updateMediaPositionState(totalSecs, elapsed, true);
    startTimerInterval(totalSecs, elapsed, currentPrefs);
  }

  async function togglePlay() {
    if (snapshot.isLoading) return;
    if (!snapshot.isPlaying && !audio) {
      await play(snapshot.prefs);
    } else if (snapshot.isPlaying) {
      pause();
    } else {
      await resume();
    }
  }

  function stop() {
    saveSession(false);
    stopAll();
    setSnapshot({ remainingSeconds: snapshot.prefs.timerMinutes * 60 });
  }

  function setPrefs(updates: Partial<SleepModePrefs>) {
    setPrefsInternal((prev) => ({ ...prev, ...updates }));

    // Reset the on-screen countdown when the user picks a different
    // duration while idle.
    if (updates.timerMinutes !== undefined && !snapshot.isPlaying && !audio) {
      setSnapshot({ remainingSeconds: snapshot.prefs.timerMinutes * 60 });
    }

    // Live volume change while playing.
    if (updates.quranVolume !== undefined && audio) {
      audio.volume = snapshot.prefs.quranVolume / 100;
    }

    // Restart the active session if the surah or reciter changed mid-play
    // — preserves the previous behavior where switching tracks while
    // playing immediately switches to the new track.
    if (
      (updates.reciterId !== undefined || updates.surahNumber !== undefined) &&
      snapshot.isPlaying &&
      audio
    ) {
      void play(snapshot.prefs);
    }
  }

  function setAuthContext(userId: string | null, deviceId: string | null) {
    authContext = { userId, deviceId };
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  function getSnapshot() {
    return snapshot;
  }

  return {
    subscribe,
    getSnapshot,
    play,
    pause,
    resume,
    togglePlay,
    stop,
    setPrefs,
    setAuthContext,
  };
}

export const sleepModePlayer = createSleepModePlayer();
