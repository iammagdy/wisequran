import { useState, useRef, useEffect, useCallback } from "react";
import { getReciterAudioUrl } from "@/lib/reciters";
import { NATURE_SOUNDS, type NatureSound } from "@/components/sleep/NatureSoundPicker";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useDeviceId } from "@/hooks/useDeviceId";

export interface SleepModePrefs {
  reciterId: string;
  surahNumber: number;
  timerMinutes: number;
  natureSound: NatureSound;
  natureVolume: number;
  quranVolume: number;
}

const PREFS_KEYS = {
  reciter: "wise-sleep-mode-reciter",
  timer: "wise-sleep-mode-timer",
  surah: "wise-sleep-mode-surah",
  natureSound: "wise-sleep-mode-nature-sound",
  natureVolume: "wise-sleep-mode-nature-volume",
  quranVolume: "wise-sleep-mode-quran-volume",
} as const;

function loadPrefs(): SleepModePrefs {
  return {
    reciterId: localStorage.getItem(PREFS_KEYS.reciter) ?? "alafasy",
    surahNumber: Number(localStorage.getItem(PREFS_KEYS.surah) ?? 36),
    timerMinutes: Number(localStorage.getItem(PREFS_KEYS.timer) ?? 30),
    natureSound: (localStorage.getItem(PREFS_KEYS.natureSound) as NatureSound) ?? "none",
    natureVolume: Number(localStorage.getItem(PREFS_KEYS.natureVolume) ?? 40),
    quranVolume: Number(localStorage.getItem(PREFS_KEYS.quranVolume) ?? 80),
  };
}

function savePrefs(prefs: SleepModePrefs) {
  localStorage.setItem(PREFS_KEYS.reciter, prefs.reciterId);
  localStorage.setItem(PREFS_KEYS.surah, String(prefs.surahNumber));
  localStorage.setItem(PREFS_KEYS.timer, String(prefs.timerMinutes));
  localStorage.setItem(PREFS_KEYS.natureSound, prefs.natureSound);
  localStorage.setItem(PREFS_KEYS.natureVolume, String(prefs.natureVolume));
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

  const quranAudioRef = useRef<HTMLAudioElement | null>(null);
  const natureAudioRef = useRef<HTMLAudioElement | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const setPrefs = useCallback((updates: Partial<SleepModePrefs>) => {
    setPrefsState((prev) => {
      const next = { ...prev, ...updates };
      savePrefs(next);
      return next;
    });
  }, []);

  const acquireWakeLock = useCallback(async () => {
    if ("wakeLock" in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
      } catch {
        // Not supported or denied — silently ignore
      }
    }
  }, []);

  const releaseWakeLock = useCallback(() => {
    wakeLockRef.current?.release().catch(() => {});
    wakeLockRef.current = null;
  }, []);

  const stopAll = useCallback(() => {
    if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }
    if (fadeIntervalRef.current) { clearInterval(fadeIntervalRef.current); fadeIntervalRef.current = null; }
    if (quranAudioRef.current) { quranAudioRef.current.pause(); quranAudioRef.current.src = ""; quranAudioRef.current = null; }
    if (natureAudioRef.current) { natureAudioRef.current.pause(); natureAudioRef.current.src = ""; natureAudioRef.current = null; }
    releaseWakeLock();
    setIsPlaying(false);
    setIsLoading(false);
  }, [releaseWakeLock]);

  const saveSession = useCallback(async (completed: boolean) => {
    if (!sessionIdRef.current) return;
    await supabase
      .from("sleep_mode_sessions")
      .update({ completed, ended_at: new Date().toISOString() })
      .eq("id", sessionIdRef.current);
  }, []);

  const startSession = useCallback(async () => {
    const { data } = await supabase
      .from("sleep_mode_sessions")
      .insert({
        user_id: user?.id ?? null,
        device_id: user ? null : deviceId,
        reciter_id: prefs.reciterId,
        surah_number: prefs.surahNumber,
        timer_minutes: prefs.timerMinutes,
        nature_sound: prefs.natureSound === "none" ? null : prefs.natureSound,
        completed: false,
      })
      .select("id")
      .maybeSingle();
    if (data?.id) sessionIdRef.current = data.id;
  }, [user, deviceId, prefs]);

  const startFadeOut = useCallback((currentQuranVol: number, currentNatureVol: number) => {
    let qVol = currentQuranVol / 100;
    let nVol = currentNatureVol / 100;
    const steps = FADE_OUT_START_SECS / 2;
    const qDecrement = qVol / steps;
    const nDecrement = nVol / steps;

    fadeIntervalRef.current = setInterval(() => {
      qVol = Math.max(0, qVol - qDecrement);
      nVol = Math.max(0, nVol - nDecrement);
      if (quranAudioRef.current) quranAudioRef.current.volume = qVol;
      if (natureAudioRef.current) natureAudioRef.current.volume = nVol;
      if (qVol <= 0 && nVol <= 0) {
        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      }
    }, 2000);
  }, []);

  const play = useCallback(async () => {
    stopAll();
    setHasError(false);
    setIsLoading(true);

    try {
      const url = await getReciterAudioUrl(prefs.reciterId, prefs.surahNumber);
      const quranAudio = new Audio(url);
      quranAudio.volume = prefs.quranVolume / 100;
      quranAudioRef.current = quranAudio;

      await new Promise<void>((resolve, reject) => {
        quranAudio.addEventListener("canplay", () => resolve(), { once: true });
        quranAudio.addEventListener("error", () => reject(new Error("Audio load failed")), { once: true });
        setTimeout(() => reject(new Error("Timeout")), 15000);
        quranAudio.load();
      });

      if (prefs.natureSound !== "none") {
        const soundOption = NATURE_SOUNDS.find((s) => s.id === prefs.natureSound);
        if (soundOption?.url) {
          const natureAudio = new Audio(soundOption.url);
          natureAudio.volume = prefs.natureVolume / 100;
          natureAudio.loop = true;
          natureAudioRef.current = natureAudio;
          natureAudio.play().catch(() => {});
        }
      }

      const totalSecs = prefs.timerMinutes * 60;
      setRemainingSeconds(totalSecs);

      await quranAudio.play();
      setIsPlaying(true);
      setIsLoading(false);

      await acquireWakeLock();
      await startSession();

      let elapsed = 0;
      timerIntervalRef.current = setInterval(() => {
        elapsed += 1;
        const remaining = totalSecs - elapsed;
        setRemainingSeconds(remaining);

        if (remaining === FADE_OUT_START_SECS) {
          startFadeOut(prefs.quranVolume, prefs.natureVolume);
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
  }, [prefs, stopAll, acquireWakeLock, startSession, startFadeOut, saveSession]);

  const pause = useCallback(() => {
    quranAudioRef.current?.pause();
    natureAudioRef.current?.pause();
    if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }
    if (fadeIntervalRef.current) { clearInterval(fadeIntervalRef.current); fadeIntervalRef.current = null; }
    releaseWakeLock();
    setIsPlaying(false);
  }, [releaseWakeLock]);

  const resume = useCallback(async () => {
    if (!quranAudioRef.current) return;
    await quranAudioRef.current.play().catch(() => {});
    if (natureAudioRef.current) natureAudioRef.current.play().catch(() => {});
    await acquireWakeLock();
    setIsPlaying(true);

    let elapsed = prefs.timerMinutes * 60 - remainingSeconds;
    const totalSecs = prefs.timerMinutes * 60;

    timerIntervalRef.current = setInterval(() => {
      elapsed += 1;
      const remaining = totalSecs - elapsed;
      setRemainingSeconds(remaining);
      if (remaining === FADE_OUT_START_SECS) {
        startFadeOut(prefs.quranVolume, prefs.natureVolume);
      }
      if (remaining <= 0) {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        saveSession(true);
        stopAll();
      }
    }, 1000);
  }, [acquireWakeLock, prefs, remainingSeconds, startFadeOut, saveSession, stopAll]);

  const togglePlay = useCallback(async () => {
    if (isLoading) return;
    if (!isPlaying && !quranAudioRef.current) {
      await play();
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
    if (natureAudioRef.current) {
      natureAudioRef.current.volume = prefs.natureVolume / 100;
    }
  }, [prefs.natureVolume]);

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
    togglePlay,
    stop: () => { saveSession(false); stopAll(); setRemainingSeconds(prefs.timerMinutes * 60); },
  };
}
