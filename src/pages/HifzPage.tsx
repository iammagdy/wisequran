import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SURAH_META } from "@/data/surah-meta";
import { useHifz, type HifzStatus } from "@/hooks/useHifz";
import { cn, toArabicNumerals } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

type FilterMode = "all" | "memorized" | "reading" | "none";

const STATUS_CONFIG: Record<HifzStatus, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
  memorized: { label: "محفوظة", color: "text-primary", bg: "bg-primary/15 border-primary/30", icon: CheckCircle2 },
  reading: { label: "قيد الحفظ", color: "text-accent", bg: "bg-accent/15 border-accent/30", icon: Loader2 },
  none: { label: "لم تبدأ", color: "text-muted-foreground", bg: "bg-card border-border/50", icon: Circle },
};

export default function HifzPage() {
  const navigate = useNavigate();
  const { getStatus, cycleStatus, stats } = useHifz();
  const [filter, setFilter] = useState<FilterMode>("all");

  const filtered = SURAH_META.filter((s) => filter === "all" || getStatus(s.number) === filter);

  return (
    <div className="px-4 pt-6 pb-24">
      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)} className="rounded-xl p-2.5 hover:bg-muted transition-colors">
          <ArrowRight className="h-5 w-5" />
        </motion.button>
        <div>
          <h1 className="text-2xl font-bold heading-decorated">متابعة الحفظ</h1>
          <p className="text-sm text-muted-foreground">تتبع حفظك للقرآن الكريم</p>
        </div>
      </div>

      {/* Progress Summary */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-5 rounded-2xl bg-card p-5 shadow-elevated border border-border/50">
        <div className="grid grid-cols-3 gap-3 mb-4 text-center" dir="rtl">
          <div>
            <p className="text-2xl font-bold text-primary">{toArabicNumerals(stats.memorized)}</p>
            <p className="text-xs text-muted-foreground">محفوظة</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-accent">{toArabicNumerals(stats.inProgress)}</p>
            <p className="text-xs text-muted-foreground">قيد الحفظ</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-muted-foreground">{toArabicNumerals(stats.notStarted)}</p>
            <p className="text-xs text-muted-foreground">لم تبدأ</p>
          </div>
        </div>
        <div dir="rtl">
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="text-muted-foreground">{toArabicNumerals(stats.memorizedAyahs)} / {toArabicNumerals(stats.totalAyahs)} آية</span>
            <span className="font-bold text-primary">{toArabicNumerals(stats.percentage)}%</span>
          </div>
          <Progress value={stats.percentage} variant="gradient" size="sm" />
        </div>
      </motion.div>

      {/* Filter Tabs */}
      <div className="mb-5 flex gap-1.5 p-1 rounded-2xl bg-muted/50" dir="rtl">
        {([
          { key: "all" as FilterMode, label: "الكل" },
          { key: "memorized" as FilterMode, label: "محفوظة" },
          { key: "reading" as FilterMode, label: "قيد الحفظ" },
          { key: "none" as FilterMode, label: "لم تبدأ" },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={cn(
              "flex-1 rounded-xl py-2 text-xs font-semibold transition-all",
              filter === tab.key ? "bg-card text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Surah Grid */}
      <div className="grid grid-cols-3 gap-2">
        {filtered.map((surah, i) => {
          const status = getStatus(surah.number);
          const config = STATUS_CONFIG[status];
          const Icon = config.icon;
          return (
            <motion.button
              key={surah.number}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(i * 0.01, 0.3) }}
              whileTap={{ scale: 0.95 }}
              onClick={() => cycleStatus(surah.number)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl p-3 border transition-all",
                config.bg
              )}
            >
              <Icon className={cn("h-4 w-4", config.color, status === "reading" && "animate-none")} />
              <span className="font-arabic text-sm font-bold leading-tight">{surah.name}</span>
              <span className="text-[10px] text-muted-foreground">{toArabicNumerals(surah.numberOfAyahs)} آية</span>
            </motion.button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-2xl bg-muted/30 p-8 text-center mt-4">
          <BookOpen className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">لا توجد سور في هذا التصنيف</p>
        </div>
      )}

      <div className="h-4" />
    </div>
  );
}
