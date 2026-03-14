import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Bookmark, BookmarkCheck, Star, BookOpen, Loader as Loader2, Search, Layers, Share2, Maximize2, Globe, Headphones } from "lucide-react";
import { ShareAyahCard } from "@/components/quran/ShareAyahCard";
import ListeningTab from "@/components/quran/ListeningTab";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/hooks/use-toast";
import { fetchSurahAyahs, fetchSurahList, type Ayah, type SurahMeta } from "@/lib/quran-api";
import { fetchTafsir, type TafsirAyah } from "@/lib/tafsir-api";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useDailyReading } from "@/hooks/useDailyReading";
import { useStreak } from "@/hooks/useStreak";
import { cn, toArabicNumerals, stripBismillah } from "@/lib/utils";
import SurahBottomBar from "@/components/quran/SurahBottomBar";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { DEFAULT_TAFSIR, TAFSIR_EDITIONS } from "@/data/tafsir-editions";
import { DEFAULT_TRANSLATION, TRANSLATION_EDITIONS } from "@/data/translation-editions";
import { HighlightText } from "@/components/HighlightText";
import MushafPageView from "@/components/quran/MushafPageView";
import FocusMode from "@/components/quran/FocusMode";
import { useReadingHistory } from "@/hooks/useReadingHistory";
import { useLanguage } from "@/contexts/LanguageContext";

export default function SurahReaderPage() {
  const { id } = useParams<{id: string;}>();
  const surahNumber = Number(id);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetAyah = searchParams.get("ayah") ? Number(searchParams.get("ayah")) : null;
  const [highlightedAyah, setHighlightedAyah] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number | null>(null);
  const [goToPageInput, setGoToPageInput] = useState("");
  const [goToPageOpen, setGoToPageOpen] = useState(false);
  const [mushafTargetPage, setMushafTargetPage] = useState<number | null>(null);
  const ayahRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const audioPlayer = useAudioPlayer();
  const playingAyahInSurah = audioPlayer.surahNumber === surahNumber ? audioPlayer.currentAyahInSurah : null;

  const { t, language, isRTL } = useLanguage();

  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [surahInfo, setSurahInfo] = useState<SurahMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fontSize] = useLocalStorage<number>("wise-font-size", 24);
  const [, setLastRead] = useLocalStorage<{surah: number;ayah: number;} | null>("wise-last-read", null);
  const [bookmarks, setBookmarks] = useLocalStorage<{surah: number;ayah: number;}[]>("wise-bookmarks", []);
  const [favorites, setFavorites] = useLocalStorage<number[]>("wise-favorite-surahs", []);
  const [tafsirEdition] = useLocalStorage<string>("wise-tafsir", DEFAULT_TAFSIR);
  const [translationEnabled] = useLocalStorage<boolean>("wise-translation-enabled", false);
  const [translationEdition] = useLocalStorage<string>("wise-translation", DEFAULT_TRANSLATION);
  const [readerMode, setReaderMode] = useLocalStorage<"ayah" | "mushaf">("wise-reader-mode", "ayah");
  const [focusModeActive, setFocusModeActive] = useState(false);

  // Tab & tafsir state
  const [activeTab, setActiveTab] = useState<"text" | "tafsir" | "translation" | "listening">("text");
  const [focusedAyah, setFocusedAyah] = useState<number | null>(null);
  const [tafsirAyahs, setTafsirAyahs] = useState<TafsirAyah[]>([]);
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const [tafsirError, setTafsirError] = useState("");
  const [tafsirSearch, setTafsirSearch] = useState("");
  const tafsirEditionRef = useRef(tafsirEdition);

  const [translationAyahs, setTranslationAyahs] = useState<TafsirAyah[]>([]);
  const translationEditionRef = useRef(translationEdition);
  const translationEnabledRef = useRef(translationEnabled);

  const { increment } = useDailyReading();
  const { markActive } = useStreak();
  const { addToHistory } = useReadingHistory();
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
    setActiveTab((prev) => prev === "listening" ? "listening" : translationEnabled ? "translation" : "text");
    setFocusedAyah(null);
    setTafsirAyahs([]);
    setTafsirSearch("");
    setTranslationAyahs([]);
    Promise.all([fetchSurahAyahs(surahNumber), fetchSurahList()]).
    then(([ayahData, surahList]) => {
      setAyahs(ayahData);
      const info = surahList.find((s) => s.number === surahNumber) || null;
      setSurahInfo(info);
      setLastRead({ surah: surahNumber, ayah: 1 });
      if (info) addToHistory(surahNumber, info.name);
      setLoading(false);
    }).
    catch(() => {
      setError(t("error_loading"));
      setLoading(false);
    });
  }, [surahNumber, addToHistory, setLastRead]);

  useEffect(() => {
    if (!loading && ayahs.length > 0 && !hasTracked.current) {
      hasTracked.current = true;
      markActive();
      increment(ayahs.length);
    }
  }, [loading, ayahs.length, markActive, increment]);

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

  // Auto-scroll to currently playing ayah
  useEffect(() => {
    if (playingAyahInSurah && readerMode === "ayah") {
      const el = document.getElementById(`ayah-${playingAyahInSurah}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [playingAyahInSurah, readerMode]);

  // Track current Mushaf page via IntersectionObserver
  useEffect(() => {
    if (loading || ayahs.length === 0 || !ayahs[0]?.page) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const ayahNum = Number(entry.target.getAttribute("data-ayah"));
            const ayah = ayahs.find((a) => a.numberInSurah === ayahNum);
            if (ayah?.page) setCurrentPage(ayah.page);
            break;
          }
        }
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: 0 }
    );

    ayahRefs.current.forEach((el) => observer.observe(el));
    // Set initial page
    if (ayahs[0]?.page) setCurrentPage(ayahs[0].page);

    return () => observer.disconnect();
  }, [loading, ayahs]);

  const setAyahRef = useCallback((el: HTMLDivElement | null, num: number) => {
    if (el) ayahRefs.current.set(num, el);else
    ayahRefs.current.delete(num);
  }, []);

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
    fetchTafsir(surahNumber, tafsirEdition).
    then((data) => {
      setTafsirAyahs(data);
      setTafsirLoading(false);
    }).
    catch(() => {
      setTafsirError(t("error_loading"));
      setTafsirLoading(false);
    });
  }, [activeTab, surahNumber, tafsirEdition, tafsirAyahs.length]);

  // Fetch translation whenever the translation tab is active, or translation is enabled
  useEffect(() => {
    if (!translationEnabled && activeTab !== "translation") {
      setTranslationAyahs([]);
      return;
    }
    const editionChanged = translationEditionRef.current !== translationEdition;
    const enabledChanged = translationEnabledRef.current !== translationEnabled;
    translationEditionRef.current = translationEdition;
    translationEnabledRef.current = translationEnabled;
    if (!editionChanged && !enabledChanged && translationAyahs.length > 0) return;

    fetchTafsir(surahNumber, translationEdition).then(setTranslationAyahs).catch(() => {});
  }, [translationEnabled, translationEdition, surahNumber, translationAyahs.length, activeTab]);

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
    <div className="min-h-screen pb-surah-reader">
      {/* Header */}
      <div className="sticky top-0 z-10 glass-subtle border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3 pb-[5px] pt-[12px]">
          <div className="flex items-center gap-1.5">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate("/")}
              className="rounded-xl p-2.5 hover:bg-muted transition-colors">

              <ArrowRight className="h-5 w-5" />
            </motion.button>
            {/* Page indicator in header */}
            {currentPage && activeTab === "text" && (() => {
              const surahPages = ayahs.filter((a) => a.page).map((a) => a.page!);
              const minPage = surahPages.length > 0 ? Math.min(...surahPages) : null;
              const maxPage = surahPages.length > 0 ? Math.max(...surahPages) : null;
              return (
                <Popover open={goToPageOpen} onOpenChange={setGoToPageOpen}>
                <PopoverTrigger asChild>
                  <button className="rounded-md bg-primary/10 px-2 py-1 text-[0.6875rem] font-bold text-primary hover:bg-primary/20 transition-colors">
                    صفحة {toArabicNumerals(currentPage)}
                    {minPage && maxPage && minPage !== maxPage &&
                      <span className="text-primary/60 mr-1">
                        ({toArabicNumerals(minPage)}–{toArabicNumerals(maxPage)})
                      </span>
                      }
                  </button>
                </PopoverTrigger>
                <PopoverContent side="bottom" align="start" className="w-56 p-3" dir={isRTL ? "rtl" : "ltr"}>
                  <p className="text-xs font-medium text-foreground mb-2">انتقل إلى صفحة</p>
                  <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const pageNum = Number(goToPageInput);
                        if (!pageNum || pageNum < 1 || pageNum > 604) {
                          toast({ title: "رقم صفحة غير صالح", description: "أدخل رقمًا بين ١ و ٦٠٤" });
                          return;
                        }
                        const surahPages = ayahs.filter((a) => a.page).map((a) => a.page!);
                        const minPage = Math.min(...surahPages);
                        const maxPage = Math.max(...surahPages);
                        if (pageNum < minPage || pageNum > maxPage) {
                          toast({
                            title: "صفحة خارج نطاق السورة",
                            description: `هذه السورة تقع في الصفحات ${toArabicNumerals(minPage)} - ${toArabicNumerals(maxPage)}`
                          });
                          return;
                        }
                        if (readerMode === "mushaf") {
                          setMushafTargetPage(null);
                          setTimeout(() => setMushafTargetPage(pageNum), 0);
                        } else {
                          const targetAyahOnPage = ayahs.find((a) => a.page === pageNum);
                          if (targetAyahOnPage) {
                            const el = document.getElementById(`ayah-${targetAyahOnPage.numberInSurah}`);
                            el?.scrollIntoView({ behavior: "smooth", block: "center" });
                          }
                        }
                        setGoToPageInput("");
                        setGoToPageOpen(false);
                      }}
                      className="flex gap-2">

                    <Input
                        type="number"
                        min={1}
                        max={604}
                        value={goToPageInput}
                        onChange={(e) => setGoToPageInput(e.target.value)}
                        placeholder="رقم الصفحة"
                        className="text-center text-sm h-8"
                        autoFocus />

                    <button
                        type="submit"
                        className="shrink-0 rounded-md bg-primary px-3 h-8 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors">

                      انتقل
                    </button>
                  </form>
                </PopoverContent>
              </Popover>);

            })()}
          </div>
          <div className="text-center flex-1">
            <h1 className="font-arabic text-xl font-bold">{surahInfo?.name || `${t("surah")} ${surahNumber}`}</h1>
            <p className="text-[0.6875rem] text-muted-foreground">
              {surahInfo &&
              <span>{toArabicNumerals(surahInfo.numberOfAyahs)} {t("ayah")} · {surahInfo.revelationType === "Meccan" ? t("revelation_meccan") : t("revelation_medinan")}</span>
              }
            </p>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setFocusModeActive(true)}
              className="rounded-lg p-2.5 transition-colors text-muted-foreground hover:bg-muted min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="وضع التركيز">
              <Maximize2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setReaderMode(readerMode === "ayah" ? "mushaf" : "ayah")}
              className={cn(
                "rounded-lg p-2.5 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center",
                readerMode === "mushaf" ? "text-primary" : "text-muted-foreground hover:bg-muted"
              )}
              title={readerMode === "ayah" ? "عرض المصحف" : "عرض الآيات"}>
              <Layers className="h-4 w-4" />
            </button>
            <button
              onClick={toggleFavorite}
              className={cn("rounded-lg p-2.5 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center", isFavorite ? "text-primary" : "text-muted-foreground hover:bg-muted")}>
              <Star className={cn("h-4 w-4", isFavorite && "fill-primary")} />
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex justify-center px-3 pt-1 pb-[4px]" dir={isRTL ? "rtl" : "ltr"}>
          <div className="flex gap-1 p-1 rounded-2xl bg-muted/50 border-2 w-full">
            <button
              onClick={() => {setActiveTab("text");setFocusedAyah(null);}}
              className={cn("flex-1 rounded-xl px-2 py-2.5 text-xs font-semibold transition-all border min-h-[44px]",
              activeTab === "text" ?
              "bg-card text-foreground shadow-soft" :
              "text-muted-foreground hover:text-foreground border-transparent"
              )}>
              {t("text_tab")}
            </button>
            <button
              onClick={() => setActiveTab("translation")}
              className={cn("flex-1 rounded-xl px-2 py-2.5 text-xs font-semibold transition-all border min-h-[44px] relative",
              activeTab === "translation" ?
              "bg-card text-foreground shadow-soft" :
              "text-muted-foreground hover:text-foreground border-transparent"
              )}>
              {t("translation_tab")}
              {!translationEnabled && activeTab !== "translation" && (
                <span className="absolute -top-1 -left-1 h-2 w-2 rounded-full bg-primary/60" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("tafsir")}
              className={cn("flex-1 rounded-xl px-2 py-2.5 text-xs font-semibold transition-all border min-h-[44px]",
              activeTab === "tafsir" ?
              "bg-card text-foreground shadow-soft" :
              "text-muted-foreground hover:text-foreground border-transparent"
              )}>
              {t("tafsir_tab")}
            </button>
            <button
              onClick={() => setActiveTab("listening")}
              className={cn("flex-1 rounded-xl px-2 py-2.5 text-xs font-semibold transition-all border min-h-[44px] flex items-center justify-center gap-1",
              activeTab === "listening" ?
              "bg-card text-foreground shadow-soft" :
              "text-muted-foreground hover:text-foreground border-transparent"
              )}>
              <Headphones className="h-3.5 w-3.5" />
              {t("listening_tab")}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 pt-[10px]">
        {activeTab === "listening" ? (
          !loading && ayahs.length > 0 ? (
            <ListeningTab surahNumber={surahNumber} surahName={surahInfo?.name || `سورة ${surahNumber}`} ayahs={ayahs} />
          ) : (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) =>
                <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
              )}
            </div>
          )
        ) : loading ?
        <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) =>
          <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
          )}
          </div> :
        error ?
        <div className="rounded-xl bg-destructive/10 p-6 text-center">
            <p className="text-destructive">{error}</p>
            <button
            onClick={() => window.location.reload()}
            className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">

              إعادة المحاولة
            </button>
          </div> :
        activeTab === "translation" ? (
        /* ===== Translation Tab ===== */
        <div dir="ltr" className="space-y-3">
          {/* Translation header */}
          <div className="flex items-center justify-between mb-2" dir={isRTL ? "rtl" : "ltr"}>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                {TRANSLATION_EDITIONS.find((e) => e.id === translationEdition)?.name ?? "Sahih International"}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {TRANSLATION_EDITIONS.find((e) => e.id === translationEdition)?.language}
            </span>
          </div>

          {translationAyahs.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            translationAyahs.map((tAyah) => {
              const edition = TRANSLATION_EDITIONS.find((e) => e.id === translationEdition);
              return (
                <div
                  key={tAyah.numberInSurah}
                  className="rounded-2xl bg-card p-4 shadow-soft border border-border/50"
                  dir={edition?.dir ?? "ltr"}
                >
                  <div className="flex items-center gap-2 mb-2" dir={isRTL ? "rtl" : "ltr"}>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[0.625rem] font-bold text-primary">
                      {toArabicNumerals(tAyah.numberInSurah)}
                    </span>
                  </div>
                  <p
                    className="text-sm text-foreground leading-relaxed"
                    style={{ textAlign: edition?.dir === "rtl" ? "right" : "left" }}
                  >
                    {tAyah.text}
                  </p>
                </div>
              );
            })
          )}
        </div>
      ) : activeTab === "text" ? (
        /* ===== Text Tab ===== */
        <>
            {/* Reading progress bar */}
            {ayahs.length > 0 && currentPage && (() => {
              const surahPages = ayahs.filter((a) => a.page).map((a) => a.page!);
              const minPage = surahPages.length > 0 ? Math.min(...surahPages) : currentPage;
              const maxPage = surahPages.length > 0 ? Math.max(...surahPages) : currentPage;
              const totalPages = maxPage - minPage + 1;
              const currentOffset = currentPage - minPage;
              const pct = totalPages > 1 ? Math.round((currentOffset / (totalPages - 1)) * 100) : 100;
              return (
                <div className="mb-4 rounded-2xl bg-card border border-border/50 p-3 shadow-soft" dir={isRTL ? "rtl" : "ltr"}>
                  <div className="flex items-center justify-between mb-2 text-xs">
                    <span className="font-semibold text-muted-foreground">{t("reading_progress")}</span>
                    <span className="font-bold text-primary">{language === "ar" ? toArabicNumerals(pct) : pct}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <p className="text-[0.625rem] text-muted-foreground mt-1.5 text-center">
                    {language === "ar" ? `صفحة ${toArabicNumerals(currentPage)} من ${toArabicNumerals(maxPage)}` : `Page ${currentPage} of ${maxPage}`}
                  </p>
                </div>
              );
            })()}
            {/* Mushaf / Ayah view toggle */}
            <div className="mb-4 flex gap-2 p-1 rounded-2xl bg-muted/50 border border-border/30" dir={isRTL ? "rtl" : "ltr"}>
              <button
                onClick={() => setReaderMode("ayah")}
                className={cn(
                  "flex-1 rounded-xl py-2 text-xs font-semibold transition-all",
                  readerMode === "ayah" ? "bg-card text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t("ayah_view")}
              </button>
              <button
                onClick={() => setReaderMode("mushaf")}
                className={cn(
                  "flex-1 rounded-xl py-2 text-xs font-semibold transition-all",
                  readerMode === "mushaf" ? "bg-card text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t("mushaf_view")}
              </button>
            </div>

            {surahNumber !== 1 && surahNumber !== 9 &&
          <div className="ornamental-divider mb-8 px-4">
                <p
              className="shrink-0 font-arabic text-muted-foreground"
              style={{ fontSize: fontSize * 0.85 }}>

                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </p>
              </div>
          }

            {readerMode === "mushaf" ?
          <MushafPageView
            ayahs={ayahs}
            fontSize={fontSize}
            surahNumber={surahNumber}
            highlightedAyah={highlightedAyah}
            playingAyah={playingAyahInSurah}
            isBookmarked={isBookmarked}
            toggleBookmark={toggleBookmark}
            onAyahTafsir={handleAyahTafsir}
            setAyahRef={setAyahRef}
            targetPage={mushafTargetPage}
            onPageChange={(page) => setCurrentPage(page)}
            onSeekToAyah={audioPlayer.seekToAyah} /> :


          <div className="space-y-3" dir={isRTL ? "rtl" : "ltr"}>
                {ayahs.map((ayah, i) => {
              const showPageSep = i > 0 && ayah.page && ayahs[i - 1]?.page && ayah.page !== ayahs[i - 1].page;
              return (
                <div key={ayah.number}>
                      {showPageSep &&
                  <div className="flex items-center gap-3 py-2 text-muted-foreground">
                          <div className="h-px flex-1 bg-border" />
                          <span className="text-xs font-medium">صفحة {toArabicNumerals(ayah.page!)}</span>
                          <div className="h-px flex-1 bg-border" />
                        </div>
                  }
                      <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 1) }}
                    id={`ayah-${ayah.numberInSurah}`}
                    data-ayah={ayah.numberInSurah}
                    ref={(el) => setAyahRef(el, ayah.numberInSurah)}
                    className={cn("group relative rounded-2xl bg-card p-5 shadow-soft border border-border/50 transition-all duration-300 pt-[5px] pb-[5px] pl-[10px] pr-[10px]",

                    highlightedAyah === ayah.numberInSurah && "ring-2 ring-primary/50 bg-primary/5 shadow-glow",
                    playingAyahInSurah === ayah.numberInSurah && "ring-2 ring-primary bg-primary/10 shadow-glow animate-glow-pulse"
                    )}>

                        <div className="mb-3 flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => toggleBookmark(ayah.numberInSurah)}
                          className="rounded-xl p-2 transition-colors hover:bg-muted">

                              {isBookmarked(ayah.numberInSurah) ?
                          <BookmarkCheck className="h-4 w-4 text-gold" /> :

                          <Bookmark className="h-4 w-4 text-muted-foreground opacity-30 transition-opacity group-hover:opacity-100" />
                          }
                            </motion.button>
                            <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleAyahTafsir(ayah.numberInSurah)}
                          className="rounded-xl p-2 transition-colors hover:bg-muted text-muted-foreground opacity-30 group-hover:opacity-100"
                          title={t("tafsir_tab")}>

                              <BookOpen className="h-4 w-4" />
                            </motion.button>
                            <ShareAyahCard
                          ayahText={ayah.text}
                          surahName={surahInfo?.name || ""}
                          ayahNumber={ayah.numberInSurah}
                          surahNumber={surahNumber} />

                          </div>
                          <div className="number-badge h-8 w-8 text-xs">
                            {toArabicNumerals(ayah.numberInSurah)}
                          </div>
                        </div>
                        <p
                      className={cn(
                        "font-arabic text-foreground",
                        playingAyahInSurah !== null && "cursor-pointer hover:text-primary/80 transition-colors"
                      )}
                      style={{ fontSize, lineHeight: 2.2 }}
                      onClick={() => {
                        if (playingAyahInSurah !== null) {
                          audioPlayer.seekToAyah(ayah.numberInSurah);
                        }
                      }}>

                          {stripBismillah(ayah.text, surahNumber, ayah.numberInSurah)}
                        </p>
                        {translationEnabled && translationAyahs.length > 0 && (() => {
                          const tAyah = translationAyahs.find((tAyah) => tAyah.numberInSurah === ayah.numberInSurah);
                          if (!tAyah) return null;
                          const edition = TRANSLATION_EDITIONS.find((e) => e.id === translationEdition);
                          return (
                            <p
                              className="mt-2 border-t border-border/30 pt-2 text-sm text-muted-foreground leading-relaxed"
                              dir={edition?.dir ?? "ltr"}
                              style={{ textAlign: edition?.dir === "rtl" ? "right" : "left" }}>
                              {tAyah.text}
                            </p>
                          );
                        })()}
                      </motion.div>
                    </div>);

            })}
              </div>
          }
          </>) : (

        /* ===== Tafsir Tab ===== */
        <div dir={isRTL ? "rtl" : "ltr"}>
            {tafsirLoading ?
          <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div> :
          tafsirError ?
          <div className="rounded-xl bg-destructive/10 p-6 text-center">
                <p className="text-destructive text-sm">{tafsirError}</p>
              </div> :
          focusedAyah !== null ? (
          /* Single ayah tafsir */
          <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <h2 className="font-arabic text-base font-bold text-foreground">
                      {t("tafsir_tab")} {t("ayah")} {toArabicNumerals(focusedAyah)}
                    </h2>
                  </div>
                  <span className="text-xs text-muted-foreground">{editionName}</span>
                </div>

                <div className="rounded-xl bg-card p-5 shadow-sm border border-border">
                  <p
                className="font-arabic text-foreground/90 leading-[2.2]"
                style={{ fontSize: 18 }}>

                    {tafsirAyahs.find((a) => a.numberInSurah === focusedAyah)?.text ||
                t("no_tafsir")}
                  </p>
                </div>

                <button
              onClick={() => setFocusedAyah(null)}
              className="text-sm text-primary hover:underline">

                  ← عرض تفسير السورة بالكامل
                </button>
              </div>) : (

          /* Full surah tafsir */
          <div className="space-y-5">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <h2 className="font-arabic text-base font-bold text-foreground">{t("tafsir_tab")} {t("surah")}</h2>
                  <span className="text-xs text-muted-foreground mr-auto">{editionName}</span>
                </div>

                {/* Ayah picker + Search input */}
                <div className="flex gap-2 mb-2">
                  <Select
                value=""
                onValueChange={(val) => setFocusedAyah(Number(val))}>

                    <SelectTrigger className="w-40 shrink-0 text-right">
                      <SelectValue placeholder="انتقل إلى آية..." />
                    </SelectTrigger>
                    <SelectContent>
                      {tafsirAyahs.map((tafsirItem) =>
                  <SelectItem key={tafsirItem.numberInSurah} value={String(tafsirItem.numberInSurah)}>
                          {t("ayah")} {toArabicNumerals(tafsirItem.numberInSurah)}
                        </SelectItem>
                  )}
                    </SelectContent>
                  </Select>
                  <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                  placeholder={t("search")}
                  value={tafsirSearch}
                  onChange={(e) => setTafsirSearch(e.target.value)}
                  className="pr-10 text-right"
                  dir={isRTL ? "rtl" : "ltr"} />

                  </div>
                </div>

                {(() => {
              const filteredTafsir = tafsirSearch.trim() ?
              tafsirAyahs.filter((tafsirItem) => tafsirItem.text.includes(tafsirSearch.trim())) :
              tafsirAyahs;

              if (filteredTafsir.length === 0) {
                return (
                  <p className="text-center text-sm text-muted-foreground py-8">
                        لا توجد نتائج لـ "{tafsirSearch}"
                      </p>);

              }

              return filteredTafsir.map((tafsirItem) =>
              <div key={tafsirItem.numberInSurah} className="rounded-xl bg-card p-4 shadow-sm border border-border">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="flex h-6 w-6 rotate-45 items-center justify-center rounded-sm bg-primary/10">
                          <span className="-rotate-45 text-[0.625rem] font-bold text-primary">
                            {toArabicNumerals(tafsirItem.numberInSurah)}
                          </span>
                        </span>
                        <span className="text-xs text-muted-foreground">{t("ayah")} {toArabicNumerals(tafsirItem.numberInSurah)}</span>
                      </div>
                      <p
                  className="font-arabic text-foreground/90 leading-[2.2]"
                  style={{ fontSize: 17 }}>

                        <HighlightText text={tafsirItem.text} highlight={tafsirSearch.trim()} />
                      </p>
                    </div>
              );
            })()}
              </div>)
          }
          </div>)
        }
      </div>

      {/* Bottom player bar */}
      <SurahBottomBar
        surahNumber={surahNumber}
        surahName={surahInfo?.name || `${t("surah")} ${surahNumber}`}
        ayahs={ayahs} />

      {/* Focus Mode Overlay */}
      <AnimatePresence>
        {focusModeActive && ayahs.length > 0 &&
        <FocusMode
          ayahs={ayahs}
          fontSize={fontSize}
          surahNumber={surahNumber}
          surahName={surahInfo?.name || `${t("surah")} ${surahNumber}`}
          playingAyah={playingAyahInSurah}
          onSeekToAyah={audioPlayer.seekToAyah}
          onClose={() => setFocusModeActive(false)} />

        }
      </AnimatePresence>
    </div>);

}
