import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Bookmark, BookmarkCheck, Star, BookOpen, Loader2, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { fetchSurahAyahs, fetchSurahList, type Ayah, type SurahMeta } from "@/lib/quran-api";
import { fetchTafsir, type TafsirAyah } from "@/lib/tafsir-api";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useDailyReading } from "@/hooks/useDailyReading";
import { useStreak } from "@/hooks/useStreak";
import { cn, toArabicNumerals } from "@/lib/utils";
import SurahBottomBar from "@/components/quran/SurahBottomBar";
import { DEFAULT_TAFSIR, TAFSIR_EDITIONS } from "@/data/tafsir-editions";
import { HighlightText } from "@/components/HighlightText";

export default function SurahReaderPage() {
  const { id } = useParams<{ id: string }>();
  const surahNumber = Number(id);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetAyah = searchParams.get("ayah") ? Number(searchParams.get("ayah")) : null;
  const [highlightedAyah, setHighlightedAyah] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number | null>(null);
  const ayahRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [surahInfo, setSurahInfo] = useState<SurahMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fontSize] = useLocalStorage<number>("wise-font-size", 24);
  const [, setLastRead] = useLocalStorage<{ surah: number; ayah: number } | null>("wise-last-read", null);
  const [bookmarks, setBookmarks] = useLocalStorage<{ surah: number; ayah: number }[]>("wise-bookmarks", []);
  const [favorites, setFavorites] = useLocalStorage<number[]>("wise-favorite-surahs", []);
  const [tafsirEdition] = useLocalStorage<string>("wise-tafsir", DEFAULT_TAFSIR);

  // Tab & tafsir state
  const [activeTab, setActiveTab] = useState<"text" | "tafsir">("text");
  const [focusedAyah, setFocusedAyah] = useState<number | null>(null);
  const [tafsirAyahs, setTafsirAyahs] = useState<TafsirAyah[]>([]);
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const [tafsirError, setTafsirError] = useState("");
  const [tafsirSearch, setTafsirSearch] = useState("");
  const tafsirEditionRef = useRef(tafsirEdition);

  const { increment } = useDailyReading();
  const { markActive } = useStreak();
  const hasTracked = useRef(false);

  const isFavorite = favorites.includes(surahNumber);
  const editionName = TAFSIR_EDITIONS.find((e) => e.id === tafsirEdition)?.name || tafsirEdition;

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
    setActiveTab("text");
    setFocusedAyah(null);
    setTafsirAyahs([]);
    setTafsirSearch("");
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

  // Scroll to target ayah from query param
  useEffect(() => {
    if (!loading && ayahs.length > 0 && targetAyah) {
      const el = document.getElementById(`ayah-${targetAyah}`);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          setHighlightedAyah(targetAyah);
          setTimeout(() => setHighlightedAyah(null), 2000);
        }, 300);
      }
    }
  }, [loading, ayahs.length, targetAyah]);

  // Fetch tafsir when switching to tafsir tab or edition changes
  useEffect(() => {
    if (activeTab !== "tafsir") return;
    // If edition changed, clear old data
    if (tafsirEditionRef.current !== tafsirEdition) {
      setTafsirAyahs([]);
      tafsirEditionRef.current = tafsirEdition;
    }
    if (tafsirAyahs.length > 0 && tafsirEditionRef.current === tafsirEdition) return;

    setTafsirLoading(true);
    setTafsirError("");
    fetchTafsir(surahNumber, tafsirEdition)
      .then((data) => {
        setTafsirAyahs(data);
        setTafsirLoading(false);
      })
      .catch(() => {
        setTafsirError("تعذر تحميل التفسير. تحقق من الاتصال بالإنترنت.");
        setTafsirLoading(false);
      });
  }, [activeTab, surahNumber, tafsirEdition]);

  const isBookmarked = (ayahNum: number) =>
    bookmarks.some((b) => b.surah === surahNumber && b.ayah === ayahNum);

  const toggleBookmark = (ayahNum: number) => {
    if (isBookmarked(ayahNum)) {
      setBookmarks(bookmarks.filter((b) => !(b.surah === surahNumber && b.ayah === ayahNum)));
    } else {
      setBookmarks([...bookmarks, { surah: surahNumber, ayah: ayahNum }]);
    }
  };

  const handleAyahTafsir = (ayahNum: number) => {
    setFocusedAyah(ayahNum);
    setActiveTab("tafsir");
  };

  return (
    <div className="min-h-screen pb-36">
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
              {surahInfo && (
                <span>{toArabicNumerals(surahInfo.numberOfAyahs)} آية · {surahInfo.revelationType === "Meccan" ? "مكية" : "مدنية"}</span>
              )}
            </p>
          </div>
          <div className="flex items-center">
            <button
              onClick={toggleFavorite}
              className={cn("rounded-lg p-2 transition-colors", isFavorite ? "text-primary" : "text-muted-foreground hover:bg-muted")}
            >
              <Star className={cn("h-4 w-4", isFavorite && "fill-primary")} />
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex justify-center gap-2 px-4 pb-2" dir="rtl">
          <button
            onClick={() => { setActiveTab("text"); setFocusedAyah(null); }}
            className={cn(
              "rounded-full px-5 py-1.5 text-sm font-medium transition-colors",
              activeTab === "text"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            النص
          </button>
          <button
            onClick={() => setActiveTab("tafsir")}
            className={cn(
              "rounded-full px-5 py-1.5 text-sm font-medium transition-colors",
              activeTab === "tafsir"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            التفسير
          </button>
        </div>
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
        ) : activeTab === "text" ? (
          /* ===== النص Tab ===== */
          <>
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
                  id={`ayah-${ayah.numberInSurah}`}
                  className={cn(
                    "group relative rounded-xl border-t-2 border-primary/5 bg-card p-4 shadow-sm transition-all",
                    highlightedAyah === ayah.numberInSurah && "ring-2 ring-primary/50 bg-primary/5"
                  )}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-1">
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
                      <button
                        onClick={() => handleAyahTafsir(ayah.numberInSurah)}
                        className="rounded-lg p-1.5 transition-colors hover:bg-muted text-muted-foreground opacity-30 group-hover:opacity-100"
                        title="تفسير"
                      >
                        <BookOpen className="h-4 w-4" />
                      </button>
                    </div>
                    <span className="flex h-7 w-7 rotate-45 items-center justify-center rounded-sm bg-primary/10">
                      <span className="-rotate-45 text-xs font-bold text-primary">
                        {toArabicNumerals(ayah.numberInSurah)}
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
        ) : (
          /* ===== التفسير Tab ===== */
          <div dir="rtl">
            {tafsirLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : tafsirError ? (
              <div className="rounded-xl bg-destructive/10 p-6 text-center">
                <p className="text-destructive text-sm">{tafsirError}</p>
              </div>
            ) : focusedAyah !== null ? (
              /* Single ayah tafsir */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <h2 className="font-arabic text-base font-bold text-foreground">
                      تفسير الآية {toArabicNumerals(focusedAyah)}
                    </h2>
                  </div>
                  <span className="text-xs text-muted-foreground">{editionName}</span>
                </div>

                <div className="rounded-xl bg-card p-5 shadow-sm border border-border">
                  <p
                    className="font-arabic text-foreground/90 leading-[2.2]"
                    style={{ fontSize: 18 }}
                  >
                    {tafsirAyahs.find((a) => a.numberInSurah === focusedAyah)?.text ||
                      "لم يتم العثور على التفسير"}
                  </p>
                </div>

                <button
                  onClick={() => setFocusedAyah(null)}
                  className="text-sm text-primary hover:underline"
                >
                  ← عرض تفسير السورة بالكامل
                </button>
              </div>
            ) : (
              /* Full surah tafsir */
              <div className="space-y-5">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <h2 className="font-arabic text-base font-bold text-foreground">تفسير السورة</h2>
                  <span className="text-xs text-muted-foreground mr-auto">{editionName}</span>
                </div>

                {/* Ayah picker + Search input */}
                <div className="flex gap-2 mb-2">
                  <Select
                    value=""
                    onValueChange={(val) => setFocusedAyah(Number(val))}
                  >
                    <SelectTrigger className="w-40 shrink-0 text-right">
                      <SelectValue placeholder="انتقل إلى آية..." />
                    </SelectTrigger>
                    <SelectContent>
                      {tafsirAyahs.map((t) => (
                        <SelectItem key={t.numberInSurah} value={String(t.numberInSurah)}>
                          الآية {toArabicNumerals(t.numberInSurah)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="ابحث في التفسير..."
                      value={tafsirSearch}
                      onChange={(e) => setTafsirSearch(e.target.value)}
                      className="pr-10 text-right"
                      dir="rtl"
                    />
                  </div>
                </div>

                {(() => {
                  const filteredTafsir = tafsirSearch.trim()
                    ? tafsirAyahs.filter((t) => t.text.includes(tafsirSearch.trim()))
                    : tafsirAyahs;

                  if (filteredTafsir.length === 0) {
                    return (
                      <p className="text-center text-sm text-muted-foreground py-8">
                        لا توجد نتائج لـ "{tafsirSearch}"
                      </p>
                    );
                  }

                  return filteredTafsir.map((t) => (
                    <div key={t.numberInSurah} className="rounded-xl bg-card p-4 shadow-sm border border-border">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="flex h-6 w-6 rotate-45 items-center justify-center rounded-sm bg-primary/10">
                          <span className="-rotate-45 text-[10px] font-bold text-primary">
                            {toArabicNumerals(t.numberInSurah)}
                          </span>
                        </span>
                        <span className="text-xs text-muted-foreground">الآية {toArabicNumerals(t.numberInSurah)}</span>
                      </div>
                      <p
                        className="font-arabic text-foreground/90 leading-[2.2]"
                        style={{ fontSize: 17 }}
                      >
                        <HighlightText text={t.text} highlight={tafsirSearch.trim()} />
                      </p>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom player bar */}
      <SurahBottomBar
        surahNumber={surahNumber}
        surahName={surahInfo?.name || `سورة ${surahNumber}`}
      />
    </div>
  );
}
