import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, BookOpen, Bookmark, Star, Loader as Loader2, Flame, MoveHorizontal as MoreHorizontal, ChartBar as BarChart3, GraduationCap, List, Layers } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { fetchSurahList, type SurahMeta } from "@/lib/quran-api";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useDailyReading } from "@/hooks/useDailyReading";
import { useStreak } from "@/hooks/useStreak";
import { cn, toArabicNumerals } from "@/lib/utils";
import { searchAyahs, type SearchResult } from "@/lib/quran-search";
import { HighlightText } from "@/components/HighlightText";
import { juzData } from "@/data/juz-hizb-data";
import { DailyAyah } from "@/components/quran/DailyAyah";
import { DailyWird } from "@/components/quran/DailyWird";
import ChangelogModal from "@/components/ChangelogModal";
import { usePostUpdateChangelog } from "@/hooks/usePostUpdateChangelog";
import { useLanguage } from "@/contexts/LanguageContext";

type HomeTab = "surahs" | "juz" | "bookmarks";

export default function QuranPage() {
  const [surahs, setSurahs] = useState<SurahMeta[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [ayahResults, setAyahResults] = useState<SearchResult[]>([]);
  const [searchingAyahs, setSearchingAyahs] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [lastRead] = useLocalStorage<{surah: number;ayah: number;} | null>("wise-last-read", null);
  const [bookmarks] = useLocalStorage<{surah: number;ayah: number;}[]>("wise-bookmarks", []);
  const [favorites] = useLocalStorage<number[]>("wise-favorite-surahs", []);
  const [activeTab, setActiveTab] = useState<HomeTab>("surahs");
  const [expandedJuz, setExpandedJuz] = useState<number | null>(null);
  const navigate = useNavigate();
  const { goal, todayCount } = useDailyReading();
  const { streak } = useStreak();
const { showChangelog, newEntries, dismissChangelog } = usePostUpdateChangelog();
  const { t, language, isRTL } = useLanguage();

  useEffect(() => {
    fetchSurahList().then((data) => {
      setSurahs(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = search.trim();
    if (trimmed.length < 3 || /^\d+$/.test(trimmed)) {
      setAyahResults([]);
      setSearchingAyahs(false);
      return;
    }
    setSearchingAyahs(true);
    debounceRef.current = setTimeout(() => {
      searchAyahs(trimmed).then((results) => {
        setAyahResults(results);
        setSearchingAyahs(false);
      });
    }, 300);
    return () => {if (debounceRef.current) clearTimeout(debounceRef.current);};
  }, [search]);

  const filtered = surahs.filter(
    (s) =>
    s.name.includes(search) ||
    s.englishName.toLowerCase().includes(search.toLowerCase()) ||
    s.number.toString() === search
  );

  const bookmarkedSurahs = [...new Set(bookmarks.map((b) => b.surah))];
  const progress = Math.min(todayCount / goal * 100, 100);

  const getSurahName = (num: number) => surahs.find((s) => s.number === num)?.name || String(num);

  const formatRange = (startSurah: number, startAyah: number, endSurah: number, endAyah: number) => {
    const fmtNum = (n: number) => language === "en" ? n : toArabicNumerals(n);
    if (startSurah === endSurah) {
      return `${getSurahName(startSurah)} ${fmtNum(startAyah)} — ${fmtNum(endAyah)}`;
    }
    return `${getSurahName(startSurah)} ${fmtNum(startAyah)} — ${getSurahName(endSurah)} ${fmtNum(endAyah)}`;
  };

  const getRevelationType = (type: string) =>
    type === "Meccan" ? t("revelation_meccan") : t("revelation_medinan");

  const tabs: { key: HomeTab; label: string; icon: React.ReactNode }[] = [
    { key: "surahs", label: t("surah_list"), icon: <List className="h-3.5 w-3.5" /> },
    { key: "juz", label: t("juz_list"), icon: <Layers className="h-3.5 w-3.5" /> },
    { key: "bookmarks", label: t("bookmarks"), icon: <Bookmark className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="px-4 pt-4 pb-4 pl-2.5">
      {/* Header */}
      <div className="flex items-center justify-between mb-[5px] mt-0">
        <div>
          <h1 className="text-2xl font-bold heading-decorated">{t("quran_title")}</h1>
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

      {/* Daily Goal + Streak Card */}
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
          {streak > 0 &&
          <div className="flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1">
              <Flame className="h-4 w-4 text-accent streak-glow" />
              <span className="text-sm font-bold text-accent">{language === "en" ? streak : toArabicNumerals(streak)}</span>
              <span className="text-xs text-accent/80">{t("days")}</span>
            </div>
          }
        </div>
        <Progress value={progress} variant="gradient" size="sm" />
        {progress >= 100 &&
        <p className="text-xs text-primary font-medium mt-2 text-center">🎉 {t("goal_complete")}</p>
        }
      </motion.div>

      {/* Daily Wird */}
      <DailyWird />

      {/* Daily Ayah */}
      <DailyAyah />

      {/* Last Read */}
      {lastRead &&
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
      }

      {/* 3-Tab Navigation */}
      <div className="flex gap-1 p-1 rounded-2xl bg-muted/50 border border-border/30 mb-3 mt-2" dir={isRTL ? "rtl" : "ltr"}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setSearch(""); }}
            className={cn(
              "flex-1 rounded-xl py-2.5 text-xs font-semibold transition-all border flex items-center justify-center gap-1.5 min-h-[40px]",
              activeTab === tab.key
                ? "bg-card text-foreground shadow-soft border-border/30"
                : "text-muted-foreground hover:text-foreground border-transparent"
            )}>
            {tab.icon}
            {tab.label}
            {tab.key === "bookmarks" && bookmarks.length > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/15 text-[0.55rem] font-bold text-primary">
                {bookmarks.length > 9 ? "9+" : (language === "en" ? bookmarks.length : toArabicNumerals(bookmarks.length))}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search — only on Surahs tab */}
      <AnimatePresence>
        {activeTab === "surahs" && (
          <motion.div
            key="search"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="relative mb-4 overflow-hidden">
            <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("search_placeholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-11 text-right rounded-xl h-12 shadow-soft border-border/50 focus:shadow-elevated transition-shadow"
              dir={isRTL ? "rtl" : "ltr"} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ayah Search Results */}
      {activeTab === "surahs" && search.trim().length >= 3 && (
        <div className="mb-5" dir={isRTL ? "rtl" : "ltr"}>
          <h2 className="mb-3 text-lg font-bold">{t("search")}</h2>
          {searchingAyahs ?
          <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div> :
          ayahResults.length === 0 ?
          <div className="rounded-2xl bg-muted/30 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                لا توجد نتائج — تأكد من تحميل السور أولاً للبحث في النصوص
              </p>
            </div> :
          <div className="space-y-2">
              {ayahResults.map((r, i) =>
            <motion.button
              key={`${r.surahNumber}-${r.ayahNumber}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => navigate(`/surah/${r.surahNumber}?ayah=${r.ayahNumber}`)}
              className="flex w-full flex-col gap-2 rounded-xl bg-card p-4 text-right shadow-soft hover:shadow-elevated transition-all active:scale-[0.99]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground rounded-full bg-muted px-2 py-0.5">{t("ayah")} {language === "en" ? r.ayahNumber : toArabicNumerals(r.ayahNumber)}</span>
                    <span className="text-sm font-bold text-primary">{r.surahName}</span>
                  </div>
                  <p className="font-arabic text-sm leading-relaxed line-clamp-2"><HighlightText text={r.text} highlight={search.trim()} /></p>
                </motion.button>
            )}
              {ayahResults.length >= 50 &&
            <p className="text-center text-xs text-muted-foreground py-2">تم عرض أول ٥٠ نتيجة</p>
            }
            </div>
          }
        </div>
      )}

      {/* Tab Content */}
      <AnimatePresence mode="wait">

        {/* Surahs Tab */}
        {activeTab === "surahs" && search.trim().length < 3 && (
          <motion.div
            key="surahs"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="space-y-2">
            {loading ?
            Array.from({ length: 10 }).map((_, i) =>
            <div key={i} className="h-[72px] rounded-xl shimmer" />
            ) :
            filtered.map((surah, i) =>
            <motion.button
              key={surah.number}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.5) }}
              onClick={() => navigate(`/surah/${surah.number}`)}
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
                    {favorites.includes(surah.number) &&
              <Star className="h-4 w-4 fill-gold text-gold" />
              }
                    {bookmarkedSurahs.includes(surah.number) &&
              <Bookmark className="h-4 w-4 text-primary fill-primary/20" />
              }
                  </div>
                </motion.button>
            )}
          </motion.div>
        )}

        {/* Juz Tab */}
        {activeTab === "juz" && (
          <motion.div
            key="juz"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="space-y-2">
            {juzData.map((juz, i) => {
              const isExpanded = expandedJuz === juz.juzNumber;
              const juzSurahs = surahs.filter(
                (s) => s.number >= juz.startSurah && s.number <= juz.endSurah
              );
              return (
                <div key={juz.juzNumber}>
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.5) }}
                    onClick={() => setExpandedJuz(isExpanded ? null : juz.juzNumber)}
                    className="flex w-full items-center gap-4 rounded-xl bg-card p-4 shadow-soft hover:shadow-elevated transition-all active:scale-[0.99]"
                    dir={isRTL ? "rtl" : "ltr"}>
                    <div className="number-badge h-11 w-11 text-sm">
                      {language === "en" ? juz.juzNumber : toArabicNumerals(juz.juzNumber)}
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-base font-bold">{juz.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatRange(juz.startSurah, juz.startAyah, juz.endSurah, juz.endAyah)}
                      </p>
                    </div>
                    <motion.svg
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      className="h-4 w-4 text-muted-foreground"
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </motion.svg>
                  </motion.button>
                  {isExpanded &&
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mr-6 mt-1 space-y-1 overflow-hidden">
                    {juzSurahs.map((surah) =>
                    <button
                      key={surah.number}
                      onClick={() => navigate(`/surah/${surah.number}`)}
                      className="flex w-full items-center gap-3 rounded-lg bg-muted/50 p-3 text-right transition-all hover:bg-muted active:scale-[0.99]"
                      dir={isRTL ? "rtl" : "ltr"}>
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                          {language === "en" ? surah.number : toArabicNumerals(surah.number)}
                        </span>
                        <span className="font-arabic text-sm font-semibold">{surah.name}</span>
                        <span className="mr-auto text-xs text-muted-foreground">
                          {language === "en" ? surah.numberOfAyahs : toArabicNumerals(surah.numberOfAyahs)} {t("ayah")}
                        </span>
                      </button>
                    )}
                  </motion.div>
                  }
                </div>
              );
            })}
          </motion.div>
        )}

        {/* Bookmarks Tab */}
        {activeTab === "bookmarks" && (
          <motion.div
            key="bookmarks"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}>
            {bookmarks.length === 0 ?
            <div className="rounded-2xl bg-muted/30 p-10 text-center">
                <Bookmark className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">{t("no_bookmarks")}</p>
              </div> :
            <div className="space-y-2">
                {bookmarks.map((b, i) =>
              <motion.button
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/surah/${b.surah}?ayah=${b.ayah}`)}
                className="flex w-full items-center justify-between rounded-xl bg-card p-4 shadow-soft hover:shadow-elevated transition-all"
                dir={isRTL ? "rtl" : "ltr"}>
                    <span className="text-sm text-muted-foreground">{t("ayah")} {language === "en" ? b.ayah : toArabicNumerals(b.ayah)}</span>
                    <span className="font-bold">
                      {t("surah")} {getSurahName(b.surah)}
                    </span>
                  </motion.button>
              )}
              </div>
            }
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
