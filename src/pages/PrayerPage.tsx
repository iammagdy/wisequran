import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useStreak } from "@/hooks/useStreak";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { cn, getDayName, getHijriDateLocalized, getGregorianDateLocalized, toArabicNumerals } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Compass, MapPin, ChevronLeft } from "lucide-react";
import PrayerGuideCard from "@/components/prayer/PrayerGuideCard";
import {
  calculatePrayerTimes,
  formatLocalizedTime,
  getNextPrayer,
  getSecondsUntilPrayer,
  type PrayerTimes,
  type NextPrayerInfo,
  type CalculationMethod } from
"@/lib/prayer-times";
import { useLanguage } from "@/contexts/LanguageContext";

const PRAYERS = [
{ id: "fajr", icon: "🌅" },
{ id: "dhuhr", icon: "☀️" },
{ id: "asr", icon: "🌤" },
{ id: "maghrib", icon: "🌅" },
{ id: "isha", icon: "🌙" }];


function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

interface DayData {
  date: string;
  completed: string[];
}

function formatHMS(totalSeconds: number): {h: string;m: string;s: string;} {
  const abs = Math.max(0, totalSeconds);
  const h = Math.floor(abs / 3600);
  const m = Math.floor(abs % 3600 / 60);
  const s = abs % 60;
  return {
    h: h.toString().padStart(2, "0"),
    m: m.toString().padStart(2, "0"),
    s: s.toString().padStart(2, "0")
  };
}

function formatCompactCountdown(totalSeconds: number, language: string): string {
  if (totalSeconds <= 0) return "";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor(totalSeconds % 3600 / 60);
  if (language === "en") {
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}`;
    return `${m}m`;
  }
  if (h > 0) return toArabicNumerals(`${h}:${m.toString().padStart(2, "0")}`);
  return `${toArabicNumerals(String(m))} د`;
}

export default function PrayerPage() {
  const { t, language, isRTL } = useLanguage();
  const navigate = useNavigate();
  const [data, setData] = useLocalStorage<DayData>("wise-prayer-today", {
    date: getTodayKey(),
    completed: []
  });
  const [calcMethod] = useLocalStorage<CalculationMethod>("wise-prayer-method", "egyptian");

  // Read cached location (no GPS prompt) for prayer times & city display
  const cachedLocation = useMemo(() => {
    try {
      const cached = localStorage.getItem("wise-user-location");
      if (cached) return JSON.parse(cached) as {latitude: number;longitude: number;city?: string;};
    } catch (error) {
      console.error("Error parsing cached location for prayer times:", error);
    }
    return null;
  }, []);

  const { streak } = useStreak();

  const [now, setNow] = useState(() => new Date());
  const prayerTimes = useMemo(() => calculatePrayerTimes(now, {
    latitude: cachedLocation?.latitude,
    longitude: cachedLocation?.longitude,
    method: calcMethod
  }), [now, cachedLocation?.latitude, cachedLocation?.longitude, calcMethod]);
  const nextPrayer = useMemo(() => getNextPrayer(prayerTimes, now), [prayerTimes, now]);

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
  }, [data, setData]);

  const togglePrayer = (prayerId: string) => {
    const newCompleted = todayData.completed.includes(prayerId) ?
    todayData.completed.filter((p) => p !== prayerId) :
    [...todayData.completed, prayerId];
    setData({ ...todayData, completed: newCompleted });
  };

  const progress = todayData.completed.length / PRAYERS.length * 100;

  const heroTime = nextPrayer ? formatHMS(nextPrayer.secondsLeft) : null;
  const heroPrayer = nextPrayer ? PRAYERS.find((p) => p.id === nextPrayer.id) : null;

  return (
    <div className="px-4 pt-6 pl-1.5 pb-5" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div />
        <h1 className="text-2xl font-bold heading-decorated">{t("prayers_title")}</h1>
        <div />
      </div>

      {/* Location indicator */}
      {cachedLocation?.city &&
      <div className="flex items-center justify-center gap-1.5 mb-3 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span>{cachedLocation.city}</span>
        </div>
      }

      {/* Date Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-3 rounded-2xl bg-card p-3.5 shadow-elevated text-center space-y-0.5 border border-border/50 pb-1.5 pt-1.5">

        <p className="text-base font-bold">{getDayName(new Date().getDay(), language)}</p>
        <p className="text-sm font-semibold text-primary">{getHijriDateLocalized(new Date(), language)}</p>
        <p className="text-muted-foreground text-sm">{getGregorianDateLocalized(new Date(), language)}</p>
      </motion.div>

      {/* Qibla Banner — compact, prominent */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate("/qibla")}
        className="w-full rounded-2xl gradient-hero p-3 shadow-elevated border border-primary/10 flex items-center gap-3 text-right pb-1.5 pt-1.5 bg-[#D4AF37]/20 mb-2.5 mt-2.5">

        <div className="rounded-xl bg-primary/15 p-2.5">
          <Compass className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold">{t("qibla_banner")}</p>
          <p className="text-xs text-muted-foreground">{t("qibla_subtitle")}</p>
        </div>
        <ChevronLeft className="h-4 w-4 text-muted-foreground" />
      </motion.button>

      {/* Hero Countdown Widget */}
      {nextPrayer && heroPrayer && heroTime &&
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl gradient-hero p-4 shadow-elevated border border-primary/10 relative overflow-hidden pb-1.5 pt-1.5 mb-2.5">

          <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary blur-3xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-accent blur-2xl" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground">{t("next_prayer")}</span>
              {streak > 0 &&
            <span className="rounded-full badge-gradient px-2.5 py-0.5 text-xs font-bold">
                  🔥 {language === "ar" ? toArabicNumerals(String(streak)) : streak} {t("days_streak")}
                </span>
            }
            </div>

            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-3xl">{heroPrayer.icon}</span>
              <span className="text-xl font-bold text-foreground">{t(heroPrayer.id as any)}</span>
            </div>

            <div className="flex items-center justify-center gap-2">
              <CountdownUnit value={heroTime.h} label={t("hour")} />
              <span className="text-2xl font-bold text-primary/40 -mt-4">:</span>
              <CountdownUnit value={heroTime.m} label={t("minute")} />
              <span className="text-2xl font-bold text-primary/40 -mt-4">:</span>
              <CountdownUnit value={heroTime.s} label={t("second")} />
            </div>
          </div>
        </motion.div>
      }

      {/* Progress Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl bg-card p-3.5 shadow-elevated border border-border/50 pt-[5px] pb-[5px] mb-[10px]">

        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground font-medium">{language === "ar" ? toArabicNumerals(`${todayData.completed.length}/${PRAYERS.length}`) : `${todayData.completed.length}/${PRAYERS.length}`}</span>
          <span className="font-bold">
            {progress === 100 ? t("prayers_complete") : t("complete_prayers")}
          </span>
        </div>
        <Progress value={progress} variant="gradient" size="default" />
      </motion.div>

      {/* Prayer List */}
      <div className="space-y-2.5 mb-6">
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
                "flex w-full items-center gap-3 rounded-2xl p-3 shadow-soft transition-all",
                done ?
                "bg-primary/10 border border-primary/20" :
                isNext ?
                "bg-card ring-2 ring-primary/30 shadow-elevated" :
                "bg-card border border-border/50"
              )}>

              <span className="text-xl">{prayer.icon}</span>
              <div className="flex-1 text-right">
                <p className={cn("font-bold text-sm", done && "line-through text-muted-foreground")}>
                  {t(prayer.id as any)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatLocalizedTime(time, language)}
                </p>
              </div>
              {!done && !isPassed &&
              <span className={cn(
                "rounded-full px-2.5 py-1 text-xs font-bold tabular-nums",
                isNext ?
                "badge-gradient" :
                "bg-muted text-muted-foreground"
              )}>
                  {formatCompactCountdown(secsLeft, language)}
                </span>
              }
              {done &&
              <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-bold text-primary">
                  ✓
                </span>
              }
              <Checkbox checked={done} className="h-5 w-5" />
            </motion.button>);

        })}
      </div>

      {/* Prayer Guide */}
      <PrayerGuideCard />

    </div>);

}

/** Single countdown digit unit */
function CountdownUnit({ value, label }: {value: string;label: string;}) {
  const { language } = useLanguage();
  return (
    <div className="flex flex-col items-center">
      <motion.div
        key={value}
        initial={{ y: -6, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="rounded-xl bg-card shadow-elevated px-3 py-2 min-w-[48px] border border-border/50">

        <span className="text-2xl font-bold text-primary tabular-nums">{language === "ar" ? toArabicNumerals(value) : value}</span>
      </motion.div>
      <span className="text-[0.625rem] text-muted-foreground mt-1 font-medium">{label}</span>
    </div>);

}
