import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { toast } from "sonner";
import { toArabicNumerals } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

const PRESETS = [5, 10, 15, 20];

export default function ReadingTimer() {
  const [active, setActive] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { t, language } = useLanguage();

  const start = useCallback((minutes: number) => {
    const secs = minutes * 60;
    setTotalSeconds(secs);
    setRemaining(secs);
    setActive(true);
  }, []);

  const stop = useCallback(() => {
    setActive(false);
    setRemaining(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  useEffect(() => {
    if (!active) return;

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          setActive(false);
          toast(t("reading_time_up"), { duration: 5000 });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [active, t]);

  const pct = totalSeconds > 0 ? ((totalSeconds - remaining) / totalSeconds) * 100 : 0;

  const formatRemaining = () => {
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    return toArabicNumerals(`${m}:${s.toString().padStart(2, "0")}`);
  };

  return (
    <AnimatePresence mode="wait">
      {!active ? (
        <motion.div
          key="presets"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex gap-2"
        >
          {PRESETS.map((m) => (
            <button
              key={m}
              onClick={() => start(m)}
              className="flex-1 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-primary/10 hover:text-primary"
            >
              {language === "en" ? `${m} ${t("minutes_abbr")}` : `${toArabicNumerals(m)} ${t("minutes_abbr")}`}
            </button>
          ))}
        </motion.div>
      ) : (
        <motion.div
          key="timer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="space-y-1.5"
        >
          <div className="flex items-center justify-between">
            <span className="font-arabic text-base font-bold tabular-nums text-foreground">
              {formatRemaining()}
            </span>
            <button
              onClick={stop}
              className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-primary"
              style={{ width: `${pct}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
