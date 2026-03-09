import { useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { RotateCcw, Target, Sparkles } from "lucide-react";
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
  const [showSparkle, setShowSparkle] = useState(false);

  const progress = useMemo(() => Math.min(count / target, 1), [count, target]);
  const isComplete = count >= target;

  const handleTap = useCallback(() => {
    if (navigator.vibrate) navigator.vibrate(10);
    setCount((c) => c + 1);
    setTodayTotal((t) => t + 1);
    
    // Show sparkle on milestones
    if ((count + 1) % 33 === 0) {
      setShowSparkle(true);
      setTimeout(() => setShowSparkle(false), 1000);
    }
  }, [setCount, setTodayTotal, count]);

  const handleReset = useCallback(() => {
    setCount(0);
  }, [setCount]);

  // SVG progress ring
  const radius = 120;
  const stroke = 8;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center px-4 pt-6 pb-24 min-h-[calc(100dvh-4rem)]" dir="rtl">
      {/* Header */}
      <h1 className="text-2xl font-bold text-foreground mb-5 heading-decorated">التسبيح</h1>

      {/* Dhikr selector */}
      <Select value={dhikr} onValueChange={(v) => { setDhikr(v); setCount(0); }}>
        <SelectTrigger className="w-60 text-center justify-center text-base font-bold rounded-xl h-12 shadow-soft border-border/50">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DHIKR_OPTIONS.map((d) => (
            <SelectItem key={d} value={d} className="text-right text-base font-medium">{d}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Counter circle */}
      <div className="flex-1 flex items-center justify-center my-8 relative">
        {/* Sparkle effect on milestones */}
        {showSparkle && (
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 2, opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <Sparkles className="h-16 w-16 text-gold" />
          </motion.div>
        )}

        <motion.button
          className="relative select-none outline-none focus:outline-none"
          whileTap={{ scale: 0.95 }}
          onTap={handleTap}
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          {/* Background glow */}
          <div className={`absolute inset-4 rounded-full transition-all duration-500 ${isComplete ? 'bg-primary/20 animate-glow-pulse' : ''}`} />
          
          <svg width={2 * (radius + stroke + 8)} height={2 * (radius + stroke + 8)} className="block">
            {/* Outer decorative ring */}
            <circle
              cx={radius + stroke + 8}
              cy={radius + stroke + 8}
              r={radius + 4}
              fill="none"
              stroke="hsl(var(--border) / 0.3)"
              strokeWidth={1}
              strokeDasharray="4 8"
            />
            {/* Background ring */}
            <circle
              cx={radius + stroke + 8}
              cy={radius + stroke + 8}
              r={radius}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth={stroke}
            />
            {/* Progress ring */}
            <circle
              cx={radius + stroke + 8}
              cy={radius + stroke + 8}
              r={radius}
              fill="none"
              stroke={isComplete ? "hsl(var(--gold))" : "hsl(var(--primary))"}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${radius + stroke + 8} ${radius + stroke + 8})`}
              className="transition-all duration-300"
              style={{
                filter: isComplete ? "drop-shadow(0 0 8px hsl(var(--gold) / 0.5))" : "drop-shadow(0 0 6px hsl(var(--primary) / 0.3))"
              }}
            />
          </svg>
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span 
              key={count}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className={`text-5xl font-bold leading-none ${isComplete ? 'text-gold' : 'text-foreground'}`}
            >
              {toArabicNumerals(count)}
            </motion.span>
            <span className="text-lg text-muted-foreground mt-2">
              / {toArabicNumerals(target)}
            </span>
            {isComplete && (
              <motion.span
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-gold font-semibold mt-2"
              >
                ما شاء الله! 🎉
              </motion.span>
            )}
          </div>
        </motion.button>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mb-6">
        <Button variant="outline" size="default" onClick={handleReset} className="gap-2 rounded-xl shadow-soft">
          <RotateCcw className="h-4 w-4" />
          إعادة
        </Button>
        <Button
          variant="outline"
          size="default"
          className="gap-2 rounded-xl shadow-soft"
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
              variant={target === t ? "gradient" : "secondary"}
              className="rounded-xl"
              onClick={() => { setTarget(t); setCount(0); setShowTargetPicker(false); }}
            >
              {toArabicNumerals(t)}
            </Button>
          ))}
        </motion.div>
      )}

      {/* Today total card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-card p-4 shadow-elevated border border-border/50 text-center"
      >
        <p className="text-sm text-muted-foreground mb-1">إجمالي اليوم</p>
        <p className="text-2xl font-bold text-primary">{toArabicNumerals(todayTotal)}</p>
      </motion.div>
    </div>
  );
}
