import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useStreak } from "@/hooks/useStreak";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { cn, getArabicDayName, getHijriDate, getGregorianDateArabic, toArabicNumerals } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Compass } from "lucide-react";
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
  const navigate = useNavigate();
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
    <div className="px-4 pt-6 pb-24">
      {/* Header */}
      <h1 className="mb-4 text-center text-2xl font-bold heading-decorated mx-auto w-fit">صلواتي اليوم</h1>

      {/* Date Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5 rounded-2xl bg-card p-5 shadow-elevated text-center space-y-1 border border-border/50"
      >
        <p className="text-lg font-bold">{getArabicDayName(new Date().getDay())}</p>
        <p className="text-base font-semibold text-primary">{getHijriDate(new Date())}</p>
        <p className="text-sm text-muted-foreground">{getGregorianDateArabic(new Date())}</p>
      </motion.div>

      {/* Hero Countdown Widget */}
      {nextPrayer && heroPrayer && heroTime && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 rounded-2xl gradient-hero p-6 shadow-elevated border border-primary/10 relative overflow-hidden"
        >
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary blur-3xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-accent blur-2xl" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-muted-foreground">الصلاة القادمة</span>
              {streak > 0 && (
                <span className="rounded-full badge-gradient px-3 py-1 text-xs font-bold">
                  🔥 {toArabicNumerals(String(streak))} أيام
                </span>
              )}
            </div>

            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="text-4xl">{heroPrayer.icon}</span>
              <span className="text-2xl font-bold text-foreground">{heroPrayer.name}</span>
            </div>

            {/* Big countdown */}
            <div className="flex items-center justify-center gap-2">
              <CountdownUnit value={heroTime.h} label="ساعة" />
              <span className="text-3xl font-bold text-primary/40 -mt-5">:</span>
              <CountdownUnit value={heroTime.m} label="دقيقة" />
              <span className="text-3xl font-bold text-primary/40 -mt-5">:</span>
              <CountdownUnit value={heroTime.s} label="ثانية" />
            </div>
          </div>
        </motion.div>
      )}

      {/* Progress Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 rounded-2xl bg-card p-5 shadow-elevated border border-border/50"
      >
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="text-muted-foreground font-medium">{toArabicNumerals(`${todayData.completed.length}/${PRAYERS.length}`)}</span>
          <span className="font-bold">
            {progress === 100 ? "ما شاء الله! 🎉" : "أكمل صلواتك"}
          </span>
        </div>
        <Progress value={progress} variant="gradient" size="default" />
      </motion.div>

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
              whileTap={{ scale: 0.98 }}
              onClick={() => togglePrayer(prayer.id)}
              className={cn(
                "flex w-full items-center gap-4 rounded-2xl p-4 shadow-soft transition-all",
                done
                  ? "bg-primary/10 border border-primary/20"
                  : isNext
                    ? "bg-card ring-2 ring-primary/30 shadow-elevated"
                    : "bg-card border border-border/50"
              )}
            >
              <span className="text-2xl">{prayer.icon}</span>
              <div className="flex-1 text-right">
                <p className={cn("font-bold", done && "line-through text-muted-foreground")}>
                  {prayer.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatArabicTime(time)}
                </p>
              </div>
              {/* Countdown badge for upcoming prayers */}
              {!done && !isPassed && (
                <span className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-bold tabular-nums",
                  isNext
                    ? "badge-gradient"
                    : "bg-muted text-muted-foreground"
                )}>
                  {formatCompactCountdown(secsLeft)}
                </span>
              )}
              {done && (
                <span className="rounded-full bg-primary/15 px-3 py-1.5 text-xs font-bold text-primary">
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
        className="rounded-xl bg-card shadow-elevated px-4 py-3 min-w-[56px] border border-border/50"
      >
        <span className="text-3xl font-bold text-primary tabular-nums">{toArabicNumerals(value)}</span>
      </motion.div>
      <span className="text-[10px] text-muted-foreground mt-1.5 font-medium">{label}</span>
    </div>
  );
}
