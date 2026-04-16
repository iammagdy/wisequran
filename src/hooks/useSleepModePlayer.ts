import { useState, useRef, useEffect, useCallback } from "react";
import { getReciterAudioUrl } from "@/lib/reciters";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useDeviceId } from "@/hooks/useDeviceId";

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

function loadPrefs(): SleepModePrefs {
  return {
    reciterId: localStorage.getItem(PREFS_KEYS.reciter) ?? "alafasy",
    surahNumber: Number(localStorage.getItem(PREFS_KEYS.surah) ?? 36),
    timerMinutes: Number(localStorage.getItem(PREFS_KEYS.timer) ?? 30),
    quranVolume: Number(localStorage.getItem(PREFS_KEYS.quranVolume) ?? 80),
  };
}

function savePrefs(prefs: SleepModePrefs) {
  localStorage.setItem(PREFS_KEYS.reciter, prefs.reciterId);
  localStorage.setItem(PREFS_KEYS.surah, String(prefs.surahNumber));
  localStorage.setItem(PREFS_KEYS.timer, String(prefs.timerMinutes));
  localStorage.setItem(PREFS_KEYS.quranVolume, String(prefs.quranVolume));
}

const FADE_OUT_START_SECS = 180;

export function useSleepModePlayer() {
  const { user } = useAuth();
  const deviceId = useDeviceId();

  const [prefs, setPrefsState] = useState<SleepModePrefs>(loadPrefs);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(prefs.timerMinutes * 60);
  const [hasError, setHasError] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  const quranAudioRef = useRef<HTMLAudioElement | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const isPlayingRef = useRef(false);

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

  const stopAll = useCallback(() => {
    if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }
    if (fadeIntervalRef.current) { clearInterval(fadeIntervalRef.current); fadeIntervalRef.current = null; }
    if (quranAudioRef.current) { quranAudioRef.current.pause(); quranAudioRef.current.src = ""; quranAudioRef.current = null; }
    isPlayingRef.current = false;
    setIsPlaying(false);
    setIsLoading(false);
    setAudioCurrentTime(0);
    setAudioDuration(0);
  }, []);

  const saveSession = useCallback(async (completed: boolean) => {
    if (!sessionIdRef.current) return;
    await supabase
      .from("sleep_mode_sessions")
      .update({ completed, ended_at: new Date().toISOString() })
      .eq("id", sessionIdRef.current);
  }, []);

  const startSession = useCallback(async (currentPrefs: SleepModePrefs) => {
    const { data } = await supabase
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
      .maybeSingle();
    if (data?.id) sessionIdRef.current = data.id;
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
    stopAll();
    setHasError(false);
    setIsLoading(true);

    const currentPrefs = overridePrefs ?? (await new Promise<SleepModePrefs>((res) => {
      setPrefsState((p) => { res(p); return p; });
    }));

    // Synchronous audio creation & unlock for iOS
    let quranAudio = quranAudioRef.current;
    if (!quranAudio) {
      quranAudio = new Audio();
      quranAudioRef.current = quranAudio;
      // Silent unlock
      quranAudio.src = "data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjYwLjE2LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV6urq6urq6urq6urq6urq6urq6urq6urq6urq6urq6urq//OEAAOAAAAAIAAAAAQAAAADxIAAAeAAAAAAyIQUAAwEEAAAB1wQAAAAG5uP//xQo4BwwMAAECAR/f7//////9/4h7/8///Q2P//+T7f///+i//T//4iK5b4AAAAAAACAAH//OEAAiBQAIAAAQAAAABAAIAB4gAAB4AAAAB0QgUAAQIEAAEB1wQAAABW5+///xRgwBAAIAAACAR/f///////4h7/8///Q2P//+T7f///+i//T//4iK5b4AAAAAAAAIAA//OEAAyBwAIAAAQAAAABAAIAB4gAAB4AAAAB0QgUAAQIEAAEB1wQAAABW5+///xRgwBAAIAAACAR/f///////4h7/8///Q2P//+T7f///+i//T//4iK5b4AAAAAAAAIAA//OEAFAAQAIAAAQAAAABAAIAB4gAAB4AAAAB0QgUAAQIEAAEB1wQAAABW5+///xRgwBAAIAAACAR/f///////4h7/8///Q2P//+T7f///+i//T//4iK5b4AAAAAAAAIAA==";
      quranAudio.play().catch(() => {});
    }

    try {
      const url = await getReciterAudioUrl(currentPrefs.reciterId, currentPrefs.surahNumber);
      
      // Clean up old listeners
      quranAudio.onloadedmetadata = null;
      quranAudio.ontimeupdate = null;
      quranAudio.onplaying = null;
      quranAudio.onwaiting = null;

      quranAudio.src = url;
      quranAudio.volume = currentPrefs.quranVolume / 100;

      quranAudio.ontimeupdate = () => setAudioCurrentTime(quranAudio.currentTime);
      quranAudio.onloadedmetadata = () => setAudioDuration(quranAudio.duration);
      quranAudio.onplaying = () => setIsLoading(false);
      quranAudio.onwaiting = () => setIsLoading(true);

      const totalSecs = currentPrefs.timerMinutes * 60;
      setRemainingSeconds(totalSecs);

      await quranAudio.play();
      isPlayingRef.current = true;
      setIsPlaying(true);

      await startSession(currentPrefs);

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
      setHasError(true);
      setIsLoading(false);
      stopAll();
    }
  }, [stopAll, startSession, startFadeOut, saveSession]);

  const pause = useCallback(() => {
    quranAudioRef.current?.pause();
    if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }
    if (fadeIntervalRef.current) { clearInterval(fadeIntervalRef.current); fadeIntervalRef.current = null; }
    isPlayingRef.current = false;
    setIsPlaying(false);
  }, []);

  const resume = useCallback(async () => {
    if (!quranAudioRef.current) return;
    await quranAudioRef.current.play().catch(() => {});
    isPlayingRef.current = true;
    setIsPlaying(true);

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
    remainingSeconds,
    audioCurrentTime,
    audioDuration,
    togglePlay,
    stop: () => { saveSession(false); stopAll(); setRemainingSeconds(prefs.timerMinutes * 60); },
  };
}
