import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, X, Volume2, Clock, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { MoonAnimation } from "@/components/sleep/MoonAnimation";
import { StarField } from "@/components/sleep/StarField";
import { CircularTimer } from "@/components/sleep/CircularTimer";
import { SurahSelectorForSleep } from "@/components/sleep/SurahSelectorForSleep";
import { useSleepModePlayer } from "@/hooks/useSleepModePlayer";
import { RECITERS } from "@/lib/reciters";
import { SURAH_META } from "@/data/surah-meta";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatTime, toArabicNumerals } from "@/lib/utils";

const TIMER_PRESETS = [10, 15, 20, 30, 45, 60];

type SettingsPanel = "timer" | "reciter" | "surah" | "volume" | null;


export default function SleepModePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const [activePanel, setActivePanel] = useState<SettingsPanel>(null);
  const [showWelcome, setShowWelcome] = useState(() => !localStorage.getItem("wise-sleep-welcome-seen"));

  const {
    prefs,
    setPrefs,
    isPlaying,
    isLoading,
    hasError,
    remainingSeconds,
    audioCurrentTime,
    audioDuration,
    togglePlay,
    stop,
  } = useSleepModePlayer();

  useEffect(() => {
    const state = location.state as { surahNumber?: number; reciterId?: string } | null;
    if (state?.surahNumber) setPrefs({ surahNumber: state.surahNumber });
    if (state?.reciterId) setPrefs({ reciterId: state.reciterId });
  }, []);

  const dismissWelcome = () => {
    localStorage.setItem("wise-sleep-welcome-seen", "1");
    setShowWelcome(false);
  };

  const togglePanel = (panel: SettingsPanel) => {
    setActivePanel((prev) => (prev === panel ? null : panel));
  };

  // ⚡ Bolt: O(1) direct indexing
  const selectedSurah = SURAH_META[prefs.surahNumber - 1];
  const sleepReciters = RECITERS.filter((r) => r.suitableForSleep);
  const selectedReciter = RECITERS.find((r) => r.id === prefs.reciterId);

  const progressPct = audioDuration > 0 ? (audioCurrentTime / audioDuration) * 100 : 0;

  return (
    <div
      className="fixed inset-0 overflow-hidden flex flex-col"
      style={{ background: "linear-gradient(160deg, #0a0e1a 0%, #0f1525 40%, #1a1f2e 100%)" }}
    >
      <StarField />

      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-safe-top pt-5 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-amber-300/70 text-base font-bold leading-none">Zzz</span>
            <span className="text-sm font-medium text-amber-200/70">
              {language === "ar" ? "وضع النوم" : "Sleep Mode"}
            </span>
          </div>
          <button
            onClick={() => { stop(); navigate(-1); }}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4 text-white/60" />
          </button>
        </div>

        {/* Center: Moon + Timer */}
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-5">
          <div className="relative flex items-center justify-center">
            <CircularTimer
              totalSeconds={prefs.timerMinutes * 60}
              remainingSeconds={remainingSeconds}
              size={240}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <MoonAnimation isPlaying={isPlaying} />
            </div>
          </div>

          {selectedSurah && (
            <motion.div
              key={selectedSurah.number}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <p className="text-2xl font-light text-amber-100 font-arabic" dir="rtl">
                {selectedSurah.name}
              </p>
              <p className="text-xs text-amber-200/40 mt-1">
                {selectedSurah.englishName}
              </p>
              {selectedReciter && (
                <p className="text-xs text-white/30 mt-0.5">
                  {language === "ar" ? selectedReciter.name : selectedReciter.nameEn}
                </p>
              )}
            </motion.div>
          )}

          {hasError && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 bg-red-500/15 border border-red-400/20 rounded-xl px-4 py-2.5 text-sm text-red-300"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              {language === "ar" ? "تعذّر تحميل الصوت. تحقق من اتصالك." : "Could not load audio. Check your connection."}
            </motion.div>
          )}
        </div>

        {/* Playback Controls */}
        <div className="flex flex-col items-center gap-3 py-4 px-6">
          <div className="flex items-center gap-8">
            <button
              onClick={() => setPrefs({ surahNumber: Math.max(1, prefs.surahNumber - 1) })}
              className="p-3 rounded-full bg-white/8 hover:bg-white/15 border border-white/10 transition-all text-white/60"
            >
              <ChevronDown className="h-5 w-5" />
            </button>

            <button
              onClick={togglePlay}
              disabled={isLoading}
              className="w-16 h-16 rounded-full border-2 border-amber-400/50 bg-amber-400/15 hover:bg-amber-400/25 flex items-center justify-center transition-all active:scale-95 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 rounded-full border-2 border-amber-300/60 border-t-transparent animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-6 w-6 text-amber-200" />
              ) : (
                <Play className="h-6 w-6 text-amber-200 translate-x-0.5" />
              )}
            </button>

            <button
              onClick={() => setPrefs({ surahNumber: Math.min(114, prefs.surahNumber + 1) })}
              className="p-3 rounded-full bg-white/8 hover:bg-white/15 border border-white/10 transition-all text-white/60"
            >
              <ChevronUp className="h-5 w-5" />
            </button>
          </div>

          {/* Audio progress bar */}
          <div className="w-full max-w-xs">
            <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-amber-400/60"
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <div className="flex justify-between mt-1 text-[0.6rem] text-white/30 tabular-nums">
              <span>{formatTime(audioCurrentTime, language)}</span>
              {audioDuration > 0 && <span>{formatTime(audioDuration, language)}</span>}
            </div>
          </div>
        </div>

        {/* Settings Panels */}
        <div className="px-4 pb-safe-bottom pb-6 space-y-2">
          {/* Quick settings row */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: "timer" as SettingsPanel, icon: <Clock className="h-3.5 w-3.5" />, label: language === "ar" ? `${toArabicNumerals(prefs.timerMinutes)} د` : `${prefs.timerMinutes}m` },
              { id: "surah" as SettingsPanel, icon: null, label: selectedSurah ? (language === "ar" ? selectedSurah.name : selectedSurah.englishName) : "Surah" },
              { id: "reciter" as SettingsPanel, icon: null, label: selectedReciter ? (language === "ar" ? selectedReciter.name : selectedReciter.nameEn) : "Reciter" },
              { id: "volume" as SettingsPanel, icon: <Volume2 className="h-3.5 w-3.5" />, label: language === "ar" ? "الصوت" : "Volume" },
            ].map(({ id, icon, label }) => (
              <button
                key={id}
                onClick={() => togglePanel(id)}
                className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-2 rounded-full text-xs border transition-all shrink-0 ${
                  activePanel === id
                    ? "bg-amber-400/20 border-amber-400/40 text-amber-200"
                    : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
                }`}
              >
                {icon}
                <span className="max-w-[90px] truncate">{label}</span>
              </button>
            ))}
          </div>

          {/* Expanded panel */}
          <AnimatePresence mode="wait">
            {activePanel && (
              <motion.div
                key={activePanel}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  {activePanel === "timer" && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
                        {language === "ar" ? "مدة المؤقت" : "Timer Duration"}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {TIMER_PRESETS.map((mins) => (
                          <button
                            key={mins}
                            onClick={() => setPrefs({ timerMinutes: mins })}
                            className={`px-4 py-2 rounded-full text-sm border transition-all ${
                              prefs.timerMinutes === mins
                                ? "bg-amber-400/20 border-amber-400/40 text-amber-200"
                                : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
                            }`}
                          >
                            {language === "ar" ? `${toArabicNumerals(mins)} دقيقة` : `${mins} min`}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {activePanel === "surah" && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
                        {language === "ar" ? "اختر السورة" : "Choose Surah"}
                      </p>
                      <SurahSelectorForSleep
                        selected={prefs.surahNumber}
                        language={language}
                        onChange={(n) => setPrefs({ surahNumber: n })}
                      />
                    </div>
                  )}

                  {activePanel === "reciter" && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
                        {language === "ar" ? "القارئ" : "Reciter"}
                      </p>
                      <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                        {sleepReciters.map((r) => (
                          <button
                            key={r.id}
                            onClick={() => setPrefs({ reciterId: r.id })}
                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-left border transition-all ${
                              prefs.reciterId === r.id
                                ? "bg-amber-400/15 border-amber-400/35 text-amber-100"
                                : "bg-white/4 border-white/8 text-white/60 hover:bg-white/8"
                            }`}
                          >
                            <div className={`h-3.5 w-3.5 rounded-full border-2 shrink-0 ${prefs.reciterId === r.id ? "bg-amber-400 border-amber-400" : "border-white/20"}`} />
                            <span>{language === "ar" ? r.name : r.nameEn}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {activePanel === "volume" && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-white/50">{language === "ar" ? "صوت القرآن" : "Quran Volume"}</p>
                        <span className="text-xs text-amber-300/60">{language === "ar" ? toArabicNumerals(prefs.quranVolume) : prefs.quranVolume}%</span>
                      </div>
                      <Slider
                        value={[prefs.quranVolume]}
                        onValueChange={([v]) => setPrefs({ quranVolume: v })}
                        min={0} max={100} step={5}
                        className="[&_[role=slider]]:bg-amber-300 [&_[role=slider]]:border-amber-400"
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Welcome overlay */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center p-6"
            style={{ background: "rgba(0,0,0,0.5)" }}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              className="w-full max-w-sm rounded-3xl border border-amber-400/20 p-6 space-y-4"
              style={{ background: "linear-gradient(145deg, #12182b, #1a2035)" }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-amber-300 leading-none">Zzz</span>
                <h2 className="text-lg font-semibold text-amber-100">
                  {language === "ar" ? "وضع النوم" : "Sleep Mode"}
                </h2>
              </div>
              <p className="text-sm text-white/60 leading-relaxed">
                {language === "ar"
                  ? "استمع للقرآن الكريم قبل النوم. يوقف التشغيل تلقائياً بعد المدة المحددة مع تلاشي تدريجي للصوت."
                  : "Listen to the Quran before sleep. Playback automatically stops after the set duration with a gentle fade-out."}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={dismissWelcome}
                  className="flex-1 py-2.5 rounded-xl bg-amber-400/15 border border-amber-400/30 text-amber-200 text-sm font-medium"
                >
                  {language === "ar" ? "ابدأ" : "Get Started"}
                </button>
                <button
                  onClick={dismissWelcome}
                  className="py-2.5 px-4 rounded-xl bg-white/5 border border-white/10 text-white/40 text-sm"
                >
                  {language === "ar" ? "لا تظهر مجدداً" : "Don't show again"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
