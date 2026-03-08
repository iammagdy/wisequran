import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, BookOpen, Bookmark, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { fetchSurahList, type SurahMeta } from "@/lib/quran-api";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useDailyReading } from "@/hooks/useDailyReading";
import { useStreak } from "@/hooks/useStreak";
import { cn } from "@/lib/utils";

export default function QuranPage() {
  const [surahs, setSurahs] = useState<SurahMeta[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [lastRead] = useLocalStorage<{ surah: number; ayah: number } | null>("wise-last-read", null);
  const [bookmarks] = useLocalStorage<{ surah: number; ayah: number }[]>("wise-bookmarks", []);
  const [favorites] = useLocalStorage<number[]>("wise-favorite-surahs", []);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const navigate = useNavigate();
  const { goal, todayCount } = useDailyReading();
  const { streak } = useStreak();

  useEffect(() => {
    fetchSurahList().then((data) => {
      setSurahs(data);
      setLoading(false);
    });
  }, []);

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

  return (
    <div className="px-4 pt-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">القرآن الكريم</h1>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setShowFavorites(!showFavorites); setShowBookmarks(false); }}
            className={cn(
              "rounded-lg p-2 transition-colors",
              showFavorites ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            )}
          >
            <Star className="h-5 w-5" />
          </button>
          <button
            onClick={() => { setShowBookmarks(!showBookmarks); setShowFavorites(false); }}
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
            اليوم: {todayCount} / {goal} آية
          </span>
          {streak > 0 && (
            <span className="text-sm font-semibold">🔥 {streak} أيام</span>
          )}
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Last Read */}
      {lastRead && !showBookmarks && !showFavorites && (
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
              سورة {surahs.find((s) => s.number === lastRead.surah)?.name || lastRead.surah} — آية {lastRead.ayah}
            </p>
          </div>
        </motion.button>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="بحث بالاسم أو الرقم..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-10 text-right"
          dir="rtl"
        />
      </div>

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
                  onClick={() => navigate(`/surah/${b.surah}`)}
                  className="flex w-full items-center justify-between rounded-lg bg-card p-3 shadow-sm"
                >
                  <span className="text-sm text-muted-foreground">آية {b.ayah}</span>
                  <span className="font-semibold">
                    سورة {surahs.find((s) => s.number === b.surah)?.name || b.surah}
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

      {/* Surah List */}
      {!showBookmarks && (
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
                    {surah.number}
                  </div>
                  <div className="flex-1 text-right">
                    <p className="font-arabic text-lg font-bold">{surah.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {surah.numberOfAyahs} آيات · {surah.revelationType === "Meccan" ? "مكية" : "مدنية"}
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
    </div>
  );
}
