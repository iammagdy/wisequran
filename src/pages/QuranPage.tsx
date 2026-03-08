import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, BookOpen, Bookmark, Star, Loader2, History } from "lucide-react";
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
    <div className="px-4 pt-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">القرآن الكريم</h1>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setShowHistory(!showHistory); setShowFavorites(false); setShowBookmarks(false); setViewMode("surahs"); }}
            className={cn(
              "rounded-lg p-2 transition-colors",
              showHistory ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            )}
          >
            <History className="h-5 w-5" />
          </button>
          <button
            onClick={() => { setShowFavorites(!showFavorites); setShowBookmarks(false); setShowHistory(false); setViewMode("surahs"); }}
            className={cn(
              "rounded-lg p-2 transition-colors",
              showFavorites ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            )}
          >
            <Star className="h-5 w-5" />
          </button>
          <button
            onClick={() => { setShowBookmarks(!showBookmarks); setShowFavorites(false); setShowHistory(false); setViewMode("surahs"); }}
            className={cn(
              "rounded-lg p-2 transition-colors",
              showBookmarks ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            )}
          >
            <Bookmark className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Daily Goal + Streak */}
      <div className="mb-4 rounded-xl bg-card p-3 shadow-sm" dir="rtl">
        <div className="flex items-center justify-between text-sm mb-1.5">
          <span className="text-muted-foreground">
            اليوم: {toArabicNumerals(todayCount)} / {toArabicNumerals(goal)} آية
          </span>
          {streak > 0 && (
            <span className="text-sm font-semibold">🔥 {toArabicNumerals(streak)} أيام</span>
          )}
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Last Read */}
      {lastRead && !showBookmarks && !showFavorites && !showHistory && isSurahMode && (
        <motion.button
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate(`/surah/${lastRead.surah}`)}
          className="mb-4 flex w-full items-center gap-3 rounded-xl bg-primary/10 p-4 text-right"
        >
          <BookOpen className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">متابعة القراءة</p>
            <p className="text-sm font-semibold">
              سورة {getSurahName(lastRead.surah)} — آية {toArabicNumerals(lastRead.ayah)}
            </p>
          </div>
        </motion.button>
      )}

      {/* Search */}
      {isSurahMode && (
        <div className="relative mb-4">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم، الرقم، أو نص الآية..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10 text-right"
            dir="rtl"
          />
        </div>
      )}

      {/* View Mode Tabs */}
      {!showBookmarks && !showFavorites && !showHistory && (
        <div className="mb-4 flex gap-2" dir="rtl">
          {([
            { key: "surahs" as ViewMode, label: "السور" },
            { key: "juz" as ViewMode, label: "الأجزاء" },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setViewMode(tab.key)}
              className={cn(
                "flex-1 rounded-lg py-2 text-sm font-medium transition-colors",
                viewMode === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Bookmarks View */}
      {showBookmarks && (
        <div className="mb-4">
          <h2 className="mb-2 text-lg font-semibold">العلامات المرجعية</h2>
          {bookmarks.length === 0 ? (
            <p className="text-sm text-muted-foreground">لا توجد علامات مرجعية بعد</p>
          ) : (
            <div className="space-y-2">
              {bookmarks.map((b, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/surah/${b.surah}?ayah=${b.ayah}`)}
                  className="flex w-full items-center justify-between rounded-lg bg-card p-3 shadow-sm"
                >
                  <span className="text-sm text-muted-foreground">آية {toArabicNumerals(b.ayah)}</span>
                  <span className="font-semibold">
                    سورة {getSurahName(b.surah)}
                  </span>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Favorites empty state */}
      {showFavorites && displayList.length === 0 && !loading && (
        <p className="text-center text-sm text-muted-foreground py-8">لا توجد سور مفضلة بعد</p>
      )}

      {/* Ayah Search Results */}
      {search.trim().length >= 3 && !showBookmarks && !showFavorites && isSurahMode && (
        <div className="mb-4" dir="rtl">
          <h2 className="mb-2 text-lg font-semibold">نتائج البحث في الآيات</h2>
          {searchingAyahs ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : ayahResults.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">
              لا توجد نتائج — تأكد من تحميل السور أولاً للبحث في النصوص
            </p>
          ) : (
            <div className="space-y-2">
              {ayahResults.map((r, i) => (
                <motion.button
                  key={`${r.surahNumber}-${r.ayahNumber}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => navigate(`/surah/${r.surahNumber}?ayah=${r.ayahNumber}`)}
                  className="flex w-full flex-col gap-1 rounded-xl bg-card p-4 text-right shadow-sm transition-colors active:bg-muted"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">آية {toArabicNumerals(r.ayahNumber)}</span>
                    <span className="text-sm font-semibold text-primary">{r.surahName}</span>
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
      {!showBookmarks && isSurahMode && (
        <div className="space-y-2">
          {loading
            ? Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
              ))
            : displayList.map((surah, i) => (
                <motion.button
                  key={surah.number}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => navigate(`/surah/${surah.number}`)}
                  className="flex w-full items-center gap-4 rounded-xl bg-card p-4 shadow-sm transition-colors active:bg-muted"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                    {toArabicNumerals(surah.number)}
                  </div>
                  <div className="flex-1 text-right">
                    <p className="font-arabic text-lg font-bold">{surah.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {toArabicNumerals(surah.numberOfAyahs)} آيات · {surah.revelationType === "Meccan" ? "مكية" : "مدنية"}
                    </p>
                  </div>
                  {favorites.includes(surah.number) && (
                    <Star className="h-4 w-4 fill-primary text-primary" />
                  )}
                  {bookmarkedSurahs.includes(surah.number) && (
                    <Bookmark className="h-4 w-4 text-accent" />
                  )}
                </motion.button>
              ))}
        </div>
      )}

      {/* Juz List */}
      {!showBookmarks && !showFavorites && viewMode === "juz" && (
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
                  transition={{ delay: i * 0.02 }}
                  onClick={() => setExpandedJuz(isExpanded ? null : juz.juzNumber)}
                  className="flex w-full items-center gap-4 rounded-xl bg-card p-4 shadow-sm transition-colors active:bg-muted"
                  dir="rtl"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                    {toArabicNumerals(juz.juzNumber)}
                  </div>
                  <div className="flex-1 text-right">
                    <p className="text-base font-bold">{juz.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatRange(juz.startSurah, juz.startAyah, juz.endSurah, juz.endAyah)}
                    </p>
                  </div>
                  <svg
                    className={cn("h-4 w-4 text-muted-foreground transition-transform", isExpanded && "rotate-180")}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </motion.button>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mr-6 mt-1 space-y-1 overflow-hidden"
                  >
                    {juzSurahs.map((surah) => (
                      <button
                        key={surah.number}
                        onClick={() => navigate(`/surah/${surah.number}`)}
                        className="flex w-full items-center gap-3 rounded-lg bg-muted/50 p-3 text-right transition-colors active:bg-muted"
                        dir="rtl"
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary">
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
    </div>
  );
}
