import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Headphones, GraduationCap, Flame, MoveHorizontal as MoreHorizontal, ChartBar as BarChart3, ArrowRight, Bookmark, Star } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { fetchSurahList, type SurahMeta } from "@/lib/quran-api";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useDailyReading } from "@/hooks/useDailyReading";
import { useStreak } from "@/hooks/useStreak";
import { cn, toArabicNumerals } from "@/lib/utils";
import { DailyAyah } from "@/components/quran/DailyAyah";
import { DailyWird } from "@/components/quran/DailyWird";
import ChangelogModal from "@/components/ChangelogModal";
import { usePostUpdateChangelog } from "@/hooks/usePostUpdateChangelog";
import { useLanguage } from "@/contexts/LanguageContext";

type HomeView = "home" | "surahs" | "surahs_listening";

interface ModeCard {
  key: string;
  titleKey: "mode_reading" | "mode_listening" | "mode_hifz";
  subtitleKey: "mode_reading_subtitle" | "mode_listening_subtitle" | "mode_hifz_subtitle";
  icon: React.ReactNode;
  accentClass: string;
  borderClass: string;
  iconBgClass: string;
  view?: HomeView;
  route?: string;
}

export default function QuranPage() {
  const [view, setView] = useState<HomeView>("home");
  const [surahs, setSurahs] = useState<SurahMeta[]>([]);
  const [loadingSurahs, setLoadingSurahs] = useState(false);
  const [lastRead] = useLocalStorage<{ surah: number; ayah: number } | null>("wise-last-read", null);
  const [bookmarks] = useLocalStorage<{ surah: number; ayah: number }[]>("wise-bookmarks", []);
  const [favorites] = useLocalStorage<number[]>("wise-favorite-surahs", []);
  const navigate = useNavigate();
  const { goal, todayCount } = useDailyReading();
  const { streak } = useStreak();
  const { showChangelog, newEntries, dismissChangelog } = usePostUpdateChangelog();
  const { t, language, isRTL } = useLanguage();

  const progress = Math.min((todayCount / goal) * 100, 100);

  useEffect(() => {
    if ((view === "surahs" || view === "surahs_listening") && surahs.length === 0) {
      setLoadingSurahs(true);
      fetchSurahList().then((data) => {
        setSurahs(data);
        setLoadingSurahs(false);
      });
    }
  }, [view, surahs.length]);

  const bookmarkedSurahs = [...new Set(bookmarks.map((b) => b.surah))];

  const getRevelationType = (type: string) =>
    type === "Meccan" ? t("revelation_meccan") : t("revelation_medinan");

  const getSurahName = (num: number) =>
    surahs.find((s) => s.number === num)?.name || String(num);

  const modeCards: ModeCard[] = [
    {
      key: "reading",
      titleKey: "mode_reading",
      subtitleKey: "mode_reading_subtitle",
      icon: <BookOpen className="h-8 w-8" />,
      accentClass: "text-primary",
      borderClass: "border-primary/20 hover:border-primary/40",
      iconBgClass: "bg-primary/10",
      view: "surahs",
    },
    {
      key: "listening",
      titleKey: "mode_listening",
      subtitleKey: "mode_listening_subtitle",
      icon: <Headphones className="h-8 w-8" />,
      accentClass: "text-amber-500 dark:text-amber-400",
      borderClass: "border-amber-500/20 hover:border-amber-500/40",
      iconBgClass: "bg-amber-500/10",
      view: "surahs_listening",
    },
    {
      key: "hifz",
      titleKey: "mode_hifz",
      subtitleKey: "mode_hifz_subtitle",
      icon: <GraduationCap className="h-8 w-8" />,
      accentClass: "text-emerald-600 dark:text-emerald-400",
      borderClass: "border-emerald-500/20 hover:border-emerald-500/40",
      iconBgClass: "bg-emerald-500/10",
      route: "/hifz",
    },
  ];

  const handleModeCard = (card: ModeCard) => {
    if (card.route) {
      navigate(card.route);
    } else if (card.view) {
      setView(card.view);
    }
  };

  const handleSurahSelect = (surahNumber: number) => {
    if (view === "surahs_listening") {
      navigate(`/surah/${surahNumber}?mode=listening`);
    } else {
      navigate(`/surah/${surahNumber}`);
    }
  };

  const surahListTitle =
    view === "surahs_listening" ? t("mode_listening") : t("mode_reading");

  return (
    <div className="px-4 pt-4 pb-4 pl-2.5">

      {/* Header */}
      <div className="flex items-center justify-between mb-[5px] mt-0">
        <div className="flex items-center gap-2">
          {view !== "home" && (
            <motion.button
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setView("home")}
              className="rounded-xl p-2.5 transition-all bg-card text-muted-foreground hover:bg-muted min-h-[40px] min-w-[40px] flex items-center justify-center"
              dir={isRTL ? "rtl" : "ltr"}>
              <ArrowRight className={cn("h-5 w-5", isRTL ? "" : "rotate-180")} />
            </motion.button>
          )}
          <div>
            <h1 className="text-2xl font-bold heading-decorated">
              {view !== "home" ? surahListTitle : t("quran_title")}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button
                whileTap={{ scale: 0.9 }}
                className="rounded-xl p-3 transition-all shadow-soft min-h-[44px] min-w-[44px] flex items-center justify-center bg-card text-muted-foreground hover:bg-muted">
                <MoreHorizontal className="h-5 w-5" />
              </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[160px]">
              <DropdownMenuItem onClick={() => navigate("/stats")} className="gap-2 text-right flex-row-reverse">
                <BarChart3 className="h-4 w-4" />
                {t("statistics")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/hifz")} className="gap-2 text-right flex-row-reverse">
                <GraduationCap className="h-4 w-4" />
                {t("memorization")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AnimatePresence mode="wait">

        {/* ── HOME VIEW ── */}
        {view === "home" && (
          <motion.div
            key="home"
            initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
            transition={{ duration: 0.22 }}>

            {/* Daily Goal + Streak */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-card p-4 shadow-elevated border border-border/50 pl-4 mb-1.5 pt-0.5 pb-0.5"
              dir={isRTL ? "rtl" : "ltr"}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground font-medium">
                    {t("today")}: <span className="text-foreground font-bold">{language === "en" ? todayCount : toArabicNumerals(todayCount)}</span> / {language === "en" ? goal : toArabicNumerals(goal)} {t("ayah")}
                  </span>
                </div>
                {streak > 0 && (
                  <div className="flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1">
                    <Flame className="h-4 w-4 text-accent streak-glow" />
                    <span className="text-sm font-bold text-accent">{language === "en" ? streak : toArabicNumerals(streak)}</span>
                    <span className="text-xs text-accent/80">{t("days")}</span>
                  </div>
                )}
              </div>
              <Progress value={progress} variant="gradient" size="sm" />
              {progress >= 100 && (
                <p className="text-xs text-primary font-medium mt-2 text-center">🎉 {t("goal_complete")}</p>
              )}
            </motion.div>

            {/* Daily Wird */}
            <DailyWird />

            {/* Daily Ayah */}
            <DailyAyah />

            {/* Continue Reading */}
            {lastRead && (
              <motion.button
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => navigate(`/surah/${lastRead.surah}`)}
                className="flex w-full items-center rounded-2xl bg-card py-3 px-4 text-right shadow-elevated border border-primary/10 hover-lift gap-3 mb-[3px]">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">{t("continue_reading")}</p>
                  <p className="text-sm font-bold truncate">
                    {t("surah")} {getSurahName(lastRead.surah)} — {t("ayah")} {language === "en" ? lastRead.ayah : toArabicNumerals(lastRead.ayah)}
                  </p>
                </div>
                <span className="text-xs text-primary/60 shrink-0">←</span>
              </motion.button>
            )}

            {/* Mode Selection Cards */}
            <div className="mt-4 space-y-3" dir={isRTL ? "rtl" : "ltr"}>
              {modeCards.map((card, i) => (
                <motion.button
                  key={card.key}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 + i * 0.1, duration: 0.3, ease: "easeOut" }}
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleModeCard(card)}
                  className={cn(
                    "flex w-full items-center gap-4 rounded-2xl bg-card px-5 py-5 shadow-elevated border transition-all",
                    card.borderClass
                  )}>
                  <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl", card.iconBgClass, card.accentClass)}>
                    {card.icon}
                  </div>
                  <div className="flex-1 text-right">
                    <p className={cn("text-xl font-bold font-arabic leading-tight", card.accentClass)}>
                      {t(card.titleKey)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5 font-arabic">
                      {t(card.subtitleKey)}
                    </p>
                  </div>
                  <div className={cn("shrink-0 opacity-40", card.accentClass)}>
                    <ArrowRight className={cn("h-5 w-5", isRTL ? "rotate-180" : "")} />
                  </div>
                </motion.button>
              ))}
            </div>

          </motion.div>
        )}

        {/* ── SURAH LIST VIEW (Reading / Listening) ── */}
        {(view === "surahs" || view === "surahs_listening") && (
          <motion.div
            key="surahs"
            initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRTL ? -20 : 20 }}
            transition={{ duration: 0.22 }}
            className="space-y-2 mt-2">

            {loadingSurahs
              ? Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="h-[72px] rounded-xl shimmer" />
                ))
              : surahs.map((surah, i) => (
                  <motion.button
                    key={surah.number}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.015, 0.4) }}
                    onClick={() => handleSurahSelect(surah.number)}
                    className="flex w-full items-center gap-4 rounded-xl bg-card p-4 shadow-soft hover:shadow-elevated transition-all active:scale-[0.99] group pt-[2px] pb-[2px]">
                    <div className="number-badge h-11 w-11 text-sm">
                      {language === "en" ? surah.number : toArabicNumerals(surah.number)}
                    </div>
                    <div className="flex-1 text-right">
                      <p className="font-arabic text-lg font-bold group-hover:text-primary transition-colors">{surah.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {language === "en" ? surah.numberOfAyahs : toArabicNumerals(surah.numberOfAyahs)} {t("ayahs")} · {getRevelationType(surah.revelationType)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {favorites.includes(surah.number) && (
                        <Star className="h-4 w-4 fill-gold text-gold" />
                      )}
                      {bookmarkedSurahs.includes(surah.number) && (
                        <Bookmark className="h-4 w-4 text-primary fill-primary/20" />
                      )}
                    </div>
                  </motion.button>
                ))}
          </motion.div>
        )}

      </AnimatePresence>

      {/* Safe area spacer */}
      <div className="h-4" />

      <ChangelogModal
        open={showChangelog}
        newEntries={newEntries}
        onDismiss={dismissChangelog}
      />
    </div>
  );
}
