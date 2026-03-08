import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, X } from "lucide-react";
import { toast } from "sonner";

const PRESETS = [5, 10, 15, 20]; // minutes

export default function ReadingTimer() {
  const [active, setActive] = useState(false);
  const [remaining, setRemaining] = useState(0); // seconds
  const [totalSeconds, setTotalSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
          toast("انتهى وقت القراءة 📖", { duration: 5000 });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [active]);

  const pct = totalSeconds > 0 ? ((totalSeconds - remaining) / totalSeconds) * 100 : 0;

  const formatRemaining = () => {
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="rounded-xl bg-card p-3 shadow-sm">
      <div className="mb-2 flex items-center gap-2" dir="rtl">
        <Timer className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">مؤقت القراءة</span>
      </div>

      <AnimatePresence mode="wait">
        {!active ? (
          <motion.div
            key="presets"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex gap-2" dir="rtl"
          >
            {PRESETS.map((m) => (
              <button
                key={m}
                onClick={() => start(m)}
                className="flex-1 rounded-lg bg-muted py-2 text-xs font-medium text-foreground transition-colors hover:bg-primary/10"
              >
                {m} د
              </button>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="timer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between" dir="rtl">
              <span className="font-arabic text-lg font-bold tabular-nums text-foreground">
                {formatRemaining()}
              </span>
              <button
                onClick={stop}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-primary"
                style={{ width: `${pct}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
