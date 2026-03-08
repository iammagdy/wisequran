import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Bookmark, BookmarkCheck, Volume2, Timer } from "lucide-react";
import { fetchSurahAyahs, fetchSurahList, type Ayah, type SurahMeta } from "@/lib/quran-api";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { cn } from "@/lib/utils";
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

  const [showAudio, setShowAudio] = useState(false);
  const [showTimer, setShowTimer] = useState(false);

  useEffect(() => {
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

  const isBookmarked = (ayahNum: number) =>
    bookmarks.some((b) => b.surah === surahNumber && b.ayah === ayahNum);

  const toggleBookmark = (ayahNum: number) => {
    if (isBookmarked(ayahNum)) {
      setBookmarks(bookmarks.filter((b) => !(b.surah === surahNumber && b.ayah === ayahNum)));
    } else {
      setBookmarks([...bookmarks, { surah: surahNumber, ayah: ayahNum }]);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-md px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button onClick={() => navigate("/")} className="rounded-lg p-2 hover:bg-muted">
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
          <div className="text-center">
            <h1 className="font-arabic text-lg font-bold">{surahInfo?.name || `سورة ${surahNumber}`}</h1>
            <p className="text-xs text-muted-foreground">{surahInfo?.englishName}</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowTimer((v) => !v)}
              className={cn("rounded-lg p-2 transition-colors", showTimer ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground")}
            >
              <Timer className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowAudio((v) => !v)}
              className={cn("rounded-lg p-2 transition-colors", showAudio ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground")}
            >
              <Volume2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Audio & Timer toolbar */}
      <div className="px-4 pt-3 space-y-2">
        {showAudio && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <SurahAudioPlayer surahNumber={surahNumber} />
          </motion.div>
        )}
        {showTimer && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <ReadingTimer />
          </motion.div>
        )}
      </div>

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
            {/* Bismillah */}
            {surahNumber !== 1 && surahNumber !== 9 && (
              <p
                className="mb-6 text-center font-arabic text-muted-foreground"
                style={{ fontSize: fontSize * 0.9 }}
              >
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </p>
            )}

            <div className="space-y-4" dir="rtl">
              {ayahs.map((ayah, i) => (
                <motion.div
                  key={ayah.number}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.02, 1) }}
                  className="group relative rounded-xl bg-card p-4 shadow-sm"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <button
                      onClick={() => toggleBookmark(ayah.numberInSurah)}
                      className="rounded-lg p-1.5 transition-colors hover:bg-muted"
                    >
                      {isBookmarked(ayah.numberInSurah) ? (
                        <BookmarkCheck className="h-4 w-4 text-accent" />
                      ) : (
                        <Bookmark className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      )}
                    </button>
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {ayah.numberInSurah}
                    </span>
                  </div>
                  <p
                    className="font-arabic leading-loose text-foreground"
                    style={{ fontSize }}
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
