import { useEffect, useRef } from "react";
import { calculatePrayerTimes, type PrayerTimes } from "@/lib/prayer-times";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useLocation } from "@/hooks/useLocation";

const AZKAR_TIMES = {
  fajr: { id: "morning", name: "أذكار الصباح", icon: "🌅" },
  maghrib: { id: "evening", name: "أذكار المساء", icon: "🌙" },
} as const;

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function useAzkarNotifications() {
  const [enabled] = useLocalStorage<boolean>("wise-azkar-notifications", false);
  const { location } = useLocation();
  const notifiedRef = useRef<Set<string>>(new Set());
  const lastDayRef = useRef(todayKey());

  useEffect(() => {
    if (!enabled) return;
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    const check = () => {
      const today = todayKey();
      if (today !== lastDayRef.current) {
        notifiedRef.current.clear();
        lastDayRef.current = today;
      }

      const now = new Date();
      const nowHH = now.getHours().toString().padStart(2, "0");
      const nowMM = now.getMinutes().toString().padStart(2, "0");
      const nowTime = `${nowHH}:${nowMM}`;

      const options = location
        ? { latitude: location.latitude, longitude: location.longitude }
        : {};
      const times: PrayerTimes = calculatePrayerTimes(now, options);

      if (times.fajr === nowTime && !notifiedRef.current.has("morning")) {
        notifiedRef.current.add("morning");
        new Notification(`حان وقت ${AZKAR_TIMES.fajr.name} ${AZKAR_TIMES.fajr.icon}`, {
          body: "ابدأ يومك بذكر الله",
          icon: "/icons/icon-192.png",
          dir: "rtl",
          lang: "ar",
        });
      }

      if (times.maghrib === nowTime && !notifiedRef.current.has("evening")) {
        notifiedRef.current.add("evening");
        new Notification(`حان وقت ${AZKAR_TIMES.maghrib.name} ${AZKAR_TIMES.maghrib.icon}`, {
          body: "اختم يومك بذكر الله",
          icon: "/icons/icon-192.png",
          dir: "rtl",
          lang: "ar",
        });
      }
    };

    check();
    const interval = setInterval(check, 30_000);
    return () => clearInterval(interval);
  }, [enabled, location]);
}
