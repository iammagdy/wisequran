import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, TriangleAlert as AlertTriangle, History, ChevronDown, ChevronUp, TrendingUp, Sparkles, Check, X, SkipForward } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { SURAH_META } from "@/data/surah-meta";
import { fetchSurahAyahs, type Ayah } from "@/lib/quran-api";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useRecitationHistory } from "@/hooks/useRecitationHistory";
import { scoreRangeRecitation, tokenize, type StrictnessLevel, type PerAyahScoreResult, type WordDiff } from "@/lib/ayah-match";
import { cn, toArabicNumerals } from "@/lib/utils";
import SurahRangeSelector from "@/components/recitation/SurahRangeSelector";
import MicButton from "@/components/recitation/MicButton";
import RecitationScoreCard from "@/components/recitation/RecitationScoreCard";

type PagePhase = "setup" | "recording" | "result";

interface ScoreResult {
  overallScore: number;
  correctAyahs: number;
  totalAyahs: number;
  perAyah: PerAyahScoreResult[];
  transcript: string;
}

interface AyahState {
  numberInSurah: number;
  status: "pending" | "correct" | "incorrect" | "skipped";
  score: number;
  attempt: number;
  wordDiffs: WordDiff[];
}

function UnsupportedBanner({ message, desc }: { message: string; desc: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 flex gap-3"
    >
      <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-destructive">{message}</p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

function EnglishComingSoonBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-amber-500/30 bg-amber-500/8 p-4 flex gap-3 mb-4"
    >
      <Sparkles className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Arabic Only — English Coming Soon</p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          Speech recognition scoring is currently optimized for Arabic recitation only. English support is on its way.
        </p>
      </div>
    </motion.div>
  );
}

function IOSUnsupportedBanner({ language }: { language: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-amber-500/30 bg-amber-500/8 p-4 flex gap-3 mb-4"
    >
      <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
          {language === "ar" ? "التعرف على الصوت غير متاح على iOS Safari" : "Speech Recognition Not Available on iOS Safari"}
        </p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          {language === "ar"
            ? "متصفح Safari على iPhone لا يدعم ميزة التعرف على الصوت. يُرجى استخدام جهاز Android أو حاسوب."
            : "Safari on iPhone does not support the Speech Recognition API. Please use an Android device or desktop browser."}
        </p>
      </div>
    </motion.div>
  );
}

const STRICTNESS_OPTIONS: StrictnessLevel[] = ["lenient", "normal", "strict"];
const MAX_ATTEMPTS = 2;

const STRICTNESS_THRESHOLD: Record<StrictnessLevel, number> = {
  lenient: 50,
  normal: 65,
  strict: 80,
};

export default function RecitationTestPage() {
  const { t, language, isRTL } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialSurah = parseInt(searchParams.get("surah") || "1", 10);
  const [surahNumber, setSurahNumber] = useState(
    initialSurah >= 1 && initialSurah <= 114 ? initialSurah : 1
  );
  const [ayahFrom, setAyahFrom] = useState(1);
  const [ayahTo, setAyahTo] = useState(7);
  const [strictness, setStrictness] = useState<StrictnessLevel>("normal");
  const [phase, setPhase] = useState<PagePhase>("setup");
  const [ayahsData, setAyahsData] = useState<Ayah[]>([]);
  const [loadingAyahs, setLoadingAyahs] = useState(false);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  const [ayahStates, setAyahStates] = useState<AyahState[]>([]);
  const [currentAyahIndex, setCurrentAyahIndex] = useState(0);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);

  const ayahRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const containerRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spokenWordPointerRef = useRef(0);
  const lockedAyahCountRef = useRef(0);

  const speech = useSpeechRecognition();
  const recitationHistory = useRecitationHistory();
  const silentAudioRef = useRef<HTMLAudioElement | null>(null);

  const meta = SURAH_META[surahNumber - 1];

  useEffect(() => {
    setAyahFrom(1);
    setAyahTo(Math.min(10, meta.numberOfAyahs));
  }, [surahNumber]);

  const handleRangeChange = useCallback((from: number, to: number) => {
    setAyahFrom(from);
    setAyahTo(to);
  }, []);

  const loadAyahs = async () => {
    setLoadingAyahs(true);
    try {
      const all = await fetchSurahAyahs(surahNumber);
      const range = all.filter(
        (a) => a.numberInSurah >= ayahFrom && a.numberInSurah <= ayahTo
      );
      setAyahsData(range);
      return range;
    } catch {
      setAyahsData([]);
      return [];
    } finally {
      setLoadingAyahs(false);
    }
  };

  const handleStartTest = async () => {
    const range = await loadAyahs();
    speech.reset();
    spokenWordPointerRef.current = 0;
    lockedAyahCountRef.current = 0;
    setAyahStates(range.map(a => ({
      numberInSurah: a.numberInSurah,
      status: "pending",
      score: 0,
      attempt: 0,
      wordDiffs: [],
    })));
    setCurrentAyahIndex(0);
    setRetryMessage(null);
    setPhase("recording");
  };

  const handleMicStart = useCallback(() => {
    if (!silentAudioRef.current) {
      const audio = new Audio("data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjYwLjE2LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV6urq6urq6urq6urq6urq6urq6urq6urq6urq6urq6urq//OEAAOAAAAAIAAAAAQAAAADxIAAAeAAAAAAyIQUAAwEEAAAB1wQAAAAG5uP//xQo4BwwMAAECAR/f7//////9/4h7/8///Q2P//+T7f///+i//T//4iK5b4AAAAAAACAAH//OEAAiBQAIAAAQAAAABAAIAB4gAAB4AAAAB0QgUAAQIEAAEB1wQAAABW5+///xRgwBAAIAAACAR/f///////4h7/8///Q2P//+T7f///+i//T//4iK5b4AAAAAAAAIAA//OEAAyBwAIAAAQAAAABAAIAB4gAAB4AAAAB0QgUAAQIEAAEB1wQAAABW5+///xRgwBAAIAAACAR/f///////4h7/8///Q2P//+T7f///+i//T//4iK5b4AAAAAAAAIAA//OEAFAAQAIAAAQAAAABAAIAB4gAAB4AAAAB0QgUAAQIEAAEB1wQAAABW5+///xRgwBAAIAAACAR/f///////4h7/8///Q2P//+T7f///+i//T//4iK5b4AAAAAAAAIAA==");
      silentAudioRef.current = audio;
    }
    silentAudioRef.current.play().catch(() => {});
    speech.start();
  }, [speech]);

  const handleStopAndEvaluate = useCallback(() => {
    speech.stop();
  }, [speech]);

  const finalizeResults = useCallback((states: AyahState[], fullTranscript: string) => {
    const perAyah: PerAyahScoreResult[] = states.map(s => ({
      numberInSurah: s.numberInSurah,
      score: s.score,
      isCorrect: s.status === "correct",
      wordDiffs: s.wordDiffs,
    }));
    const correctAyahs = states.filter(s => s.status === "correct").length;
    const overallScore = perAyah.length > 0
      ? Math.round(perAyah.reduce((sum, a) => sum + a.score, 0) / perAyah.length)
      : 0;

    const scoreResult: ScoreResult = {
      overallScore,
      correctAyahs,
      totalAyahs: states.length,
      perAyah,
      transcript: fullTranscript,
    };

    setResult(scoreResult);
    setPhase("result");

    recitationHistory.saveResult({
      surahNumber,
      ayahFrom,
      ayahTo,
      score: overallScore,
      totalAyahs: states.length,
      correctAyahs,
      transcript: fullTranscript,
      strictness,
      perAyah,
    });
  }, [surahNumber, ayahFrom, ayahTo, strictness, recitationHistory]);

  const advanceToNextAyah = useCallback((
    states: AyahState[],
    nextIndex: number,
    fullTranscript: string
  ) => {
    if (nextIndex >= states.length) {
      finalizeResults(states, fullTranscript);
      speech.stop();
    } else {
      setCurrentAyahIndex(nextIndex);
      lockedAyahCountRef.current = nextIndex;
    }
  }, [finalizeResults, speech]);

  const handleSkipCurrentAyah = useCallback(() => {
    setAyahStates(prev => {
      const updated = [...prev];
      const current = updated[currentAyahIndex];
      if (!current) return prev;
      updated[currentAyahIndex] = {
        ...current,
        status: "skipped",
        score: 0,
      };
      return updated;
    });
    setRetryMessage(null);

    const nextIndex = currentAyahIndex + 1;
    setAyahStates(prev => {
      advanceToNextAyah(prev, nextIndex, speech.transcript);
      return prev;
    });
  }, [currentAyahIndex, advanceToNextAyah, speech.transcript]);

  useEffect(() => {
    if (phase !== "recording") return;
    if (!speech.transcript && !speech.interimTranscript) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const fullTranscript = speech.transcript + (speech.interimTranscript ? " " + speech.interimTranscript : "");
      if (!fullTranscript.trim()) return;

      const allSpokenWords = tokenize(fullTranscript);

      setAyahStates(prev => {
        if (currentAyahIndex >= prev.length) return prev;

        const currentAyah = ayahsData[currentAyahIndex];
        if (!currentAyah) return prev;

        const ayahWords = tokenize(currentAyah.text);
        const ayahWordCount = ayahWords.length;
        const pointer = spokenWordPointerRef.current;
        const wordsAvailable = allSpokenWords.length - pointer;

        if (wordsAvailable < 1) return prev;

        const threshold = STRICTNESS_THRESHOLD[strictness];
        const windowSize = ayahWordCount + Math.ceil(ayahWordCount * 0.5);
        const slice = allSpokenWords.slice(pointer, pointer + windowSize).join(" ");

        const { overallScore: _unused, perAyah: livePerAyah } = scoreRangeRecitation(
          [currentAyah],
          slice,
          strictness
        );

        const liveResult = livePerAyah[0];
        if (!liveResult) return prev;

        const updated = [...prev];
        const currentState = updated[currentAyahIndex];

        if (liveResult.score >= threshold) {
          updated[currentAyahIndex] = {
            ...currentState,
            status: "correct",
            score: liveResult.score,
            wordDiffs: liveResult.wordDiffs,
          };

          spokenWordPointerRef.current = pointer + Math.min(wordsAvailable, ayahWordCount);
          setRetryMessage(null);

          const nextIndex = currentAyahIndex + 1;
          setTimeout(() => {
            advanceToNextAyah(updated, nextIndex, speech.transcript);
          }, 600);

          return updated;
        }

        if (wordsAvailable >= Math.ceil(ayahWordCount * 1.5)) {
          const attempt = currentState.attempt + 1;

          if (attempt < MAX_ATTEMPTS) {
            updated[currentAyahIndex] = {
              ...currentState,
              attempt,
              score: liveResult.score,
              wordDiffs: liveResult.wordDiffs,
            };

            setRetryMessage(
              language === "ar"
                ? `لم يتم التعرف على هذه الآية. حاول مرة أخرى (المحاولة ${attempt + 1}/${MAX_ATTEMPTS})`
                : `Verse not recognized. Try again (attempt ${attempt + 1}/${MAX_ATTEMPTS})`
            );

            spokenWordPointerRef.current = pointer + Math.min(wordsAvailable, ayahWordCount);
            return updated;
          } else {
            updated[currentAyahIndex] = {
              ...currentState,
              status: "incorrect",
              score: liveResult.score,
              wordDiffs: liveResult.wordDiffs,
              attempt,
            };

            setRetryMessage(null);
            spokenWordPointerRef.current = pointer + Math.min(wordsAvailable, ayahWordCount);

            const nextIndex = currentAyahIndex + 1;
            setTimeout(() => {
              advanceToNextAyah(updated, nextIndex, speech.transcript);
            }, 800);

            return updated;
          }
        }

        updated[currentAyahIndex] = {
          ...currentState,
          score: liveResult.score,
          wordDiffs: liveResult.wordDiffs,
        };
        return updated;
      });
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [speech.transcript, speech.interimTranscript, phase, currentAyahIndex, ayahsData, strictness, language, advanceToNextAyah]);

  useEffect(() => {
    if (phase !== "recording") return;
    if (speech.status !== "done") return;

    const fullTranscript = speech.transcript.trim();
    if (!fullTranscript && ayahStates.every(s => s.status === "pending")) return;

    const finalized = ayahStates.map(s => {
      if (s.status !== "pending") return s;
      return { ...s, status: "incorrect" as const };
    });
    finalizeResults(finalized, fullTranscript);
  }, [speech.status]);

  useEffect(() => {
    if (currentAyahIndex < 0 || !ayahRefs.current[currentAyahIndex]) return;
    const el = ayahRefs.current[currentAyahIndex];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [currentAyahIndex]);

  const handleTryAgain = () => {
    speech.reset();
    setResult(null);
    setAyahStates([]);
    setCurrentAyahIndex(0);
    setRetryMessage(null);
    spokenWordPointerRef.current = 0;
    lockedAyahCountRef.current = 0;
    setPhase("setup");
  };

  useEffect(() => {
    if (showHistory) {
      recitationHistory.fetchHistory(surahNumber);
    }
  }, [showHistory, surahNumber]);

  useEffect(() => {
    if (showProgress) {
      recitationHistory.fetchHistory(surahNumber);
    }
  }, [showProgress, surahNumber]);

  const rangeLabel = language === "ar"
    ? `${meta.name} · ${toArabicNumerals(ayahFrom)}–${toArabicNumerals(ayahTo)}`
    : `${meta.englishName} · ${ayahFrom}–${ayahTo}`;

  const progressData = recitationHistory.history
    .filter((r) => r.surah_number === surahNumber)
    .slice(0, 10)
    .reverse();

  const maxScore = progressData.length > 0 ? Math.max(...progressData.map((r) => r.score)) : 100;

  const correctCount = ayahStates.filter(s => s.status === "correct").length;
  const incorrectCount = ayahStates.filter(s => s.status === "incorrect" || s.status === "skipped").length;

  return (
    <div className="px-4 pt-6 pb-24" dir={isRTL ? "rtl" : "ltr"}>
      <div className="mb-5 flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            speech.reset();
            navigate(-1);
          }}
          className="rounded-xl p-2.5 bg-card border border-border/40 shadow-soft hover:bg-muted transition-colors"
        >
          {isRTL ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
        </motion.button>
        <div>
          <h1 className="text-2xl font-bold heading-decorated">{t("recitation_test")}</h1>
          <p className="text-sm text-muted-foreground">{t("recitation_subtitle")}</p>
        </div>
      </div>

      {language === "en" && <EnglishComingSoonBanner />}
      {speech.isIOSMode && <IOSUnsupportedBanner language={language} />}
      {!speech.isSupported && !speech.isIOSMode && (
        <div className="mb-4">
          <UnsupportedBanner
            message={t("speech_not_supported")}
            desc={t("speech_not_supported_desc")}
          />
        </div>
      )}

      <div className={cn("relative", language === "en" && "pointer-events-none select-none")}>
        {language === "en" && (
          <div className="absolute inset-0 z-10 rounded-2xl bg-background/40 backdrop-blur-[1px]" />
        )}

        <AnimatePresence mode="wait">
          {phase === "setup" && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <SurahRangeSelector
                surahNumber={surahNumber}
                ayahFrom={ayahFrom}
                ayahTo={ayahTo}
                onSurahChange={setSurahNumber}
                onRangeChange={handleRangeChange}
              />

              <div className="rounded-2xl bg-card border border-border/50 shadow-soft p-4">
                <p className="text-sm font-semibold mb-3">{t("strictness")}</p>
                <div className="flex gap-2">
                  {STRICTNESS_OPTIONS.map((level) => (
                    <motion.button
                      key={level}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setStrictness(level)}
                      className={cn(
                        "flex-1 rounded-xl py-2.5 text-xs font-bold transition-all",
                        strictness === level
                          ? level === "lenient"
                            ? "bg-primary text-primary-foreground shadow-soft"
                            : level === "normal"
                            ? "bg-accent text-accent-foreground shadow-soft"
                            : "bg-destructive text-destructive-foreground shadow-soft"
                          : "bg-muted text-muted-foreground hover:bg-muted/70"
                      )}
                    >
                      {t(`strictness_${level}` as Parameters<typeof t>[0])}
                    </motion.button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2.5">
                  {strictness === "lenient"
                    ? language === "ar" ? "يقبل أخطاء بسيطة في النطق" : "Accepts minor pronunciation errors"
                    : strictness === "normal"
                    ? language === "ar" ? "دقة متوازنة للتقييم" : "Balanced accuracy for evaluation"
                    : language === "ar" ? "يتطلب دقة عالية في التلاوة" : "Requires high recitation accuracy"}
                </p>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleStartTest}
                disabled={!speech.isSupported || loadingAyahs}
                className={cn(
                  "w-full rounded-2xl py-4 text-sm font-bold transition-all min-h-[52px]",
                  speech.isSupported
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-elevated"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                {loadingAyahs ? t("loading") : t("start_test")}
              </motion.button>

              <div className="rounded-2xl bg-card border border-border/50 shadow-soft overflow-hidden">
                <button
                  onClick={() => setShowProgress((p) => !p)}
                  className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">{t("my_progress")}</span>
                  </div>
                  {showProgress ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>

                {showProgress && (
                  <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} className="overflow-hidden">
                    <div className="border-t border-border/40 p-4">
                      {recitationHistory.loading ? (
                        <div className="text-center text-sm text-muted-foreground py-4">{t("loading")}</div>
                      ) : progressData.length === 0 ? (
                        <div className="text-center text-sm text-muted-foreground py-4">{t("no_progress_data")}</div>
                      ) : (
                        <div>
                          <p className="text-xs text-muted-foreground mb-3 font-semibold">{t("accuracy_over_time")} · {language === "ar" ? meta.name : meta.englishName}</p>
                          <div className="flex items-end gap-1.5 h-20">
                            {progressData.map((rec, i) => {
                              const heightPct = maxScore > 0 ? (rec.score / maxScore) * 100 : 0;
                              const barColor =
                                rec.score >= 85 ? "bg-primary" :
                                rec.score >= 60 ? "bg-accent" :
                                "bg-destructive";
                              return (
                                <div key={rec.id} className="flex-1 flex flex-col items-center gap-1">
                                  <span className="text-[0.55rem] font-bold tabular-nums text-muted-foreground">
                                    {language === "ar" ? toArabicNumerals(rec.score) : rec.score}
                                  </span>
                                  <motion.div
                                    className={cn("w-full rounded-t-md", barColor)}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${heightPct}%` }}
                                    transition={{ duration: 0.4, delay: i * 0.05 }}
                                    style={{ minHeight: 4 }}
                                  />
                                </div>
                              );
                            })}
                          </div>
                          <div className="flex justify-between mt-1 text-[0.6rem] text-muted-foreground/60">
                            <span>{language === "ar" ? "الأقدم" : "Oldest"}</span>
                            <span>{language === "ar" ? "الأحدث" : "Latest"}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="rounded-2xl bg-card border border-border/50 shadow-soft overflow-hidden">
                <button
                  onClick={() => setShowHistory((p) => !p)}
                  className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">{t("recitation_history")}</span>
                  </div>
                  {showHistory ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>

                {showHistory && (
                  <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} className="overflow-hidden">
                    <div className="border-t border-border/40">
                      {recitationHistory.loading ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">{t("loading")}</div>
                      ) : recitationHistory.history.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          {language === "ar" ? "لا يوجد سجل بعد" : "No history yet"}
                        </div>
                      ) : (
                        <div className="divide-y divide-border/40 max-h-72 overflow-y-auto">
                          {recitationHistory.history.map((rec) => {
                            const recMeta = SURAH_META[rec.surah_number - 1];
                            const date = new Date(rec.tested_at).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", { month: "short", day: "numeric" });
                            return (
                              <div key={rec.id} className="flex items-center gap-3 px-4 py-3">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold truncate">
                                    {language === "ar" ? recMeta?.name : recMeta?.englishName}
                                    <span className="text-muted-foreground font-normal text-xs ms-2">
                                      {language === "ar"
                                        ? `${toArabicNumerals(rec.ayah_from)}–${toArabicNumerals(rec.ayah_to)}`
                                        : `${rec.ayah_from}–${rec.ayah_to}`}
                                    </span>
                                  </p>
                                  <p className="text-xs text-muted-foreground">{date}</p>
                                </div>
                                <span
                                  className={cn(
                                    "text-sm font-bold tabular-nums",
                                    rec.score >= 85 ? "text-primary" : rec.score >= 60 ? "text-accent" : "text-destructive"
                                  )}
                                >
                                  {language === "ar" ? toArabicNumerals(rec.score) : rec.score}%
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {phase === "recording" && (
            <motion.div
              key="recording"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              <div className="rounded-2xl bg-card border border-border/50 shadow-soft p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">{t("recitation_test")}</p>
                <p className="font-arabic font-bold text-lg">{rangeLabel}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {language === "ar"
                    ? `${toArabicNumerals(ayahTo - ayahFrom + 1)} ${t("ayahs")}`
                    : `${ayahTo - ayahFrom + 1} ${t("verses")}`}
                </p>
              </div>

              {speech.status === "listening" && ayahStates.some(s => s.status !== "pending") && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl bg-card border border-border/50 shadow-soft p-4"
                >
                  <div className="flex items-center justify-center gap-8">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-medium text-muted-foreground">
                        {language === "ar" ? "صحيح" : "Correct"}
                      </span>
                      <span className="text-lg font-bold tabular-nums text-emerald-600">
                        {language === "ar" ? toArabicNumerals(correctCount) : correctCount}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <X className="h-4 w-4 text-destructive" />
                      <span className="text-sm font-medium text-muted-foreground">
                        {language === "ar" ? "خطأ" : "Wrong"}
                      </span>
                      <span className="text-lg font-bold tabular-nums text-destructive">
                        {language === "ar" ? toArabicNumerals(incorrectCount) : incorrectCount}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              <AnimatePresence>
                {retryMessage && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    className="rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-3 flex items-center gap-3"
                  >
                    <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex-1">
                      {retryMessage}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {ayahsData.length > 0 && (
                <div
                  ref={containerRef}
                  className="rounded-2xl bg-card border border-border/50 shadow-soft p-4 max-h-96 overflow-y-auto"
                >
                  <div className="space-y-3" dir="rtl">
                    {ayahsData.map((a, index) => {
                      const state = ayahStates[index];
                      const isCurrent = index === currentAyahIndex && speech.status === "listening";
                      const isDone = state?.status === "correct" || state?.status === "incorrect" || state?.status === "skipped";
                      const isCorrect = state?.status === "correct";
                      const isSkipped = state?.status === "skipped";
                      const isPast = index < currentAyahIndex && !isDone;

                      return (
                        <motion.div
                          key={a.numberInSurah}
                          ref={el => { ayahRefs.current[index] = el; }}
                          initial={false}
                          animate={{
                            filter: isDone ? "blur(0px)" : isCurrent ? "blur(0px)" : "blur(5px)",
                            opacity: isDone ? 1 : isCurrent ? 1 : isPast ? 0.5 : 0.2,
                            scale: isDone ? 1 : isCurrent ? 1 : 0.98,
                          }}
                          transition={{ duration: 0.4, ease: "easeOut" }}
                          className={cn(
                            "rounded-xl p-3 transition-colors select-none",
                            isDone && isCorrect && "bg-emerald-500/15 border-2 border-emerald-500/70",
                            isDone && !isCorrect && !isSkipped && "bg-destructive/15 border-2 border-destructive/70",
                            isDone && isSkipped && "bg-muted/30 border-2 border-border/50",
                            isCurrent && !isDone && "bg-primary/10 border-2 border-primary/40",
                            !isDone && !isCurrent && "bg-muted/20 border border-border/20"
                          )}
                        >
                          <p
                            className={cn(
                              "font-arabic text-base leading-loose text-center",
                              !isDone && !isCurrent && "pointer-events-none"
                            )}
                          >
                            {a.text}
                            <span className="text-muted-foreground text-sm ms-2">﴿{a.numberInSurah}﴾</span>
                          </p>

                          {isDone && (
                            <motion.div
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.2 }}
                              className="flex items-center justify-center gap-2 mt-2"
                            >
                              {isCorrect ? (
                                <Check className="h-3 w-3 text-emerald-600" />
                              ) : isSkipped ? (
                                <SkipForward className="h-3 w-3 text-muted-foreground" />
                              ) : (
                                <X className="h-3 w-3 text-destructive" />
                              )}
                              <span className={cn(
                                "text-xs font-medium",
                                isCorrect ? "text-emerald-600" : isSkipped ? "text-muted-foreground" : "text-destructive"
                              )}>
                                {isSkipped
                                  ? (language === "ar" ? "تم التخطي" : "Skipped")
                                  : `${language === "ar" ? toArabicNumerals(state.score) : state.score}%`}
                              </span>
                            </motion.div>
                          )}

                          {isCurrent && !isDone && (
                            <div className="mt-2 space-y-2">
                              <motion.div
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1.8, repeat: Infinity }}
                                className="flex items-center justify-center"
                              >
                                <span className="text-xs text-primary/70 font-medium">
                                  {language === "ar" ? "اتلُ هذه الآية..." : "Recite this verse..."}
                                </span>
                              </motion.div>
                              {state && state.attempt > 0 && (
                                <p className="text-[0.65rem] text-amber-600 dark:text-amber-400 text-center font-semibold">
                                  {language === "ar"
                                    ? `المحاولة ${toArabicNumerals(state.attempt + 1)}/${toArabicNumerals(MAX_ATTEMPTS)}`
                                    : `Attempt ${state.attempt + 1}/${MAX_ATTEMPTS}`}
                                </p>
                              )}
                              <div className="flex justify-center">
                                <motion.button
                                  whileTap={{ scale: 0.95 }}
                                  onClick={handleSkipCurrentAyah}
                                  className="flex items-center gap-1.5 rounded-lg bg-muted/70 hover:bg-muted px-3 py-1.5 text-xs text-muted-foreground font-medium transition-colors"
                                >
                                  <SkipForward className="h-3 w-3" />
                                  {language === "ar" ? "تخطي" : "Skip"}
                                </motion.button>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                  {speech.status === "idle" && ayahStates.every(s => s.status === "pending") && (
                    <p className="text-xs text-muted-foreground text-center mt-3">
                      {language === "ar" ? "اضغط الميكروفون وابدأ التلاوة من الذاكرة" : "Tap the mic and recite from memory"}
                    </p>
                  )}
                </div>
              )}

              <div className="flex flex-col items-center">
                <MicButton
                  status={speech.status}
                  onStart={handleMicStart}
                  onStop={handleStopAndEvaluate}
                  transcript={speech.transcript}
                  interimTranscript={speech.interimTranscript}
                />
              </div>

              {speech.status === "idle" && ayahStates.every(s => s.status === "pending") && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl bg-muted/40 border border-border/30 px-4 py-3 text-center"
                >
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {language === "ar"
                      ? "اضغط على الميكروفون واقرأ الآيات بصوت واضح ومتوسط"
                      : "Tap the mic and recite clearly at a steady pace"}
                  </p>
                </motion.div>
              )}

              {speech.error && speech.status === "error" && (
                <div className="rounded-xl bg-destructive/5 border border-destructive/20 px-4 py-3 text-center">
                  <p className="text-xs text-destructive font-semibold">
                    {speech.error === "mic_permission_denied"
                      ? (language === "ar" ? "لم يتم منح إذن الميكروفون. يرجى السماح بالوصول من إعدادات المتصفح." : "Microphone permission denied. Please allow access in browser settings.")
                      : speech.error === "mic_not_found"
                      ? (language === "ar" ? "لم يتم العثور على ميكروفون. تحقق من اتصال الجهاز." : "No microphone found. Check your device connection.")
                      : speech.error === "speech_network_error"
                      ? (language === "ar" ? "خطأ في الشبكة. تحقق من اتصالك بالإنترنت." : "Network error. Check your internet connection.")
                      : speech.error === "speech_service_unavailable"
                      ? (language === "ar" ? "خدمة التعرف على الصوت غير متاحة حالياً." : "Speech recognition service is currently unavailable.")
                      : speech.error === "speech_language_unsupported"
                      ? (language === "ar" ? "اللغة العربية غير مدعومة في هذا المتصفح." : "Arabic is not supported by this browser's speech recognition.")
                      : speech.error === "no_speech_detected"
                      ? t("no_speech_detected")
                      : (language === "ar" ? "حدث خطأ في التعرف على الصوت. حاول مرة أخرى." : "Speech recognition error. Please try again.")}
                  </p>
                </div>
              )}

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleTryAgain}
                className="w-full rounded-2xl bg-muted py-3.5 text-sm font-semibold hover:bg-muted/70 transition-colors"
              >
                {t("cancel")}
              </motion.button>
            </motion.div>
          )}

          {phase === "result" && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <RecitationScoreCard
                score={result.overallScore}
                correctAyahs={result.correctAyahs}
                totalAyahs={result.totalAyahs}
                perAyah={result.perAyah}
                ayahsData={ayahsData}
                surahName={language === "ar" ? meta.name : meta.englishName}
                ayahFrom={ayahFrom}
                ayahTo={ayahTo}
                strictness={strictness}
                onTryAgain={handleTryAgain}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
