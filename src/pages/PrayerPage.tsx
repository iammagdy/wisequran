import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useStreak } from "@/hooks/useStreak";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { cn, getArabicDayName, getHijriDate, getGregorianDateArabic, toArabicNumerals } from "@/lib/utils";
import {
  calculatePrayerTimes,
  formatArabicTime,
  getNextPrayer,
  getSecondsUntilPrayer,
  type PrayerTimes,
  type NextPrayerInfo,
} from "@/lib/prayer-times";

const PRAYERS = [
  { id: "fajr", name: "الفجر", icon: "🌅" },
  { id: "dhuhr", name: "الظهر", icon: "☀️" },
  { id: "asr", name: "العصر", icon: "🌤" },
  { id: "maghrib", name: "المغرب", icon: "🌅" },
  { id: "isha", name: "العشاء", icon: "🌙" },
];

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

interface DayData {
  date: string;
  completed: string[];
}


function formatHMS(totalSeconds: number): { h: string; m: string; s: string } {
  const abs = Math.max(0, totalSeconds);
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const s = abs % 60;
  return {
    h: h.toString().padStart(2, "0"),
    m: m.toString().padStart(2, "0"),
    s: s.toString().padStart(2, "0"),
  };
}

function formatCompactCountdown(totalSeconds: number): string {
  if (totalSeconds <= 0) return "";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0) return toArabicNumerals(`${h}:${m.toString().padStart(2, "0")}`);
  return `${toArabicNumerals(String(m))} د`;
}

export default function PrayerPage() {
  const [data, setData] = useLocalStorage<DayData>("wise-prayer-today", {
    date: getTodayKey(),
    completed: [],
  });

  
  const { streak } = useStreak();

  const [now, setNow] = useState(() => new Date());
  const prayerTimes = useMemo(() => calculatePrayerTimes(now), [now]);
  const nextPrayer = useMemo(() => getNextPrayer(prayerTimes, now), [prayerTimes, now]);

  // Update every second for live countdown
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const todayData = useMemo(() => {
    const today = getTodayKey();
    if (data.date !== today) {
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


  // Hero countdown data
  const heroTime = nextPrayer ? formatHMS(nextPrayer.secondsLeft) : null;
  const heroPrayer = nextPrayer ? PRAYERS.find(p => p.id === nextPrayer.id) : null;

  return (
    <div className="px-4 pt-6">
      {/* Header */}
      <h1 className="mb-3 text-center text-2xl font-bold">صلواتي اليوم</h1>

      <div className="mb-4 rounded-xl bg-card p-4 shadow-sm text-center space-y-1">
        <p className="text-lg font-bold">{getArabicDayName(new Date().getDay())}</p>
        <p className="text-base font-medium">{getHijriDate(new Date())}</p>
        <p className="text-sm text-muted-foreground">{getGregorianDateArabic(new Date())}</p>
      </div>

      {/* Hero Countdown Widget */}
      {nextPrayer && heroPrayer && heroTime && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-5 shadow-md border border-primary/10"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">الصلاة القادمة</span>
            {streak > 0 && (
              <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                🔥 {toArabicNumerals(String(streak))} أيام
              </span>
            )}
          </div>

          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="text-3xl">{heroPrayer.icon}</span>
            <span className="text-2xl font-bold text-foreground">{heroPrayer.name}</span>
          </div>

          {/* Big countdown */}
          <div className="flex items-center justify-center gap-1 font-mono">
            <CountdownUnit value={heroTime.h} label="ساعة" />
            <span className="text-3xl font-bold text-primary/60 -mt-4">:</span>
            <CountdownUnit value={heroTime.m} label="دقيقة" />
            <span className="text-3xl font-bold text-primary/60 -mt-4">:</span>
            <CountdownUnit value={heroTime.s} label="ثانية" />
          </div>
        </motion.div>
      )}

      {/* Progress */}
      <div className="mb-6 rounded-xl bg-card p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{toArabicNumerals(`${todayData.completed.length}/${PRAYERS.length}`)}</span>
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
          const isNext = nextPrayer?.id === prayer.id && !done;
          const time = prayerTimes[prayer.id as keyof PrayerTimes];
          const secsLeft = getSecondsUntilPrayer(time, now);
          const isPassed = secsLeft <= 0;
          return (
            <motion.button
              key={prayer.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => togglePrayer(prayer.id)}
              className={cn(
                "flex w-full items-center gap-4 rounded-xl p-4 shadow-sm transition-all",
                done
                  ? "bg-primary/10"
                  : isNext
                    ? "bg-card ring-2 ring-primary/30"
                    : "bg-card"
              )}
            >
              <span className="text-2xl">{prayer.icon}</span>
              <div className="flex-1 text-right">
                <p className={cn("font-semibold", done && "line-through text-muted-foreground")}>
                  {prayer.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatArabicTime(time)}
                </p>
              </div>
              {/* Countdown badge for upcoming prayers */}
              {!done && !isPassed && (
                <span className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums",
                  isNext
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}>
                  {formatCompactCountdown(secsLeft)}
                </span>
              )}
              {done && (
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                  ✓
                </span>
              )}
              <Checkbox checked={done} className="h-6 w-6" />
            </motion.button>
          );
        })}
      </div>

    </div>
  );
}

/** Single countdown digit unit */
function CountdownUnit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <motion.div
        key={value}
        initial={{ y: -8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="rounded-xl bg-primary/10 px-3 py-2 min-w-[52px]"
      >
        <span className="text-3xl font-bold text-primary tabular-nums">{toArabicNumerals(value)}</span>
      </motion.div>
      <span className="text-[10px] text-muted-foreground mt-1">{label}</span>
    </div>
  );
}
