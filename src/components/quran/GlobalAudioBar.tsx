import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Loader as Loader2, X } from "lucide-react";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { getReciterById } from "@/lib/reciters";
import { toArabicNumerals } from "@/lib/utils";
import NowPlayingScreen from "./NowPlayingScreen";
import { useLanguage } from "@/contexts/LanguageContext";


export default function GlobalAudioBar() {
  const {
    surahNumber, surahName, playing, loading, playingReciterId,
    togglePlayPause, stop, totalAyahs, currentAyahInSurah,
    currentTime, duration,
  } = useAudioPlayer();

  const [showNowPlaying, setShowNowPlaying] = useState(false);
  const { t, language } = useLanguage();

  if (!surahNumber) return null;

  // Progress based on time
  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleOpenNowPlaying = () => {
    setShowNowPlaying(true);
  };

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      className="fixed inset-x-0 z-[51] px-3 pb-3 pointer-events-none"
      style={{ bottom: 'calc(var(--nav-height) + env(safe-area-inset-bottom, 0px) + 0.5rem)' }}
    >
      <div
        onClick={handleOpenNowPlaying}
        className="rounded-2xl glass-card shadow-elevated-lg overflow-hidden pointer-events-auto cursor-pointer active:scale-[0.98] transition-transform"
        style={{ boxShadow: '0 -4px 20px -4px hsl(var(--foreground) / 0.1)' }}
      >
        <div className="h-1 w-full bg-muted/50">
          <motion.div
            className="h-full bg-gradient-to-l from-primary to-primary/70 mr-auto"
            style={{ width: `${pct}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="flex items-center gap-3 px-4 py-3" dir={language === "ar" ? "rtl" : "ltr"}>
          {/* Play/Pause */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              togglePlayPause();
            }}
            disabled={loading}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full counter-button text-primary-foreground disabled:opacity-50 z-10"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : playing ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 translate-x-[-1px]" />
            )}
          </motion.button>

          {/* Info — entire bar is clickable */}
          <div className={`flex-1 min-w-0 pointer-events-none ${language === "ar" ? "text-right" : "text-left"}`}>
            <p className="font-arabic text-sm font-bold text-foreground truncate">{surahName}</p>
            <p className="text-[0.625rem] text-muted-foreground truncate">
              {(() => { const r = getReciterById(playingReciterId); return language === "en" && r.nameEn ? r.nameEn : r.name; })()}
              {currentAyahInSurah !== null && totalAyahs > 0 && (
                <span className="ms-2"> · {language === "en" ? "v." : t("ayah")} {language === "ar" ? toArabicNumerals(currentAyahInSurah) : currentAyahInSurah} {t("of")} {language === "ar" ? toArabicNumerals(totalAyahs) : totalAyahs}</span>
              )}
            </p>
          </div>

          {/* Close */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              stop();
            }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/50 z-10"
          >
            <X className="h-4 w-4" />
          </motion.button>
        </div>
      </div>

      <NowPlayingScreen open={showNowPlaying} onOpenChange={setShowNowPlaying} />
    </motion.div>
  );
}
