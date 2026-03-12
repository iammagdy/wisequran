import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Pause, Loader as Loader2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { getReciterById } from "@/lib/reciters";
import { toArabicNumerals } from "@/lib/utils";
import { fetchSurahAyahs, type Ayah } from "@/lib/quran-api";

interface NowPlayingScreenProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NowPlayingScreen({ open, onOpenChange }: NowPlayingScreenProps) {
  const {
    surahNumber,
    surahName,
    playing,
    loading,
    playingReciterId,
    currentTime,
    duration,
    currentAyahInSurah,
    togglePlayPause,
    seekToAyah,
  } = useAudioPlayer();

  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loadingAyahs, setLoadingAyahs] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const currentAyahRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && surahNumber) {
      setLoadingAyahs(true);
      fetchSurahAyahs(surahNumber)
        .then((ayahs) => {
          setAyahs(ayahs || []);
          setLoadingAyahs(false);
        })
        .catch(() => {
          setLoadingAyahs(false);
        });
    }
  }, [open, surahNumber]);

  useEffect(() => {
    if (currentAyahRef.current && currentAyahInSurah !== null) {
      currentAyahRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentAyahInSurah]);

  if (!surahNumber) return null;

  const reciter = getReciterById(playingReciterId);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${toArabicNumerals(mins)}:${toArabicNumerals(secs.toString().padStart(2, '0'))}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full h-full w-full p-0 border-0 bg-gradient-spiritual" dir="rtl">
        <div className="flex flex-col h-full safe-area-bottom">
          <div className="flex items-center justify-between px-4 py-5 border-b border-border/50 bg-card/30 backdrop-blur-sm">
            <button
              onClick={() => onOpenChange(false)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-muted/80 hover:bg-muted transition-all shadow-md active:scale-95"
              aria-label="إغلاق"
            >
              <X className="h-6 w-6 text-foreground" />
            </button>
            <div className="flex-1 text-center px-4">
              <h2 className="font-arabic text-xl font-bold text-foreground">{surahName}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{reciter.name}</p>
            </div>
            <div className="w-11" />
          </div>

          <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
            {loadingAyahs ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-3 py-6 pb-40">
                {ayahs.map((ayah) => {
                  const isCurrentAyah = currentAyahInSurah === ayah.numberInSurah;
                  return (
                    <motion.div
                      key={ayah.number}
                      ref={isCurrentAyah ? currentAyahRef : null}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      onClick={() => seekToAyah(ayah.numberInSurah)}
                      className={`relative rounded-2xl p-6 transition-all duration-300 cursor-pointer ${
                        isCurrentAyah
                          ? 'bg-primary/10 border-2 border-primary/40 shadow-lg'
                          : 'bg-card/60 border border-border/50 hover:bg-card/80 active:scale-[0.98]'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all ${
                            isCurrentAyah
                              ? 'bg-primary text-primary-foreground scale-110 shadow-md'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {toArabicNumerals(ayah.numberInSurah)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`font-arabic leading-loose transition-all ${
                              isCurrentAyah
                                ? 'text-foreground text-2xl font-semibold'
                                : 'text-foreground/90 text-xl'
                            }`}
                          >
                            {ayah.text}
                          </p>
                        </div>
                      </div>
                      {isCurrentAyah && (
                        <motion.div
                          layoutId="currentAyahIndicator"
                          className="absolute -right-1 top-1/2 -translate-y-1/2 w-1.5 h-20 bg-primary rounded-full shadow-md"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          <div className="border-t border-border/50 bg-card/90 backdrop-blur-xl px-6 py-6 pb-8 space-y-5 safe-bottom">
            <div className="space-y-3">
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-l from-primary to-primary/70 shadow-sm"
                  style={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground font-medium">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 pb-2">
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={togglePlayPause}
                disabled={loading}
                className="flex h-16 w-16 items-center justify-center rounded-full counter-button text-primary-foreground disabled:opacity-50 shadow-xl"
              >
                {loading ? (
                  <Loader2 className="h-8 w-8 animate-spin" />
                ) : playing ? (
                  <Pause className="h-8 w-8" />
                ) : (
                  <Play className="h-8 w-8 translate-x-[-2px]" />
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
