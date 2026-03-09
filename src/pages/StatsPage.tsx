import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Clock, Flame, Trophy } from "lucide-react";
import { useReadingStats } from "@/hooks/useReadingStats";
import { useDailyReading } from "@/hooks/useDailyReading";
import { useStreak } from "@/hooks/useStreak";
import { StatCard } from "@/components/stats/StatCard";
import { WeeklyChart } from "@/components/stats/WeeklyChart";
import { StreakCalendar } from "@/components/stats/StreakCalendar";
import { Progress } from "@/components/ui/progress";
import { toArabicNumerals } from "@/lib/utils";

export default function StatsPage() {
  const navigate = useNavigate();
  const { weeklyData, monthlyData, totals, weeklyTotal, monthlyTotal } = useReadingStats();
  const { goal, todayCount } = useDailyReading();
  const { streak } = useStreak();
  const progress = Math.min((todayCount / goal) * 100, 100);

  return (
    <div className="px-4 pt-6 pb-24" dir="rtl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}
          className="rounded-xl bg-card p-2.5 shadow-soft"
        >
          <ArrowRight className="h-5 w-5 text-foreground" />
        </motion.button>
        <h1 className="text-2xl font-bold heading-decorated">الإحصائيات</h1>
      </div>

      {/* Today's Goal */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-card p-5 shadow-soft border border-border/50 mb-5"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-muted-foreground">هدف اليوم</span>
          <span className="text-sm font-bold text-foreground">
            {toArabicNumerals(todayCount)} / {toArabicNumerals(goal)} آية
          </span>
        </div>
        <Progress value={progress} variant="gradient" size="sm" />
        {progress >= 100 && (
          <p className="text-xs text-primary font-medium mt-2 text-center">🎉 ما شاء الله! أكملت هدفك اليوم</p>
        )}
      </motion.div>

      {/* Hero Stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <StatCard icon={BookOpen} value={totals.totalAyahs} label="إجمالي الآيات" delay={0.05} accent />
        <StatCard icon={Clock} value={totals.totalMinutes} label="دقائق القراءة" delay={0.1} />
        <StatCard icon={Flame} value={streak} label="أيام متواصلة" delay={0.15} accent />
        <StatCard icon={Trophy} value={totals.maxStreak} label="أطول سلسلة" delay={0.2} />
      </div>

      {/* Summary Row */}
      <div className="flex gap-3 mb-5">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex-1 rounded-2xl bg-primary/10 p-4 text-center"
        >
          <p className="text-xl font-bold text-primary">{toArabicNumerals(weeklyTotal)}</p>
          <p className="text-xs text-muted-foreground">هذا الأسبوع</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex-1 rounded-2xl bg-accent/10 p-4 text-center"
        >
          <p className="text-xl font-bold text-accent">{toArabicNumerals(monthlyTotal)}</p>
          <p className="text-xs text-muted-foreground">هذا الشهر</p>
        </motion.div>
      </div>

      {/* Weekly Chart */}
      <div className="mb-5">
        <WeeklyChart data={weeklyData} />
      </div>

      {/* Streak Calendar */}
      <StreakCalendar data={monthlyData} />

      <div className="h-4" />
    </div>
  );
}
