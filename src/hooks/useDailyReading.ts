import { useLocalStorage } from "./useLocalStorage";
import { useCallback, useRef } from "react";
import { useDeviceId } from "./useDeviceId";
import { enqueuedSupabaseWrite } from "@/lib/syncQueue";
import { isSupabaseConfigured } from "@/lib/supabase";

interface DailyReadingData {
  date: string;
  count: number;
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function useDailyReading() {
  const [goal, setGoal] = useLocalStorage<number>("wise-daily-goal", 10);
  const [data, setData] = useLocalStorage<DailyReadingData>("wise-daily-reading", {
    date: getTodayKey(),
    count: 0,
  });
  const deviceId = useDeviceId();

  // Keep a ref always pointing at the latest data so rapid increment calls
  // never read stale closure values between React re-renders.
  const dataRef = useRef(data);
  dataRef.current = data;

  const today = getTodayKey();
  const todayCount = data.date === today ? data.count : 0;

  const increment = useCallback(
    (n: number) => {
      const currentDate = getTodayKey();
      const prev = dataRef.current;
      const newCount = prev.date === currentDate ? prev.count + n : n;
      const next: DailyReadingData = { date: currentDate, count: newCount };
      // Optimistically update ref so back-to-back calls accumulate correctly
      // even before React has re-rendered with the new state.
      dataRef.current = next;
      setData(next);
      if (isSupabaseConfigured) {
        enqueuedSupabaseWrite(
          "device_daily_reading",
          "upsert",
          { device_id: deviceId, date: next.date, count: next.count, updated_at: new Date().toISOString() },
          { onConflict: "device_id,date" }
        );
      }
    },
    [setData, deviceId]
  );

  return { goal, setGoal, todayCount, increment };
}
