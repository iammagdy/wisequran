import { useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { RotateCcw, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { toArabicNumerals } from "@/lib/utils";

const DHIKR_OPTIONS = [
  "سبحان الله",
  "الحمد لله",
  "الله أكبر",
  "لا إله إلا الله",
  "أستغفر الله",
];

const TARGET_OPTIONS = [33, 99, 100, 500, 1000];

function getTodayKey() {
  return `wise-tasbeeh-total-${new Date().toISOString().slice(0, 10)}`;
}

export default function TasbeehPage() {
  const [target, setTarget] = useLocalStorage("wise-tasbeeh-target", 33);
  const [count, setCount] = useLocalStorage("wise-tasbeeh-count", 0);
  const [dhikr, setDhikr] = useLocalStorage("wise-tasbeeh-dhikr", DHIKR_OPTIONS[0]);
  const [todayTotal, setTodayTotal] = useLocalStorage(getTodayKey(), 0);
  const [showTargetPicker, setShowTargetPicker] = useState(false);

  const progress = useMemo(() => Math.min(count / target, 1), [count, target]);

  const handleTap = useCallback(() => {
    if (navigator.vibrate) navigator.vibrate(10);
    setCount((c) => c + 1);
    setTodayTotal((t) => t + 1);
  }, [setCount, setTodayTotal]);

  const handleReset = useCallback(() => {
    setCount(0);
  }, [setCount]);

  // SVG progress ring
  const radius = 110;
  const stroke = 6;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center px-4 pt-6 pb-24 min-h-[calc(100dvh-4rem)]" dir="rtl">
      {/* Header */}
      <h1 className="text-2xl font-bold text-foreground mb-4">التسبيح</h1>

      {/* Dhikr selector */}
      <Select value={dhikr} onValueChange={(v) => { setDhikr(v); setCount(0); }}>
        <SelectTrigger className="w-56 text-center justify-center text-base font-semibold">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DHIKR_OPTIONS.map((d) => (
            <SelectItem key={d} value={d} className="text-right text-base">{d}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Counter circle */}
      <div className="flex-1 flex items-center justify-center my-8">
        <motion.button
          className="relative select-none outline-none focus:outline-none"
          whileTap={{ scale: 0.95 }}
          onTap={handleTap}
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          <svg width={2 * (radius + stroke)} height={2 * (radius + stroke)} className="block">
            {/* Background ring */}
            <circle
              cx={radius + stroke}
              cy={radius + stroke}
              r={radius}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth={stroke}
            />
            {/* Progress ring */}
            <circle
              cx={radius + stroke}
              cy={radius + stroke}
              r={radius}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${radius + stroke} ${radius + stroke})`}
              className="transition-all duration-200"
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold text-foreground leading-none">
              {toArabicNumerals(count)}
            </span>
            <span className="text-lg text-muted-foreground mt-1">
              / {toArabicNumerals(target)}
            </span>
          </div>
        </motion.button>
      </div>

      {/* Actions */}
      <div className="flex gap-4 mb-6">
        <Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          إعادة
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setShowTargetPicker(!showTargetPicker)}
        >
          <Target className="h-4 w-4" />
          الهدف
        </Button>
      </div>

      {/* Target picker */}
      {showTargetPicker && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-2 justify-center mb-6"
        >
          {TARGET_OPTIONS.map((t) => (
            <Button
              key={t}
              size="sm"
              variant={target === t ? "default" : "secondary"}
              onClick={() => { setTarget(t); setCount(0); setShowTargetPicker(false); }}
            >
              {toArabicNumerals(t)}
            </Button>
          ))}
        </motion.div>
      )}

      {/* Today total */}
      <p className="text-sm text-muted-foreground">
        إجمالي اليوم: <span className="font-semibold text-foreground">{toArabicNumerals(todayTotal)}</span>
      </p>
    </div>
  );
}
