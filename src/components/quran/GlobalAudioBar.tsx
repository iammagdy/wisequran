import { motion } from "framer-motion";
import { Play, Pause, Loader2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { getReciterById } from "@/lib/reciters";
import { toArabicNumerals } from "@/lib/utils";


export default function GlobalAudioBar() {
  const {
    surahNumber, surahName, playing, loading, playingReciterId,
    togglePlayPause, stop, isAyahMode, currentAyahIndex, totalAyahs,
    currentTime, duration,
  } = useAudioPlayer();
  const navigate = useNavigate();

  if (!surahNumber) return null;

  // In ayah mode: progress = ayah index / total. Otherwise: time-based.
  const pct = isAyahMode
    ? totalAyahs > 0 ? ((currentAyahIndex + (duration > 0 ? currentTime / duration : 0)) / totalAyahs) * 100 : 0
    : duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleNavigate = () => {
    navigate(`/surah/${surahNumber}`);
  };

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom))] inset-x-0 z-40 px-3"
    >
      <div className="rounded-2xl border border-border/50 bg-card/95 backdrop-blur-md shadow-lg overflow-hidden">
        {/* Progress bar — RTL: fills from right */}
        <div className="h-0.5 w-full bg-muted">
          <div
            className="h-full bg-primary transition-[width] duration-300 mr-auto"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="flex items-center gap-3 px-3 py-2" dir="rtl">
          {/* Play/Pause */}
          <button
            onClick={togglePlayPause}
            disabled={loading}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : playing ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 translate-x-[-1px]" />
            )}
          </button>

          {/* Info — clickable to navigate to surah */}
          <button onClick={handleNavigate} className="flex-1 min-w-0 text-right">
            <p className="font-arabic text-sm font-semibold text-foreground truncate">{surahName}</p>
            <p className="text-[10px] text-muted-foreground truncate">
              {getReciterById(playingReciterId).name}
              {isAyahMode && totalAyahs > 0 && (
                <span className="mr-2">آية {toArabicNumerals(currentAyahIndex + 1)} من {toArabicNumerals(totalAyahs)}</span>
              )}
            </p>
          </button>

          {/* Close */}
          <button
            onClick={stop}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
