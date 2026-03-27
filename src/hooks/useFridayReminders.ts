import { useEffect } from "react";
import { showAppNotification } from "@/lib/notifications";

const ENABLED_KEY = "wise-friday-reminder-enabled";
const LAST_FIRED_KEY = "wise-friday-reminder-last-fired";

function getTodayKey() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isFridayNow() {
  return new Date().getDay() === 5;
}

export function useFridayReminders() {
  useEffect(() => {
    const checkReminder = () => {
      const enabled = localStorage.getItem(ENABLED_KEY) === "true";
      if (!enabled || !isFridayNow()) return;

      const now = new Date();
      const currentHour = now.getHours();
      const today = getTodayKey();
      const lastFired = localStorage.getItem(LAST_FIRED_KEY);

      if (currentHour < 7 || lastFired === today) return;

      showAppNotification("جمعة مباركة", {
        body: "افتح وضع الجمعة لقراءة سورة الكهف والإكثار من الصلاة على النبي ﷺ",
        dir: "rtl",
        lang: "ar",
        tag: `wise-friday-reminder-${today}`,
      }).then((shown) => {
        if (shown) {
          localStorage.setItem(LAST_FIRED_KEY, today);
        }
      });
    };

    checkReminder();
    const interval = window.setInterval(checkReminder, 60_000);
    return () => window.clearInterval(interval);
  }, []);
}