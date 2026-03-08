import { useMemo } from "react";
import { motion } from "framer-motion";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useStreak } from "@/hooks/useStreak";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const PRAYERS = [
  { id: "fajr", name: "الفجر", nameEn: "Fajr", icon: "🌅" },
  { id: "dhuhr", name: "الظهر", nameEn: "Dhuhr", icon: "☀️" },
  { id: "asr", name: "العصر", nameEn: "Asr", icon: "🌤" },
  { id: "maghrib", name: "المغرب", nameEn: "Maghrib", icon: "🌅" },
  { id: "isha", name: "العشاء", nameEn: "Isha", icon: "🌙" },
];

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

interface DayData {
  date: string;
  completed: string[];
}

export default function PrayerPage() {
  const [data, setData] = useLocalStorage<DayData>("wise-prayer-today", {
    date: getTodayKey(),
    completed: [],
  });

  const [weekData, setWeekData] = useLocalStorage<Record<string, string[]>>("wise-prayer-week", {});
  const { streak } = useStreak();

  const todayData = useMemo(() => {
    const today = getTodayKey();
    if (data.date !== today) {
      const newWeek = { ...weekData, [data.date]: data.completed };
      setWeekData(newWeek);
      const fresh = { date: today, completed: [] };
      setData(fresh);
      return fresh;
    }
    return data;
  }, [data]);

  const togglePrayer = (prayerId: string) => {
    const newCompleted = todayData.completed.includes(prayerId)
      ? todayData.completed.filter((p) => p !== prayerId)
      : [...todayData.completed, prayerId];
    setData({ ...todayData, completed: newCompleted });
  };

  const progress = (todayData.completed.length / PRAYERS.length) * 100;

  const last7 = useMemo(() => {
    const days: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const count =
        key === getTodayKey()
          ? todayData.completed.length
          : (weekData[key]?.length || 0);
      days.push({ date: key, count });
    }
    return days;
  }, [todayData, weekData]);

  const dayNames = ["أحد", "إثن", "ثلا", "أرب", "خمي", "جمع", "سبت"];

  return (
    <div className="px-4 pt-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-bold">صلواتي اليوم</h1>
          <p className="text-sm text-muted-foreground">Daily Prayer Checklist</p>
        </div>
        {streak > 0 && (
          <span className="rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
            🔥 {streak} أيام
          </span>
        )}
      </div>

      {/* Progress */}
      <div className="mb-6 rounded-xl bg-card p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{todayData.completed.length}/{PRAYERS.length}</span>
          <span className="font-semibold">
            {progress === 100 ? "ما شاء الله! 🎉" : "أكمل صلواتك"}
          </span>
        </div>
        <Progress value={progress} className="h-2.5" />
      </div>

      {/* Prayer List */}
      <div className="space-y-3 mb-8">
        {PRAYERS.map((prayer, i) => {
          const done = todayData.completed.includes(prayer.id);
          return (
            <motion.button
              key={prayer.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => togglePrayer(prayer.id)}
              className={cn(
                "flex w-full items-center gap-4 rounded-xl p-4 shadow-sm transition-all",
                done ? "bg-primary/10" : "bg-card"
              )}
            >
              <span className="text-2xl">{prayer.icon}</span>
              <div className="flex-1 text-right">
                <p className={cn("font-semibold", done && "line-through text-muted-foreground")}>
                  {prayer.name}
                </p>
                <p className="text-xs text-muted-foreground">{prayer.nameEn}</p>
              </div>
              <Checkbox checked={done} className="h-6 w-6" />
            </motion.button>
          );
        })}
      </div>

      {/* Weekly View */}
      <div className="rounded-xl bg-card p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold">آخر 7 أيام</h2>
        <div className="flex items-end justify-between gap-1">
          {last7.map((day) => {
            const d = new Date(day.date);
            const dayName = dayNames[d.getDay()];
            const pct = (day.count / 5) * 100;
            return (
              <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
                <div className="relative h-20 w-full rounded-md bg-muted overflow-hidden">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${pct}%` }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="absolute bottom-0 w-full rounded-md bg-primary/70"
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">{dayName}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
