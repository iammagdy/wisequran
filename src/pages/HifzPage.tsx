import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, BookOpen, CircleCheck as CheckCircle2, Circle, Loader as Loader2, RotateCcw, Check, Clock, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SURAH_META } from "@/data/surah-meta";
import { useHifz, type HifzStatus } from "@/hooks/useHifz";
import { useHifzReview } from "@/hooks/useHifzReview";
import { cn, toArabicNumerals } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

type FilterMode = "all" | "memorized" | "reading" | "none";

const STATUS_CONFIG: Record<HifzStatus, { color: string; bg: string; icon: typeof CheckCircle2 }> = {
  memorized: { color: "text-primary", bg: "bg-primary/15 border-primary/30", icon: CheckCircle2 },
  reading: { color: "text-accent", bg: "bg-accent/15 border-accent/30", icon: Loader2 },
  none: { color: "text-muted-foreground", bg: "bg-card border-border/50", icon: Circle },
};

function getStrengthColor(level: number): string {
  if (level <= 1) return "bg-destructive";
  if (level <= 3) return "bg-accent";
  return "bg-primary";
}

export default function HifzPage() {
  const { t, language, isRTL } = useLanguage();
  const navigate = useNavigate();
  const { getStatus, cycleStatus, stats } = useHifz();
  const review = useHifzReview();
  const [filter, setFilter] = useState<FilterMode>("all");

  const filtered = SURAH_META.filter((s) => filter === "all" || getStatus(s.number) === filter);
  const todayQueue = review.getTodayQueue();

  const getStrengthLabel = (level: number): string => {
    if (level <= 1) return t("weak");
    if (level <= 3) return t("medium");
    return t("strong");
  };

  // Sync: when cycling status to memorized, add to review
  const handleCycleStatus = (surahNumber: number) => {
    const current = getStatus(surahNumber);
    cycleStatus(surahNumber);
    // If cycling from reading → memorized, add to review
    if (current === "reading") {
      review.addToReview(surahNumber);
    }
    // If cycling from memorized → none, remove from review
    if (current === "memorized") {
      review.removeFromReview(surahNumber);
    }
  };

  const handleMarkReviewed = (surahNumber: number, quality: "good" | "hard") => {
    const meta = SURAH_META.find((s) => s.number === surahNumber);
    review.markReviewed(surahNumber, quality);
    if (quality === "good") {
      toast({
        title: language === "en" ? "Well done! ✨" : "أحسنت! ✨",
        description: language === "en"
          ? `Reviewed Surah ${meta?.name || ""}`
          : `تمت مراجعة سورة ${meta?.name || ""}`,
      });
    } else {
      toast({
        title: language === "en" ? "Keep going, you'll improve" : "ستتحسن إن شاء الله",
        description: language === "en"
          ? `Surah ${meta?.name || ""} will appear in tomorrow's review`
          : `ستظهر سورة ${meta?.name || ""} في مراجعة الغد`,
      });
    }
  };

  return (
    <div className="px-4 pt-6 pb-24" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)} className="rounded-xl p-2.5 hover:bg-muted transition-colors">
          <ArrowRight className="h-5 w-5" />
        </motion.button>
        <div>
          <h1 className="text-2xl font-bold heading-decorated">{t("hifz_title")}</h1>
          <p className="text-sm text-muted-foreground">{t("hifz_subtitle")}</p>
        </div>
      </div>

      {/* Progress Summary */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-5 rounded-2xl bg-card p-5 shadow-elevated border border-border/50">
        <div className="grid grid-cols-3 gap-2 mb-4 text-center" dir={isRTL ? "rtl" : "ltr"}>
          <div>
            <p className="text-xl font-bold text-primary">{toArabicNumerals(stats.memorized)}</p>
            <p className="text-xs text-muted-foreground">{t("memorized")}</p>
          </div>
          <div>
            <p className="text-xl font-bold text-accent">{toArabicNumerals(stats.inProgress)}</p>
            <p className="text-xs text-muted-foreground">{t("in_progress")}</p>
          </div>
          <div>
            <p className="text-xl font-bold text-muted-foreground">{toArabicNumerals(stats.notStarted)}</p>
            <p className="text-xs text-muted-foreground">{t("not_started")}</p>
          </div>
        </div>
        <div dir={isRTL ? "rtl" : "ltr"}>
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="text-muted-foreground">{toArabicNumerals(stats.memorizedAyahs)} / {toArabicNumerals(stats.totalAyahs)} {t("ayah")}</span>
            <span className="font-bold text-primary">{toArabicNumerals(stats.percentage)}%</span>
          </div>
          <Progress value={stats.percentage} variant="gradient" size="sm" />
        </div>
      </motion.div>

      {/* Today's Review Section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-5" dir={isRTL ? "rtl" : "ltr"}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">{t("today_review")}</h2>
          </div>
          {review.stats.reviewedToday > 0 && (
            <span className="text-xs font-semibold text-primary bg-primary/10 rounded-full px-2.5 py-1">
              {language === "en"
                ? `Reviewed ${review.stats.reviewedToday}`
                : `تمت مراجعة ${toArabicNumerals(review.stats.reviewedToday)}`}
            </span>
          )}
        </div>

        {todayQueue.length === 0 ? (
          <div className="rounded-2xl bg-primary/5 border border-primary/20 p-6 text-center">
            <Sparkles className="h-8 w-8 text-primary/50 mx-auto mb-2" />
            <p className="text-sm font-semibold text-foreground">{t("no_reviews_today")}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {review.stats.totalInReview > 0 ? t("all_reviews_done") : t("add_memorized_hint")}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            <AnimatePresence mode="popLayout">
              {todayQueue.map((item) => (
                <motion.div
                  key={item.surahNumber}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "rounded-2xl bg-card p-4 border shadow-soft",
                    item.overdueDays > 2 ? "border-destructive/30" : "border-border/50"
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-arabic text-base font-bold">{item.surahName}</span>
                      {item.overdueDays > 0 && (
                        <span className="text-[0.625rem] text-destructive font-semibold bg-destructive/10 rounded-full px-2 py-0.5">
                          {language === "en"
                            ? `${item.overdueDays} ${t("days")} ${t("overdue")}`
                            : `${t("overdue")} ${toArabicNumerals(item.overdueDays)} ${t("days")}`}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[0.625rem] text-muted-foreground">{getStrengthLabel(item.level)}</span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 7 }).map((_, i) => (
                          <div
                            key={i}
                            className={cn(
                              "h-1.5 w-1.5 rounded-full transition-colors",
                              i <= item.level ? getStrengthColor(item.level) : "bg-muted"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Strength bar */}
                  <div className="h-1 w-full rounded-full bg-muted mb-3 overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", getStrengthColor(item.level))}
                      style={{ width: `${((item.level + 1) / 7) * 100}%` }}
                    />
                  </div>

                  <div className="flex gap-2">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleMarkReviewed(item.surahNumber, "good")}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-primary/10 text-primary py-3 text-sm font-semibold hover:bg-primary/20 transition-colors min-h-[44px]"
                    >
                      <Check className="h-4 w-4" />
                      {t("mastered")}
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleMarkReviewed(item.surahNumber, "hard")}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-muted text-muted-foreground py-3 text-sm font-semibold hover:bg-muted/80 transition-colors min-h-[44px]"
                    >
                      <RotateCcw className="h-4 w-4" />
                      {t("needs_review")}
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Review Stats */}
        {review.stats.totalInReview > 0 && (
          <div className="mt-3 flex gap-3 text-center">
            <div className="flex-1 rounded-xl bg-muted/50 p-3">
              <p className="text-lg font-bold text-foreground">{toArabicNumerals(review.stats.totalInReview)}</p>
              <p className="text-[0.625rem] text-muted-foreground">{t("in_review")}</p>
            </div>
            <div className="flex-1 rounded-xl bg-muted/50 p-3">
              <p className="text-lg font-bold text-foreground">{toArabicNumerals(review.stats.dueToday)}</p>
              <p className="text-[0.625rem] text-muted-foreground">{t("due_today")}</p>
            </div>
            <div className="flex-1 rounded-xl bg-muted/50 p-3">
              <p className="text-lg font-bold text-foreground">{toArabicNumerals(review.stats.totalReviewsDone)}</p>
              <p className="text-[0.625rem] text-muted-foreground">{t("total_reviews")}</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Filter Tabs */}
      <div className="mb-5 flex gap-1.5 p-1 rounded-2xl bg-muted/50" dir={isRTL ? "rtl" : "ltr"}>
        {([
          { key: "all" as FilterMode, label: t("filter_all") },
          { key: "memorized" as FilterMode, label: t("memorized") },
          { key: "reading" as FilterMode, label: t("in_progress") },
          { key: "none" as FilterMode, label: t("not_started") },
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
          const reviewItem = review.getReviewItem(surah.number);
          const statusLabel =
            status === "memorized" ? t("memorized") :
            status === "reading" ? t("in_progress") :
            t("not_started");
          return (
            <motion.button
              key={surah.number}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(i * 0.01, 0.3) }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleCycleStatus(surah.number)}
              className={cn(
                "relative flex flex-col items-center gap-1.5 rounded-xl p-3 border transition-all",
                config.bg
              )}
            >
              <Icon className={cn("h-4 w-4", config.color, status === "reading" && "animate-none")} />
              <span className="font-arabic text-sm font-bold leading-tight">{surah.name}</span>
              <span className="text-[0.625rem] text-muted-foreground">{toArabicNumerals(surah.numberOfAyahs)} {t("ayah")}</span>
              {/* Review strength indicator for memorized surahs */}
              {reviewItem && (
                <div className="flex gap-0.5 mt-0.5">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <div
                      key={j}
                      className={cn(
                        "h-1 w-1 rounded-full",
                        j <= reviewItem.level ? getStrengthColor(reviewItem.level) : "bg-muted"
                      )}
                    />
                  ))}
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-2xl bg-muted/30 p-8 text-center mt-4">
          <BookOpen className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{t("no_surahs_in_filter")}</p>
        </div>
      )}

      <div className="h-4" />
    </div>
  );
}
