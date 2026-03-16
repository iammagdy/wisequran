import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, TriangleAlert as AlertTriangle, History, ChevronDown, ChevronUp, TrendingUp, Sparkles, Check, X } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { SURAH_META } from "@/data/surah-meta";
import { fetchSurahAyahs, type Ayah } from "@/lib/quran-api";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useRecitationHistory } from "@/hooks/useRecitationHistory";
import { scoreRangeRecitation, type StrictnessLevel } from "@/lib/ayah-match";
import { cn, toArabicNumerals } from "@/lib/utils";
import SurahRangeSelector from "@/components/recitation/SurahRangeSelector";
import MicButton from "@/components/recitation/MicButton";
import RecitationScoreCard from "@/components/recitation/RecitationScoreCard";

type PagePhase = "setup" | "recording" | "result";

interface ScoreResult {
  overallScore: number;
  correctAyahs: number;
  totalAyahs: number;
  perAyah: { numberInSurah: number; score: number; isCorrect: boolean }[];
  transcript: string;
}

interface RevealedAyah {
  numberInSurah: number;
  score: number;
  isCorrect: boolean;
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
  const [liveAyahScores, setLiveAyahScores] = useState<Record<number, { score: number; isCorrect: boolean }>>({});
  const [revealedAyahs, setRevealedAyahs] = useState<RevealedAyah[]>([]);
  const [currentAyahIndex, setCurrentAyahIndex] = useState(0);
  const ayahRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const containerRef = useRef<HTMLDivElement | null>(null);

  const speech = useSpeechRecognition();
  const recitationHistory = useRecitationHistory();
  const silentAudioRef = useRef<HTMLAudioElement | null>(null);

  // ⚡ Bolt: O(1) direct indexing
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
    } catch {
      setAyahsData([]);
    }
    setLoadingAyahs(false);
  };

  const handleStartTest = async () => {
    await loadAyahs();
    speech.reset();
    setLiveAyahScores({});
    setRevealedAyahs([]);
    setCurrentAyahIndex(0);
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

  const handleStopAndEvaluate = useCallback(async () => {
    speech.stop();
  }, [speech]);

  useEffect(() => {
    if (phase !== "recording") return;
    if (!speech.transcript && !speech.interimTranscript) return;

    const fullTranscript = speech.transcript + " " + speech.interimTranscript;
    if (!fullTranscript.trim()) return;

    const { perAyah: livePerAyah } = scoreRangeRecitation(ayahsData, fullTranscript, strictness);
    const newScores: Record<number, { score: number; isCorrect: boolean }> = {};
    livePerAyah.forEach(p => {
      newScores[p.numberInSurah] = { score: p.score, isCorrect: p.isCorrect };
    });
    setLiveAyahScores(newScores);

    setRevealedAyahs(prev => {
      const updated = [...prev];
      ayahsData.forEach((ayah, idx) => {
        const scored = newScores[ayah.numberInSurah];
        if (!scored) return;
        const alreadyRevealed = updated.some(r => r.numberInSurah === ayah.numberInSurah);
        if (!alreadyRevealed && scored.isCorrect) {
          updated.push({ numberInSurah: ayah.numberInSurah, score: scored.score, isCorrect: true });
          setCurrentAyahIndex(Math.min(idx + 1, ayahsData.length - 1));
        }
      });
      return updated;
    });

    if (speech.status === "done") {
      const { overallScore, correctAyahs, perAyah } = scoreRangeRecitation(ayahsData, fullTranscript, strictness);

      setRevealedAyahs(
        perAyah.map(p => ({ numberInSurah: p.numberInSurah, score: p.score, isCorrect: p.isCorrect }))
      );

      const scoreResult: ScoreResult = {
        overallScore,
        correctAyahs,
        totalAyahs: ayahsData.length,
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
        totalAyahs: ayahsData.length,
        correctAyahs,
        transcript: fullTranscript,
        strictness,
        perAyah,
      });
    }
  }, [speech.status, speech.transcript, speech.interimTranscript, phase, ayahsData, strictness, surahNumber, ayahFrom, ayahTo, recitationHistory]);

  useEffect(() => {
    if (revealedAyahs.length === 0) return;
    const lastRevealed = revealedAyahs[revealedAyahs.length - 1];
    const ayahIndex = ayahsData.findIndex(a => a.numberInSurah === lastRevealed.numberInSurah);
    const el = ayahRefs.current[ayahIndex];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [revealedAyahs.length]);

  const handleTryAgain = () => {
    speech.reset();
    setResult(null);
    setRevealedAyahs([]);
    setCurrentAyahIndex(0);
    setLiveAyahScores({});
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

  return (
    <div className="px-4 pt-6 pb-24" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
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

      {/* English coming soon banner */}
      {language === "en" && <EnglishComingSoonBanner />}

      {/* iOS not supported banner */}
      {speech.isIOSMode && <IOSUnsupportedBanner language={language} />}

      {/* Not supported banner (non-iOS) */}
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
        {/* Setup Phase */}
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

            {/* Strictness Selector */}
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

            {/* My Progress Section */}
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

            {/* History Section */}
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
                          // ⚡ Bolt: O(1) direct indexing
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

        {/* Recording Phase */}
        {phase === "recording" && (
          <motion.div
            key="recording"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Range label */}
            <div className="rounded-2xl bg-card border border-border/50 shadow-soft p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">{t("recitation_test")}</p>
              <p className="font-arabic font-bold text-lg">{rangeLabel}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {language === "ar"
                  ? `${toArabicNumerals(ayahTo - ayahFrom + 1)} ${t("ayahs")}`
                  : `${ayahTo - ayahFrom + 1} ${t("verses")}`}
              </p>
            </div>

            {/* Live scoring panel */}
            {speech.status === "listening" && revealedAyahs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-card border border-border/50 shadow-soft p-4"
              >
                <div className="flex items-center justify-center gap-6">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium text-muted-foreground">
                      {language === "ar" ? "صحيح" : "Correct"}
                    </span>
                    <span className="text-lg font-bold tabular-nums">
                      {language === "ar"
                        ? toArabicNumerals(revealedAyahs.filter(r => r.isCorrect).length)
                        : revealedAyahs.filter(r => r.isCorrect).length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <X className="h-4 w-4 text-destructive" />
                    <span className="text-sm font-medium text-muted-foreground">
                      {language === "ar" ? "خطأ" : "Wrong"}
                    </span>
                    <span className="text-lg font-bold tabular-nums">
                      {language === "ar"
                        ? toArabicNumerals(revealedAyahs.filter(r => !r.isCorrect).length)
                        : revealedAyahs.filter(r => !r.isCorrect).length}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Ayah progressive reveal panel */}
            {ayahsData.length > 0 && (
              <div
                ref={containerRef}
                className="rounded-2xl bg-card border border-border/50 shadow-soft p-4 max-h-96 overflow-y-auto"
              >
                <div className="space-y-3" dir="rtl">
                  {ayahsData.map((a, index) => {
                    const revealed = revealedAyahs.find(r => r.numberInSurah === a.numberInSurah);
                    const isRevealed = revealed !== undefined;
                    const isCurrent = index === currentAyahIndex && !isRevealed && speech.status === "listening";

                    return (
                      <motion.div
                        key={a.numberInSurah}
                        ref={el => { ayahRefs.current[index] = el; }}
                        initial={false}
                        animate={{
                          filter: isRevealed ? "blur(0px)" : "blur(6px)",
                          opacity: isRevealed ? 1 : isCurrent ? 0.35 : 0.2,
                          scale: isRevealed ? 1 : 0.98,
                        }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className={cn(
                          "rounded-xl p-3 transition-colors select-none",
                          isRevealed && revealed.isCorrect && "bg-emerald-500/15 border-2 border-emerald-500/70",
                          isRevealed && !revealed.isCorrect && "bg-destructive/15 border-2 border-destructive/70",
                          !isRevealed && isCurrent && "bg-primary/10 border-2 border-primary/40",
                          !isRevealed && !isCurrent && "bg-muted/20 border border-border/20"
                        )}
                      >
                        <p
                          className={cn(
                            "font-arabic text-base leading-loose text-center",
                            !isRevealed && "pointer-events-none"
                          )}
                        >
                          {a.text}
                          <span className="text-muted-foreground text-sm ms-2">﴿{a.numberInSurah}﴾</span>
                        </p>
                        {isRevealed && (
                          <motion.div
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex items-center justify-center gap-2 mt-2"
                          >
                            {revealed.isCorrect ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <X className="h-3 w-3 text-destructive" />
                            )}
                            <span className="text-xs font-medium">
                              {language === "ar" ? toArabicNumerals(revealed.score) : revealed.score}%
                            </span>
                          </motion.div>
                        )}
                        {!isRevealed && isCurrent && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                            className="flex items-center justify-center mt-2"
                          >
                            <span className="text-xs text-primary/70 font-medium">
                              {language === "ar" ? "اتلُ هذه الآية..." : "Recite this verse..."}
                            </span>
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
                {speech.status === "idle" && revealedAyahs.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center mt-3">
                    {language === "ar" ? "اضغط الميكروفون وابدأ التلاوة من الذاكرة" : "Tap the mic and recite from memory"}
                  </p>
                )}
              </div>
            )}

            {/* Mic */}
            <div className="flex flex-col items-center">
              <MicButton
                status={speech.status}
                onStart={handleMicStart}
                onStop={handleStopAndEvaluate}
                interimTranscript={speech.interimTranscript}
              />
            </div>

            {speech.status === "idle" && (
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

        {/* Result Phase */}
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
