import { useEffect, useRef, useCallback } from "react";
import { calculatePrayerTimes, type PrayerTimes } from "@/lib/prayer-times";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useLocation } from "@/hooks/useLocation";
import {
  ADHAN_STORAGE_KEY,
  DEFAULT_ADHAN_SETTINGS,
  ADHAN_VOICES,
  TAKBIR_URL,
  type AdhanSettings,
} from "@/lib/adhan-settings";
import { mobileAudioManager } from "@/lib/mobile-audio";
import { showAppNotification } from "@/lib/notifications";

const PRAYER_ORDER = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;
const PLAYED_STORAGE_KEY = "wise-adhan-played-events";
const MISSED_PRAYER_GRACE_MINUTES = 15;

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function loadPlayedEvents(day: string) {
  try {
    const raw = localStorage.getItem(PLAYED_STORAGE_KEY);
    if (!raw) return new Set<string>();
    const parsed = JSON.parse(raw) as { day?: string; keys?: string[] };
    if (parsed.day !== day) return new Set<string>();
    return new Set(parsed.keys ?? []);
  } catch {
    return new Set<string>();
  }
}

function savePlayedEvents(day: string, keys: Set<string>) {
  localStorage.setItem(PLAYED_STORAGE_KEY, JSON.stringify({ day, keys: Array.from(keys) }));
}

let activeAudio: HTMLAudioElement | null = null;

export function stopAdhan() {
  if (activeAudio) {
    mobileAudioManager.stop("alarm");
    activeAudio = null;
  }
}

export function useAdhan() {
  const [settings] = useLocalStorage<AdhanSettings>(ADHAN_STORAGE_KEY, DEFAULT_ADHAN_SETTINGS);
  const { location } = useLocation();
  const playedRef = useRef<Set<string>>(loadPlayedEvents(todayKey()));
  const lastDayRef = useRef(todayKey());

  const playAdhan = useCallback(async (prayerId: string, vol: number, isCatchUp = false) => {
    stopAdhan();
    const voice = ADHAN_VOICES.find((v) => v.id === settings.voiceId) ?? ADHAN_VOICES[0];
    let src: string;
    if (settings.takbirOnlyMode) {
      src = TAKBIR_URL;
    } else if (prayerId === "fajr" && settings.fajrSpecialAdhan) {
      src = voice.fajrFile;
    } else {
      src = voice.file;
    }

    try {
      const audio = await mobileAudioManager.play("alarm", src, {
        volume: Math.max(0, Math.min(1, vol / 100)),
        resetTime: true,
      });
      activeAudio = audio;
    } catch (err) {
      console.error("[Adhan] Failed to play audio:", src, err);
      activeAudio = null;
    }

    const shouldNotify = document.visibilityState !== "visible" || isCatchUp;
    if (shouldNotify) {
      await showAppNotification(`حان وقت صلاة ${prayerId === "fajr" ? "الفجر" : prayerId === "dhuhr" ? "الظهر" : prayerId === "asr" ? "العصر" : prayerId === "maghrib" ? "المغرب" : "العشاء"} 🕌`, {
        body: isCatchUp ? "تم تشغيل الأذان فور عودة التطبيق للواجهة" : "الأذان يعمل الآن",
        dir: "rtl",
        lang: "ar",
        tag: `wise-adhan-${todayKey()}-${prayerId}`,
      });
    }
  }, [settings.voiceId, settings.takbirOnlyMode, settings.fajrSpecialAdhan]);

  useEffect(() => {
    if (!settings.adhanEnabled) return;

    const syncDay = (today: string) => {
      if (today !== lastDayRef.current) {
        lastDayRef.current = today;
        playedRef.current = loadPlayedEvents(today);
      }
    };

    const markPlayed = (today: string, key: string) => {
      playedRef.current.add(key);
      savePlayedEvents(today, playedRef.current);
    };

    const check = (allowCatchUp: boolean) => {
      const today = todayKey();
      syncDay(today);

      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const options = location
        ? { latitude: location.latitude, longitude: location.longitude }
        : {};
      const times: PrayerTimes = calculatePrayerTimes(now, options);

      for (const id of PRAYER_ORDER) {
        const prayerTime = times[id];
        const key = `${today}-${id}`;
        const perConfig = settings.perPrayer?.[id];
        const adhanAllowed = perConfig?.adhanEnabled !== false;
        const [ph, pm] = prayerTime.split(":").map(Number);
        const prayerMinutes = ph * 60 + pm;
        const diff = currentMinutes - prayerMinutes;
        const shouldPlayNow = diff >= 0 && diff < 2;
        const shouldRecoverMissed = allowCatchUp && diff >= 2 && diff <= MISSED_PRAYER_GRACE_MINUTES;

        if (!playedRef.current.has(key) && adhanAllowed && (shouldPlayNow || shouldRecoverMissed)) {
          markPlayed(today, key);
          playAdhan(id, settings.adhanVolume, shouldRecoverMissed);
        }
      }
    };

    check(true);
    const interval = setInterval(() => check(false), 15_000);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        check(true);
      }
    };

    window.addEventListener("focus", onVisibilityChange);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onVisibilityChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [settings, location, playAdhan]);
}
