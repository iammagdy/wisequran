import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, TriangleAlert as AlertTriangle,
  History, ChevronDown, ChevronUp, TrendingUp,
  Check, X, SkipForward, Mic, Square,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { SURAH_META } from "@/data/surah-meta";
import { fetchSurahAyahs, type Ayah } from "@/lib/quran-api";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useRecitationHistory } from "@/hooks/useRecitationHistory";
import { scoreCurrentAyah, tokenize, type StrictnessLevel, type PerAyahScoreResult } from "@/lib/ayah-match";
import { cn, toArabicNumerals } from "@/lib/utils";
import SurahRangeSelector from "@/components/recitation/SurahRangeSelector";
import RecitationScoreCard from "@/components/recitation/RecitationScoreCard";

type PagePhase = "setup" | "recording" | "result";
type AyahVerdict = "pending" | "correct" | "incorrect" | "skipped";

interface AyahState {
  numberInSurah: number;
  status: AyahVerdict;
  score: number;
  wordDiffs: ReturnType<typeof scoreCurrentAyah>["wordDiffs"];
}

interface ScoreResult {
  overallScore: number;
  correctAyahs: number;
  totalAyahs: number;
  perAyah: PerAyahScoreResult[];
}

const STRICTNESS_OPTIONS: StrictnessLevel[] = ["lenient", "normal", "strict"];

const PASS_THRESHOLD: Record<StrictnessLevel, number> = {
  lenient: 55,
  normal: 70,
  strict: 85,
};

// minimum fraction of ayah words spoken before we attempt evaluation
const MIN_WORD_COVERAGE = 0.6;

// silence after which we force evaluation even if score is low
const SILENCE_TIMEOUT_MS = 2200;

function IOSBanner({ language }: { language: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-amber-500/30 bg-amber-500/8 p-4 flex gap-3 mb-4"
    >
      <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-amber-700 dark:text-amber-400">
        {language === "ar"
          ? "التعرف على الصوت غير متاح على iOS Safari — استخدم Chrome على Android."
          : "Speech Recognition is not available on iOS Safari — please use Chrome on Android."}
      </p>
    </motion.div>
  );
}

function UnsupportedBanner({ message, desc }: { message: string; desc: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 flex gap-3 mb-4"
    >
      <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-destructive">{message}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      </div>
    </motion.div>
  );
}

// ── Word diff row shown after reveal ─────────────────────────────────
function WordDiffRow({ wordDiffs }: { wordDiffs: AyahState["wordDiffs"] }) {
  if (!wordDiffs || wordDiffs.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 justify-center mt-2 px-1" dir="rtl">
      {wordDiffs.map((wd, i) => (
        <span
          key={i}
          className={cn(
            "font-arabic text-sm px-1.5 rounded-md",
            wd.matchScore >= 70
              ? "text-emerald-500 dark:text-emerald-400"
              : "text-destructive line-through"
          )}
        >
          {wd.expected}
        </span>
      ))}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────
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
  const [ayahStates, setAyahStates] = useState<AyahState[]>([]);
  const [currentAyahIndex, setCurrentAyahIndex] = useState(0);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  // Refs
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTranscriptRef = useRef("");
  const silentAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentAyahRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const verseListRef = useRef<HTMLDivElement | null>(null);

  // Stable refs to avoid stale closures in effects
  const ayahsDataRef = useRef<Ayah[]>([]);
  const strictnessRef = useRef<StrictnessLevel>("normal");
  const currentAyahIndexRef = useRef(0);
  const ayahStatesRef = useRef<AyahState[]>([]);

  ayahsDataRef.current = ayahsData;
  strictnessRef.current = strictness;
  currentAyahIndexRef.current = currentAyahIndex;
  ayahStatesRef.current = ayahStates;

  const speech = useSpeechRecognition();
  const recitationHistory = useRecitationHistory();
  const meta = SURAH_META[surahNumber - 1];

  useEffect(() => {
    setAyahFrom(1);
    setAyahTo(Math.min(10, meta.numberOfAyahs));
  }, [surahNumber, meta.numberOfAyahs]);

  const handleRangeChange = useCallback((from: number, to: number) => {
    setAyahFrom(from);
    setAyahTo(to);
  }, []);

  // ── Load ayahs ─────────────────────────────────────────────────────
  const loadAyahs = useCallback(async (): Promise<Ayah[]> => {
    setLoadingAyahs(true);
    try {
      const all = await fetchSurahAyahs(surahNumber);
      const range = all.filter(a => a.numberInSurah >= ayahFrom && a.numberInSurah <= ayahTo);
      setAyahsData(range);
      return range;
    } catch {
      setAyahsData([]);
      return [];
    } finally {
      setLoadingAyahs(false);
    }
  }, [surahNumber, ayahFrom, ayahTo]);

  // ── Finalize ───────────────────────────────────────────────────────
  const finalizeResults = useCallback((states: AyahState[]) => {
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

    setResult({ overallScore, correctAyahs, totalAyahs: states.length, perAyah });
    setPhase("result");
    speech.reset();

    recitationHistory.saveResult({
      surahNumber, ayahFrom, ayahTo,
      score: overallScore, totalAyahs: states.length, correctAyahs,
      transcript: "", strictness, perAyah,
    });
  }, [surahNumber, ayahFrom, ayahTo, strictness, recitationHistory, speech]);

  // ── Advance to next ayah (or finalize) ────────────────────────────
  const advanceToNext = useCallback((states: AyahState[], nextIdx: number) => {
    if (nextIdx >= states.length) {
      finalizeResults(states);
      return;
    }
    setCurrentAyahIndex(nextIdx);
    currentAyahIndexRef.current = nextIdx;
    lastTranscriptRef.current = "";
    // Scroll the new current card into view
    setTimeout(() => {
      const el = currentAyahRefs.current[nextIdx];
      if (el && verseListRef.current) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  }, [finalizeResults]);

  // ── Core evaluation (called on silence or word-count trigger) ──────
  const runEvaluation = useCallback((transcript: string, forceAdvance: boolean) => {
    const idx = currentAyahIndexRef.current;
    const currentAyah = ayahsDataRef.current[idx];
    const states = ayahStatesRef.current;
    if (!currentAyah || states[idx]?.status !== "pending") return;

    const spokenWords = tokenize(transcript);
    const ayahWordCount = tokenize(currentAyah.text).length;
    const coverage = spokenWords.length / Math.max(ayahWordCount, 1);

    // Don't evaluate yet if we haven't heard enough words
    if (!forceAdvance && coverage < MIN_WORD_COVERAGE) return;

    const { score, isCorrect, wordDiffs } = scoreCurrentAyah(
      currentAyah.text, spokenWords, 0, strictnessRef.current
    );
    const pass = score >= PASS_THRESHOLD[strictnessRef.current] || isCorrect;

    if (pass || forceAdvance) {
      setIsEvaluating(true);
      const updated = [...states];
      updated[idx] = {
        ...updated[idx],
        status: pass ? "correct" : "incorrect",
        score,
        wordDiffs,
      };
      setAyahStates(updated);
      ayahStatesRef.current = updated;

      setTimeout(() => {
        setIsEvaluating(false);
        advanceToNext(updated, idx + 1);
        // Reset after advance
        lastTranscriptRef.current = "";
        speech.reset();
        // If there are more verses, restart mic after short pause
        if (idx + 1 < updated.length) {
          setTimeout(() => {
            if (!silentAudioRef.current) {
              silentAudioRef.current = new Audio("data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjYwLjE2LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDA=");
            }
            silentAudioRef.current.play().catch(() => {});
            speech.start();
          }, 400);
        }
      }, 800);
    }
    // If score is low but not forcing: do nothing, keep listening
  }, [advanceToNext, speech]);

  // ── Watch transcript for real-time pass detection + silence timer ──
  useEffect(() => {
    if (phase !== "recording") return;
    if (isEvaluating) return;

    const full = (speech.transcript + " " + (speech.interimTranscript || "")).trim();
    if (!full || full === lastTranscriptRef.current) return;
    lastTranscriptRef.current = full;

    // Try immediate pass evaluation
    runEvaluation(full, false);

    // Reset silence timer
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => {
      const finalT = (speech.transcript + " " + (speech.interimTranscript || "")).trim();
      if (!finalT) return;
      // Force advance on silence
      runEvaluation(finalT, true);
    }, SILENCE_TIMEOUT_MS);

    return () => { if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speech.transcript, speech.interimTranscript, phase, isEvaluating]);

  // ── When speech ends naturally ─────────────────────────────────────
  useEffect(() => {
    if (phase !== "recording") return;
    if (speech.status !== "done") return;
    if (isEvaluating) return;
    const transcript = speech.transcript.trim();
    if (transcript) runEvaluation(transcript, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speech.status]);

  // ── Start test ─────────────────────────────────────────────────────
  const handleStartTest = useCallback(async () => {
    const range = await loadAyahs();
    if (range.length === 0) return;
    speech.reset();
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    lastTranscriptRef.current = "";
    const states: AyahState[] = range.map(a => ({
      numberInSurah: a.numberInSurah,
      status: "pending",
      score: 0,
      wordDiffs: [],
    }));
    setAyahStates(states);
    ayahStatesRef.current = states;
    setCurrentAyahIndex(0);
    currentAyahIndexRef.current = 0;
    setIsEvaluating(false);
    setResult(null);
    setPhase("recording");
  }, [loadAyahs, speech]);

  // ── Mic start (called once at the top of recording) ───────────────
  const handleMicStart = useCallback(() => {
    if (!silentAudioRef.current) {
      silentAudioRef.current = new Audio("data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjYwLjE2LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDA=");
    }
    silentAudioRef.current.play().catch(() => {});
    lastTranscriptRef.current = "";
    speech.start();
  }, [speech]);

  // ── Manually stop (cancel) ─────────────────────────────────────────
  const handleMicStop = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    speech.stop();
  }, [speech]);

  // ── Auto-start mic when phase transitions to recording ────────────
  useEffect(() => {
    if (phase === "recording" && !isEvaluating) {
      // Small delay so the UI renders first
      const t = setTimeout(handleMicStart, 500);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Skip ───────────────────────────────────────────────────────────
  const handleSkipAyah = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    speech.reset();
    lastTranscriptRef.current = "";

    const idx = currentAyahIndexRef.current;
    const states = ayahStatesRef.current;
    const updated = [...states];
    updated[idx] = { ...updated[idx], status: "skipped", score: 0, wordDiffs: [] };
    setAyahStates(updated);
    ayahStatesRef.current = updated;

    setTimeout(() => {
      advanceToNext(updated, idx + 1);
      if (idx + 1 < updated.length) {
        setTimeout(() => {
          lastTranscriptRef.current = "";
          if (!silentAudioRef.current) {
            silentAudioRef.current = new Audio("data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjYwLjE2LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDA=");
          }
          silentAudioRef.current.play().catch(() => {});
          speech.start();
        }, 350);
      }
    }, 200);
  }, [advanceToNext, speech]);

  // ── Reset ──────────────────────────────────────────────────────────
  const handleTryAgain = useCallback(() => {
    speech.reset();
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    setResult(null);
    setAyahStates([]);
    ayahStatesRef.current = [];
    setCurrentAyahIndex(0);
    currentAyahIndexRef.current = 0;
    setIsEvaluating(false);
    lastTranscriptRef.current = "";
    setPhase("setup");
  }, [speech]);

  useEffect(() => {
    if (showHistory || showProgress) recitationHistory.fetchHistory(surahNumber);
  }, [showHistory, showProgress, surahNumber, recitationHistory]);

  const progressData = recitationHistory.history
    .filter(r => r.surah_number === surahNumber).slice(0, 10).reverse();
  const maxScore = progressData.length > 0 ? Math.max(...progressData.map(r => r.score)) : 100;

  const doneCount = ayahStates.filter(s => s.status !== "pending").length;
  const totalCount = ayahStates.length;
  const isListening = speech.status === "listening";

  // ── Scroll current ayah into view on index change ─────────────────
  useEffect(() => {
    const el = currentAyahRefs.current[currentAyahIndex];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentAyahIndex]);

  return (
    /**
     * LAYOUT: full viewport height, flex column, no outer scroll.
     * - Header: fixed at top
     * - Content area: flex-1 overflow-y-auto (verse list scrolls here)
     * - Mic bar: fixed above bottom nav (bottom-[--nav-height])
     */
    <div className="h-[100dvh] flex flex-col overflow-hidden pb-[calc(var(--nav-height)+env(safe-area-inset-bottom,0px))]" dir={isRTL ? "rtl" : "ltr"}>

      {/* ── Header (always visible, never scrolls away) ─────────────── */}
      <div className="flex-shrink-0 px-4 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => { speech.reset(); navigate(-1); }}
            className="rounded-xl p-2.5 bg-card border border-border/40 shadow-soft hover:bg-muted transition-colors flex-shrink-0"
          >
            {isRTL ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
          </motion.button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold heading-decorated">{t("recitation_test")}</h1>
            <p className="text-xs text-muted-foreground">{t("recitation_subtitle")}</p>
          </div>
        </div>
      </div>

      {/* ── Scrollable body ─────────────────────────────────────────── */}
      {/* Bottom padding = mic bar (~5rem) + nav bar (--nav-height via pb-nav) */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4">

        {speech.isIOSMode && <IOSBanner language={language} />}
        {!speech.isSupported && !speech.isIOSMode && (
          <UnsupportedBanner message={t("speech_not_supported")} desc={t("speech_not_supported_desc")} />
        )}

        <AnimatePresence mode="wait">

          {/* ──── SETUP ─────────────────────────────────────────────── */}
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
                  {STRICTNESS_OPTIONS.map(level => (
                    <motion.button
                      key={level} whileTap={{ scale: 0.95 }}
                      onClick={() => setStrictness(level)}
                      className={cn(
                        "flex-1 rounded-xl py-2.5 text-xs font-bold transition-all",
                        strictness === level
                          ? level === "lenient" ? "bg-primary text-primary-foreground shadow-soft"
                          : level === "normal" ? "bg-accent text-accent-foreground shadow-soft"
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
                    ? language === "ar" ? "دقة متوازنة للتقييم" : "Balanced accuracy"
                    : language === "ar" ? "يتطلب دقة عالية" : "Requires high accuracy"}
                </p>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleStartTest}
                disabled={!speech.isSupported || loadingAyahs || speech.isIOSMode}
                className={cn(
                  "w-full rounded-2xl py-4 text-sm font-bold transition-all min-h-[52px]",
                  speech.isSupported && !speech.isIOSMode
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-elevated"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                {loadingAyahs ? t("loading") : t("start_test")}
              </motion.button>

              {/* Progress */}
              <div className="rounded-2xl bg-card border border-border/50 shadow-soft overflow-hidden">
                <button
                  onClick={() => setShowProgress(p => !p)}
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
                          <p className="text-xs text-muted-foreground mb-3 font-semibold">
                            {t("accuracy_over_time")} · {language === "ar" ? meta.name : meta.englishName}
                          </p>
                          <div className="flex items-end gap-1.5 h-20">
                            {progressData.map((rec, i) => {
                              const h = maxScore > 0 ? (rec.score / maxScore) * 100 : 0;
                              const col = rec.score >= 85 ? "bg-primary" : rec.score >= 60 ? "bg-accent" : "bg-destructive";
                              return (
                                <div key={rec.id} className="flex-1 flex flex-col items-center gap-1">
                                  <span className="text-[0.55rem] font-bold tabular-nums text-muted-foreground">
                                    {language === "ar" ? toArabicNumerals(rec.score) : rec.score}
                                  </span>
                                  <motion.div
                                    className={cn("w-full rounded-t-md", col)}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${h}%` }}
                                    transition={{ duration: 0.4, delay: i * 0.05 }}
                                    style={{ minHeight: 4 }}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="rounded-2xl bg-card border border-border/50 shadow-soft overflow-hidden">
                <button
                  onClick={() => setShowHistory(p => !p)}
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
                        <div className="divide-y divide-border/40 max-h-64 overflow-y-auto">
                          {recitationHistory.history.map(rec => {
                            const recMeta = SURAH_META[rec.surah_number - 1];
                            const date = new Date(rec.tested_at).toLocaleDateString(
                              language === "ar" ? "ar-SA" : "en-US", { month: "short", day: "numeric" }
                            );
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
                                <span className={cn(
                                  "text-sm font-bold tabular-nums",
                                  rec.score >= 85 ? "text-primary" : rec.score >= 60 ? "text-accent" : "text-destructive"
                                )}>
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

          {/* ──── RECORDING ─────────────────────────────────────────── */}
          {phase === "recording" && (
            <motion.div
              key="recording"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {/* Progress header */}
              <div className="rounded-2xl bg-card border border-border/50 shadow-soft p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs text-muted-foreground font-medium">
                    {language === "ar"
                      ? `${toArabicNumerals(doneCount)} / ${toArabicNumerals(totalCount)} آيات`
                      : `${doneCount} / ${totalCount} verses`}
                  </p>
                  <p className="text-xs font-bold text-primary font-arabic">
                    {language === "ar" ? meta.name : meta.englishName}
                  </p>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    animate={{ width: `${totalCount > 0 ? (doneCount / totalCount) * 100 : 0}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              </div>

              {/* Verse cards */}
              <div ref={verseListRef} className="space-y-3" dir="rtl">
                {ayahsData.map((a, index) => {
                  const state = ayahStates[index];
                  const isCurrent = index === currentAyahIndex && state?.status === "pending";
                  const isDone = state?.status === "correct" || state?.status === "incorrect" || state?.status === "skipped";
                  const isFuture = index > currentAyahIndex && !isDone;
                  const isCorrect = state?.status === "correct";
                  const isSkipped = state?.status === "skipped";

                  return (
                    <motion.div
                      key={a.numberInSurah}
                      ref={el => { currentAyahRefs.current[index] = el; }}
                      animate={{
                        opacity: isFuture ? 0.35 : 1,
                        scale: isFuture ? 0.98 : 1,
                      }}
                      transition={{ duration: 0.4 }}
                      className={cn(
                        "rounded-2xl border-2 p-4 relative overflow-hidden transition-colors",
                        isDone && isCorrect && "bg-emerald-500/10 border-emerald-500/40",
                        isDone && !isCorrect && !isSkipped && "bg-destructive/10 border-destructive/40",
                        isDone && isSkipped && "bg-card border-border/30",
                        isCurrent && "bg-card border-primary/50 shadow-elevated",
                        // Future cards: solid card background so they're visible in dark mode
                        isFuture && "bg-card/60 border-muted-foreground/30",
                      )}
                    >
                      {/* Future: blur overlay */}
                      {isFuture && (
                        <div className="absolute inset-0 backdrop-blur-[3px] rounded-2xl z-10" />
                      )}

                      {/* Current: soft blur overlay over text only */}
                      {isCurrent && (
                        <div className="absolute inset-0 rounded-2xl z-10 pointer-events-none" />
                      )}

                      <div className="relative z-20">
                        {/* ── DONE: reveal verse + score + word diff ── */}
                        {isDone && (
                          <motion.div
                            initial={{ opacity: 0, filter: "blur(6px)" }}
                            animate={{ opacity: 1, filter: "blur(0px)" }}
                            transition={{ duration: 0.5 }}
                          >
                            <p className="font-arabic text-xl leading-loose text-foreground text-center">
                              {a.text}
                              <span className="text-muted-foreground text-sm ms-2 font-normal">
                                ﴿{language === "ar" ? toArabicNumerals(a.numberInSurah) : a.numberInSurah}﴾
                              </span>
                            </p>
                            <div className="flex items-center justify-center gap-2 mt-2">
                              {isCorrect
                                ? <Check className="h-4 w-4 text-emerald-500" />
                                : isSkipped
                                ? <SkipForward className="h-4 w-4 text-muted-foreground" />
                                : <X className="h-4 w-4 text-destructive" />}
                              <span className={cn(
                                "text-sm font-bold tabular-nums",
                                isCorrect ? "text-emerald-500" : isSkipped ? "text-muted-foreground" : "text-destructive"
                              )}>
                                {isSkipped
                                  ? (language === "ar" ? "تخطي" : "Skipped")
                                  : `${language === "ar" ? toArabicNumerals(state.score) : state.score}%`}
                              </span>
                            </div>
                            {!isSkipped && <WordDiffRow wordDiffs={state.wordDiffs} />}
                          </motion.div>
                        )}

                        {/* ── CURRENT: blurred text + verse number visible + listening UI ── */}
                        {isCurrent && (
                          <div className="space-y-3 text-center">
                            {/* Verse number — always visible */}
                            <p className="text-xs font-bold text-primary tracking-wide">
                              {language === "ar"
                                ? `الآية ${toArabicNumerals(a.numberInSurah)}`
                                : `Verse ${a.numberInSurah}`}
                            </p>

                            {/* Blurred verse text — user must recite from memory */}
                            <p
                              className="font-arabic text-xl leading-loose text-center select-none"
                              style={{ filter: "blur(7px)", userSelect: "none", opacity: 0.6 }}
                              aria-hidden="true"
                            >
                              {a.text}
                            </p>

                            <p className="text-xs text-muted-foreground font-medium">
                              {language === "ar" ? "اتلُ الآية من الذاكرة" : "Recite this verse from memory"}
                            </p>

                            {/* Listening waveform */}
                            {isListening && !isEvaluating && (
                              <div className="flex items-center justify-center gap-1">
                                {[0, 1, 2, 3, 4].map(i => (
                                  <motion.div
                                    key={i}
                                    className="w-1 rounded-full bg-primary"
                                    animate={{ height: ["6px", "18px", "6px"] }}
                                    transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.12 }}
                                  />
                                ))}
                              </div>
                            )}

                            {/* Live transcript */}
                            {isListening && (speech.transcript || speech.interimTranscript) && (
                              <p className="text-xs text-muted-foreground font-arabic text-center leading-relaxed px-2 line-clamp-2">
                                <span className="text-foreground/80">{speech.transcript}</span>
                                {speech.interimTranscript && (
                                  <span className="text-muted-foreground/60"> {speech.interimTranscript}</span>
                                )}
                              </p>
                            )}

                            {/* Evaluating spinner */}
                            {isEvaluating && (
                              <div className="flex items-center justify-center gap-2 text-primary">
                                <div className="h-3.5 w-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                                <p className="text-xs font-medium">
                                  {language === "ar" ? "جاري التقييم..." : "Evaluating..."}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* ── FUTURE: just show verse number, text fully hidden ── */}
                        {isFuture && (
                          <div className="text-center space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground">
                              {language === "ar"
                                ? `الآية ${toArabicNumerals(a.numberInSurah)}`
                                : `Verse ${a.numberInSurah}`}
                            </p>
                            <p
                              className="font-arabic text-xl leading-loose select-none"
                              style={{ filter: "blur(8px)", opacity: 0.4 }}
                              aria-hidden="true"
                            >
                              {a.text}
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Mic error */}
              {speech.error && speech.status === "error" && (
                <div className="rounded-xl bg-destructive/5 border border-destructive/20 px-4 py-3 text-center">
                  <p className="text-xs text-destructive font-semibold">
                    {speech.error === "mic_permission_denied"
                      ? (language === "ar" ? "لم يتم منح إذن الميكروفون." : "Microphone permission denied.")
                      : (language === "ar" ? "حدث خطأ. حاول مرة أخرى." : "An error occurred. Try again.")}
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* ──── RESULT ────────────────────────────────────────────── */}
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

      {/* ── Fixed mic bar: sits above the nav bar ──────────────────────
          Uses bottom-above-nav (defined in index.css as calc(var(--nav-height) + env(safe-area-inset-bottom)))
          so it never overlaps the BottomNav. */}
      <AnimatePresence>
        {phase === "recording" && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="flex-shrink-0 z-40 bg-card border-t border-border/50 px-4 py-2.5 shadow-[0_-12px_24px_-12px_rgba(0,0,0,0.1)]"
          >
            <div className="flex items-center gap-3 max-w-sm mx-auto">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSkipAyah}
                disabled={isEvaluating}
                className="flex items-center gap-1.5 rounded-2xl border border-border/50 bg-muted/60 px-4 py-2.5 text-xs text-muted-foreground font-semibold hover:bg-muted transition-colors disabled:opacity-40 flex-1 justify-center"
              >
                <SkipForward className="h-3.5 w-3.5" />
                {language === "ar" ? "تخطي" : "Skip"}
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={isListening ? handleMicStop : handleMicStart}
                disabled={isEvaluating}
                className={cn(
                  "relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border-2 shadow-elevated transition-all disabled:opacity-40",
                  isListening
                    ? "bg-destructive/10 border-destructive text-destructive"
                    : "bg-primary/10 border-primary text-primary"
                )}
              >
                {isListening && (
                  <motion.span
                    className="absolute inset-0 rounded-full border-2 border-destructive/50"
                    animate={{ scale: [1, 1.45, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 1.6, repeat: Infinity }}
                  />
                )}
                {isEvaluating
                  ? <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  : isListening
                  ? <Square className="h-5 w-5 fill-destructive" />
                  : <Mic className="h-6 w-6" />}
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleTryAgain}
                className="rounded-2xl border border-border/50 bg-muted/60 px-4 py-2.5 text-xs text-muted-foreground font-semibold hover:bg-muted transition-colors flex-1 text-center"
              >
                {t("cancel")}
              </motion.button>
            </div>

            <p className="text-center text-[0.6rem] text-muted-foreground mt-1">
              {isEvaluating
                ? (language === "ar" ? "جاري التقييم..." : "Evaluating...")
                : isListening
                ? (language === "ar" ? "استمع • صمت ٢ ثانية = انتهاء الآية" : "Listening • 2s silence = verse done")
                : (language === "ar" ? "اضغط المايك لبدء التلاوة من الذاكرة" : "Tap mic to start reciting from memory")}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
