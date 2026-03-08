import { useLocalStorage } from "./useLocalStorage";
import { useCallback } from "react";

interface StreakData {
  current: number;
  lastActiveDate: string;
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getYesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function useStreak() {
  const [data, setData] = useLocalStorage<StreakData>("wise-streak", {
    current: 0,
    lastActiveDate: "",
  });

  const streak = (() => {
    const today = getTodayKey();
    const yesterday = getYesterdayKey();
    if (data.lastActiveDate === today || data.lastActiveDate === yesterday) {
      return data.current;
    }
    return 0;
  })();

  const markActive = useCallback(() => {
    const today = getTodayKey();
    setData((prev) => {
      if (prev.lastActiveDate === today) return prev;
      if (prev.lastActiveDate === getYesterdayKey()) {
        return { current: prev.current + 1, lastActiveDate: today };
      }
      return { current: 1, lastActiveDate: today };
    });
  }, [setData]);

  return { streak, markActive };
}
