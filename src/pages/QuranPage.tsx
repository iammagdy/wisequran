import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, BookOpen, Bookmark, Star, Loader2, History, Flame, BarChart3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { fetchSurahList, type SurahMeta } from "@/lib/quran-api";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useDailyReading } from "@/hooks/useDailyReading";
import { useStreak } from "@/hooks/useStreak";
import { useReadingHistory } from "@/hooks/useReadingHistory";
import { cn, toArabicNumerals } from "@/lib/utils";
import { searchAyahs, type SearchResult } from "@/lib/quran-search";
import { HighlightText } from "@/components/HighlightText";
import { juzData } from "@/data/juz-hizb-data";
import { DailyAyah } from "@/components/quran/DailyAyah";

type ViewMode = "surahs" | "juz";

export default function QuranPage() {
  const [surahs, setSurahs] = useState<SurahMeta[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [ayahResults, setAyahResults] = useState<SearchResult[]>([]);
  const [searchingAyahs, setSearchingAyahs] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [lastRead] = useLocalStorage<{ surah: number; ayah: number } | null>("wise-last-read", null);
  const [bookmarks] = useLocalStorage<{ surah: number; ayah: number }[]>("wise-bookmarks", []);
  const [favorites] = useLocalStorage<number[]>("wise-favorite-surahs", []);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("surahs");
  const [expandedJuz, setExpandedJuz] = useState<number | null>(null);
  const navigate = useNavigate();
  const { goal, todayCount } = useDailyReading();
  const { streak } = useStreak();
  const { history } = useReadingHistory();
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchSurahList().then((data) => {
      setSurahs(data);
      setLoading(false);
    });
  }, []);

  // Debounced ayah text search
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
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const filtered = surahs.filter(
    (s) =>
      s.name.includes(search) ||
      s.englishName.toLowerCase().includes(search.toLowerCase()) ||
      s.number.toString() === search
  );

  const displayList = showFavorites
    ? filtered.filter((s) => favorites.includes(s.number))
    : filtered;

  const bookmarkedSurahs = [...new Set(bookmarks.map((b) => b.surah))];
  const progress = Math.min((todayCount / goal) * 100, 100);

  const getSurahName = (num: number) => surahs.find((s) => s.number === num)?.name || String(num);

  const formatRange = (startSurah: number, startAyah: number, endSurah: number, endAyah: number) => {
    if (startSurah === endSurah) {
      return `${getSurahName(startSurah)} ${toArabicNumerals(startAyah)} — ${toArabicNumerals(endAyah)}`;
    }
    return `${getSurahName(startSurah)} ${toArabicNumerals(startAyah)} — ${getSurahName(endSurah)} ${toArabicNumerals(endAyah)}`;
  };

  const isSurahMode = viewMode === "surahs";

  return (
    <div className="px-4 pt-6 pb-24">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold heading-decorated">القرآن الكريم</h1>
        </div>
        <div className="flex items-center gap-1.5">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => { setShowHistory(!showHistory); setShowFavorites(false); setShowBookmarks(false); setViewMode("surahs"); }}
            className={cn(
              "rounded-xl p-2.5 transition-all shadow-soft",
              showHistory ? "bg-primary text-primary-foreground shadow-glow" : "bg-card text-muted-foreground hover:bg-muted"
            )}
          >
            <History className="h-5 w-5" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => { setShowFavorites(!showFavorites); setShowBookmarks(false); setShowHistory(false); setViewMode("surahs"); }}
            className={cn(
              "rounded-xl p-2.5 transition-all shadow-soft",
              showFavorites ? "bg-primary text-primary-foreground shadow-glow" : "bg-card text-muted-foreground hover:bg-muted"
            )}
          >
            <Star className="h-5 w-5" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => { setShowBookmarks(!showBookmarks); setShowFavorites(false); setShowHistory(false); setViewMode("surahs"); }}
            className={cn(
              "rounded-xl p-2.5 transition-all shadow-soft",
              showBookmarks ? "bg-primary text-primary-foreground shadow-glow" : "bg-card text-muted-foreground hover:bg-muted"
            )}
          >
            <Bookmark className="h-5 w-5" />
          </motion.button>
        </div>
      </div>

      {/* Daily Goal + Streak Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5 rounded-2xl bg-card p-4 shadow-elevated border border-border/50" 
        dir="rtl"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground font-medium">
              اليوم: <span className="text-foreground font-bold">{toArabicNumerals(todayCount)}</span> / {toArabicNumerals(goal)} آية
            </span>
          </div>
          {streak > 0 && (
            <div className="flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1">
              <Flame className="h-4 w-4 text-accent streak-glow" />
              <span className="text-sm font-bold text-accent">{toArabicNumerals(streak)}</span>
              <span className="text-xs text-accent/80">أيام</span>
            </div>
          )}
        </div>
        <Progress value={progress} variant="gradient" size="sm" />
        {progress >= 100 && (
          <p className="text-xs text-primary font-medium mt-2 text-center">🎉 ما شاء الله! أكملت هدفك اليوم</p>
        )}
      </motion.div>

      {/* Daily Ayah */}
      {!showBookmarks && !showFavorites && !showHistory && isSurahMode && (
        <DailyAyah />
      )}

      {/* Last Read */}
      {lastRead && !showBookmarks && !showFavorites && !showHistory && isSurahMode && (
        <motion.button
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => navigate(`/surah/${lastRead.surah}`)}
          className="mb-5 flex w-full items-center gap-4 rounded-2xl bg-card p-4 text-right shadow-elevated border border-primary/10 hover-lift"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground font-medium">متابعة القراءة</p>
            <p className="text-sm font-bold">
              سورة {getSurahName(lastRead.surah)} — آية {toArabicNumerals(lastRead.ayah)}
            </p>
          </div>
          <span className="text-xs text-primary/60">←</span>
        </motion.button>
      )}

      {/* Search */}
      {isSurahMode && (
        <div className="relative mb-5">
          <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم، الرقم، أو نص الآية..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-11 text-right rounded-xl h-12 shadow-soft border-border/50 focus:shadow-elevated transition-shadow"
            dir="rtl"
          />
        </div>
      )}

      {/* View Mode Tabs */}
      {!showBookmarks && !showFavorites && !showHistory && (
        <div className="mb-5 flex gap-2 p-1 rounded-2xl bg-muted/50" dir="rtl">
          {([
            { key: "surahs" as ViewMode, label: "السور" },
            { key: "juz" as ViewMode, label: "الأجزاء" },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setViewMode(tab.key)}
              className={cn(
                "flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all",
                viewMode === tab.key
                  ? "bg-card text-foreground shadow-soft"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Bookmarks View */}
      {showBookmarks && (
        <div className="mb-5">
          <h2 className="mb-3 text-lg font-bold">العلامات المرجعية</h2>
          {bookmarks.length === 0 ? (
            <div className="rounded-2xl bg-muted/30 p-8 text-center">
              <Bookmark className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">لا توجد علامات مرجعية بعد</p>
            </div>
          ) : (
            <div className="space-y-2">
              {bookmarks.map((b, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/surah/${b.surah}?ayah=${b.ayah}`)}
                  className="flex w-full items-center justify-between rounded-xl bg-card p-4 shadow-soft hover:shadow-elevated transition-all"
                >
                  <span className="text-sm text-muted-foreground">آية {toArabicNumerals(b.ayah)}</span>
                  <span className="font-bold">
                    سورة {getSurahName(b.surah)}
                  </span>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reading History View */}
      {showHistory && (
        <div className="mb-5" dir="rtl">
          <h2 className="mb-3 text-lg font-bold">سجل القراءة</h2>
          {history.length === 0 ? (
            <div className="rounded-2xl bg-muted/30 p-8 text-center">
              <History className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">لا يوجد سجل قراءة بعد</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((entry, i) => {
                const date = new Date(entry.timestamp);
                const timeStr = date.toLocaleDateString("ar-EG", { day: "numeric", month: "short" }) +
                  " · " + date.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
                return (
                  <motion.button
                    key={`${entry.surah}-${entry.timestamp}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => navigate(`/surah/${entry.surah}`)}
                    className="flex w-full items-center justify-between rounded-xl bg-card p-4 shadow-soft hover:shadow-elevated transition-all active:scale-[0.99]"
                  >
                    <span className="text-xs text-muted-foreground">{timeStr}</span>
                    <div className="text-right">
                      <span className="font-bold">{entry.surahName}</span>
                      {entry.ayahReached > 1 && (
                        <span className="mr-2 text-xs text-muted-foreground">آية {toArabicNumerals(entry.ayahReached)}</span>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Favorites empty state */}
      {showFavorites && displayList.length === 0 && !loading && (
        <div className="rounded-2xl bg-muted/30 p-8 text-center">
          <Star className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">لا توجد سور مفضلة بعد</p>
        </div>
      )}

      {/* Ayah Search Results */}
      {search.trim().length >= 3 && !showBookmarks && !showFavorites && isSurahMode && (
        <div className="mb-5" dir="rtl">
          <h2 className="mb-3 text-lg font-bold">نتائج البحث في الآيات</h2>
          {searchingAyahs ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : ayahResults.length === 0 ? (
            <div className="rounded-2xl bg-muted/30 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                لا توجد نتائج — تأكد من تحميل السور أولاً للبحث في النصوص
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {ayahResults.map((r, i) => (
                <motion.button
                  key={`${r.surahNumber}-${r.ayahNumber}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => navigate(`/surah/${r.surahNumber}?ayah=${r.ayahNumber}`)}
                  className="flex w-full flex-col gap-2 rounded-xl bg-card p-4 text-right shadow-soft hover:shadow-elevated transition-all active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground rounded-full bg-muted px-2 py-0.5">آية {toArabicNumerals(r.ayahNumber)}</span>
                    <span className="text-sm font-bold text-primary">{r.surahName}</span>
                  </div>
                  <p className="font-arabic text-sm leading-relaxed line-clamp-2"><HighlightText text={r.text} highlight={search.trim()} /></p>
                </motion.button>
              ))}
              {ayahResults.length >= 50 && (
                <p className="text-center text-xs text-muted-foreground py-2">تم عرض أول ٥٠ نتيجة</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Surah List */}
      {!showBookmarks && !showHistory && isSurahMode && (
        <div className="space-y-2">
          {loading
            ? Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-[72px] rounded-xl shimmer" />
              ))
            : displayList.map((surah, i) => (
                <motion.button
                  key={surah.number}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.5) }}
                  onClick={() => navigate(`/surah/${surah.number}`)}
                  className="flex w-full items-center gap-4 rounded-xl bg-card p-4 shadow-soft hover:shadow-elevated transition-all active:scale-[0.99] group"
                >
                  <div className="number-badge h-11 w-11 text-sm">
                    {toArabicNumerals(surah.number)}
                  </div>
                  <div className="flex-1 text-right">
                    <p className="font-arabic text-lg font-bold group-hover:text-primary transition-colors">{surah.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {toArabicNumerals(surah.numberOfAyahs)} آيات · {surah.revelationType === "Meccan" ? "مكية" : "مدنية"}
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
        </div>
      )}

      {/* Juz List */}
      {!showBookmarks && !showFavorites && !showHistory && viewMode === "juz" && (
        <div className="space-y-2">
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
                  dir="rtl"
                >
                  <div className="number-badge h-11 w-11 text-sm">
                    {toArabicNumerals(juz.juzNumber)}
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
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </motion.svg>
                </motion.button>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mr-6 mt-1 space-y-1 overflow-hidden"
                  >
                    {juzSurahs.map((surah) => (
                      <button
                        key={surah.number}
                        onClick={() => navigate(`/surah/${surah.number}`)}
                        className="flex w-full items-center gap-3 rounded-lg bg-muted/50 p-3 text-right transition-all hover:bg-muted active:scale-[0.99]"
                        dir="rtl"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                          {toArabicNumerals(surah.number)}
                        </span>
                        <span className="font-arabic text-sm font-semibold">{surah.name}</span>
                        <span className="mr-auto text-xs text-muted-foreground">
                          {toArabicNumerals(surah.numberOfAyahs)} آية
                        </span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Safe area spacer */}
      <div className="h-4" />
    </div>
  );
}
