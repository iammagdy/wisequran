import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Bookmark, BookmarkCheck, Volume2, Timer, Star } from "lucide-react";
import { fetchSurahAyahs, fetchSurahList, type Ayah, type SurahMeta } from "@/lib/quran-api";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useDailyReading } from "@/hooks/useDailyReading";
import { useStreak } from "@/hooks/useStreak";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import SurahAudioPlayer from "@/components/quran/SurahAudioPlayer";
import ReadingTimer from "@/components/quran/ReadingTimer";

export default function SurahReaderPage() {
  const { id } = useParams<{ id: string }>();
  const surahNumber = Number(id);
  const navigate = useNavigate();

  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [surahInfo, setSurahInfo] = useState<SurahMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fontSize] = useLocalStorage<number>("wise-font-size", 24);
  const [, setLastRead] = useLocalStorage<{ surah: number; ayah: number } | null>("wise-last-read", null);
  const [bookmarks, setBookmarks] = useLocalStorage<{ surah: number; ayah: number }[]>("wise-bookmarks", []);
  const [favorites, setFavorites] = useLocalStorage<number[]>("wise-favorite-surahs", []);

  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarTab, setToolbarTab] = useState<"audio" | "timer">("audio");

  const { increment } = useDailyReading();
  const { markActive } = useStreak();
  const hasTracked = useRef(false);

  const isFavorite = favorites.includes(surahNumber);

  const toggleFavorite = () => {
    if (isFavorite) {
      setFavorites(favorites.filter((n) => n !== surahNumber));
    } else {
      setFavorites([...favorites, surahNumber]);
    }
  };

  useEffect(() => {
    hasTracked.current = false;
    setLoading(true);
    setError("");
    Promise.all([fetchSurahAyahs(surahNumber), fetchSurahList()])
      .then(([ayahData, surahList]) => {
        setAyahs(ayahData);
        setSurahInfo(surahList.find((s) => s.number === surahNumber) || null);
        setLastRead({ surah: surahNumber, ayah: 1 });
        setLoading(false);
      })
      .catch(() => {
        setError("تعذر تحميل السورة. تحقق من الاتصال بالإنترنت.");
        setLoading(false);
      });
  }, [surahNumber]);

  useEffect(() => {
    if (!loading && ayahs.length > 0 && !hasTracked.current) {
      hasTracked.current = true;
      markActive();
      increment(ayahs.length);
    }
  }, [loading, ayahs.length]);

  const isBookmarked = (ayahNum: number) =>
    bookmarks.some((b) => b.surah === surahNumber && b.ayah === ayahNum);

  const toggleBookmark = (ayahNum: number) => {
    if (isBookmarked(ayahNum)) {
      setBookmarks(bookmarks.filter((b) => !(b.surah === surahNumber && b.ayah === ayahNum)));
    } else {
      setBookmarks([...bookmarks, { surah: surahNumber, ayah: ayahNum }]);
    }
  };

  const toggleToolbar = (tab: "audio" | "timer") => {
    if (showToolbar && toolbarTab === tab) {
      setShowToolbar(false);
    } else {
      setToolbarTab(tab);
      setShowToolbar(true);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-1">
            <button onClick={() => navigate("/")} className="rounded-lg p-2 hover:bg-muted transition-colors">
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
          <div className="text-center flex-1">
            <h1 className="font-arabic text-xl font-bold">{surahInfo?.name || `سورة ${surahNumber}`}</h1>
            <p className="text-[11px] text-muted-foreground">
              {surahInfo?.englishName}
              {surahInfo && (
                <span className="mx-1">·</span>
              )}
              {surahInfo && (
                <span>{surahInfo.numberOfAyahs} آية · {surahInfo.revelationType === "Meccan" ? "مكية" : "مدنية"}</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              onClick={toggleFavorite}
              className={cn("rounded-lg p-2 transition-colors", isFavorite ? "text-primary" : "text-muted-foreground hover:bg-muted")}
            >
              <Star className={cn("h-4 w-4", isFavorite && "fill-primary")} />
            </button>
            <button
              onClick={() => toggleToolbar("timer")}
              className={cn("rounded-lg p-2 transition-colors", showToolbar && toolbarTab === "timer" ? "text-primary" : "text-muted-foreground hover:bg-muted")}
            >
              <Timer className="h-4 w-4" />
            </button>
            <button
              onClick={() => toggleToolbar("audio")}
              className={cn("rounded-lg p-2 transition-colors", showToolbar && toolbarTab === "audio" ? "text-primary" : "text-muted-foreground hover:bg-muted")}
            >
              <Volume2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Ornamental divider */}
        <div className="ornamental-divider px-8 pb-1">
          <span className="h-1.5 w-1.5 rotate-45 bg-primary/30" />
        </div>
      </div>

      {/* Unified Toolbar */}
      <AnimatePresence>
        {showToolbar && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mx-4 mt-3 rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm p-3 shadow-sm card-accent">
              {/* Tab switcher */}
              <div className="flex gap-1 mb-2.5" dir="rtl">
                <button
                  onClick={() => setToolbarTab("audio")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    toolbarTab === "audio" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Volume2 className="h-3 w-3" />
                  الاستماع
                </button>
                <button
                  onClick={() => setToolbarTab("timer")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    toolbarTab === "timer" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Timer className="h-3 w-3" />
                  مؤقت
                </button>
              </div>

              {toolbarTab === "audio" ? (
                <SurahAudioPlayer surahNumber={surahNumber} />
              ) : (
                <ReadingTimer />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="px-4 py-6">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl bg-destructive/10 p-6 text-center">
            <p className="text-destructive">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : (
          <>
            {/* Bismillah with decorative lines */}
            {surahNumber !== 1 && surahNumber !== 9 && (
              <div className="ornamental-divider mb-8 px-4">
                <p
                  className="shrink-0 font-arabic text-muted-foreground"
                  style={{ fontSize: fontSize * 0.85 }}
                >
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </p>
              </div>
            )}

            <div className="space-y-3" dir="rtl">
              {ayahs.map((ayah, i) => (
                <motion.div
                  key={ayah.number}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.02, 1) }}
                  className="group relative rounded-xl border-t-2 border-primary/5 bg-card p-4 shadow-sm"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <button
                      onClick={() => toggleBookmark(ayah.numberInSurah)}
                      className="rounded-lg p-1.5 transition-colors hover:bg-muted"
                    >
                      {isBookmarked(ayah.numberInSurah) ? (
                        <BookmarkCheck className="h-4 w-4 text-accent" />
                      ) : (
                        <Bookmark className="h-4 w-4 text-muted-foreground opacity-30 transition-opacity group-hover:opacity-100" />
                      )}
                    </button>
                    {/* Diamond-shaped ayah number */}
                    <span className="flex h-7 w-7 rotate-45 items-center justify-center rounded-sm bg-primary/10">
                      <span className="-rotate-45 text-xs font-bold text-primary">
                        {ayah.numberInSurah}
                      </span>
                    </span>
                  </div>
                  <p
                    className="font-arabic text-foreground"
                    style={{ fontSize, lineHeight: 2.2 }}
                  >
                    {ayah.text}
                  </p>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
