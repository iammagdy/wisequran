import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, TriangleAlert as AlertTriangle, History, ChevronDown, ChevronUp, TrendingUp, Sparkles, Loader as Loader2 } from "lucide-react";
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
        <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">Arabic Only — English Coming Soon</p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          Speech recognition scoring is currently optimized for Arabic recitation only. English support is on its way.
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

  const speech = useSpeechRecognition();
  const recitationHistory = useRecitationHistory();

  const meta = SURAH_META.find((s) => s.number === surahNumber)!;

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
    setPhase("recording");
  };

  const handleStopAndEvaluate = useCallback(async () => {
    speech.stop();
  }, [speech]);

  useEffect(() => {
    if (phase !== "recording") return;
    if (speech.status !== "done") return;
    if (!speech.transcript && !speech.interimTranscript) return;

    const fullTranscript = speech.transcript || speech.interimTranscript;
    if (!fullTranscript.trim()) return;

    const { overallScore, correctAyahs, perAyah } = scoreRangeRecitation(ayahsData, fullTranscript, strictness);

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
  }, [speech.status, speech.transcript, phase]);

  const handleTryAgain = () => {
    speech.reset();
    setResult(null);
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
          className="rounded-xl p-2.5 hover:bg-muted transition-colors"
        >
          <ArrowRight className="h-5 w-5" />
        </motion.button>
        <div>
          <h1 className="text-2xl font-bold heading-decorated">{t("recitation_test")}</h1>
          <p className="text-sm text-muted-foreground">{t("recitation_subtitle")}</p>
        </div>
      </div>

      {/* English coming soon banner */}
      {language === "en" && <EnglishComingSoonBanner />}

      {/* Not supported banner */}
      {!speech.isSupported && (
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
                          const recMeta = SURAH_META.find((s) => s.number === rec.surah_number);
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

            {/* Ayah preview (blurred until done) */}
            {ayahsData.length > 0 && (
              <div className="rounded-2xl bg-card border border-border/50 shadow-soft p-4 max-h-48 overflow-y-auto">
                <div className={cn("space-y-2", speech.status === "done" ? "" : "blur-sm select-none pointer-events-none")} dir="rtl">
                  {ayahsData.map((a) => (
                    <p key={a.numberInSurah} className="font-arabic text-base leading-loose text-center">
                      {a.text}
                      <span className="text-muted-foreground text-sm ms-1">﴿{a.numberInSurah}﴾</span>
                    </p>
                  ))}
                </div>
                {speech.status !== "done" && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    {language === "ar" ? "متن مخفي أثناء الاختبار" : "Text hidden during test"}
                  </p>
                )}
              </div>
            )}

            {/* Processing overlay for iOS Whisper mode */}
            {speech.status === "processing" && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-primary/5 border border-primary/20 p-5 flex flex-col items-center gap-3"
              >
                <Loader2 className="h-7 w-7 text-primary animate-spin" />
                <p className="text-sm font-semibold text-primary">{t("processing")}</p>
                <p className="text-xs text-muted-foreground text-center">
                  {language === "ar"
                    ? "يتم تحليل تلاوتك بواسطة الذكاء الاصطناعي..."
                    : "AI is analyzing your recitation..."}
                </p>
              </motion.div>
            )}

            {/* Mic */}
            {speech.status !== "processing" && (
              <div className="flex flex-col items-center">
                <MicButton
                  status={speech.status}
                  onStart={speech.start}
                  onStop={handleStopAndEvaluate}
                  interimTranscript={speech.interimTranscript}
                />
              </div>
            )}

            {speech.error && speech.status === "error" && (
              <div className="rounded-xl bg-destructive/5 border border-destructive/20 px-4 py-3 text-center">
                <p className="text-xs text-destructive font-semibold">
                  {speech.error === "no_speech_detected"
                    ? t("no_speech_detected")
                    : speech.error}
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
