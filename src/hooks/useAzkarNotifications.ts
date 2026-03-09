import { useEffect, useRef } from "react";
import { calculatePrayerTimes, type PrayerTimes } from "@/lib/prayer-times";
import { useLocalStorage } from "@/hooks/useLocalStorage";

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
      const cairoNow = new Date(now.toLocaleString("en-US", { timeZone: "Africa/Cairo" }));
      const nowHH = cairoNow.getHours().toString().padStart(2, "0");
      const nowMM = cairoNow.getMinutes().toString().padStart(2, "0");
      const nowTime = `${nowHH}:${nowMM}`;

      const times: PrayerTimes = calculatePrayerTimes(now);

      // Check Fajr for morning azkar
      if (times.fajr === nowTime && !notifiedRef.current.has("morning")) {
        notifiedRef.current.add("morning");
        new Notification(`حان وقت ${AZKAR_TIMES.fajr.name} ${AZKAR_TIMES.fajr.icon}`, {
          body: "ابدأ يومك بذكر الله",
          icon: "/icons/icon-192.png",
          dir: "rtl",
          lang: "ar",
        });
      }

      // Check Maghrib for evening azkar
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
  }, [enabled]);
}
