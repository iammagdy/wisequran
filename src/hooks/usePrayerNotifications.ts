import { useEffect, useRef } from "react";
import { calculatePrayerTimes, type PrayerTimes, formatArabicTime } from "@/lib/prayer-times";
import { useLocalStorage } from "@/hooks/useLocalStorage";

const PRAYER_NAMES: Record<string, string> = {
  fajr: "الفجر",
  dhuhr: "الظهر",
  asr: "العصر",
  maghrib: "المغرب",
  isha: "العشاء",
};

const PRAYER_ORDER = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function usePrayerNotifications() {
  const [enabled] = useLocalStorage<boolean>("wise-prayer-notifications", false);
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

      for (const id of PRAYER_ORDER) {
        const prayerTime = times[id];
        if (prayerTime === nowTime && !notifiedRef.current.has(id)) {
          notifiedRef.current.add(id);
          new Notification(`حان وقت صلاة ${PRAYER_NAMES[id]} 🕌`, {
            body: formatArabicTime(prayerTime),
            icon: "/icons/icon-192.png",
            dir: "rtl",
            lang: "ar",
          });
        }
      }
    };

    check();
    const interval = setInterval(check, 30_000);
    return () => clearInterval(interval);
  }, [enabled]);
}
