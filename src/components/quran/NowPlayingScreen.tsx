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
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-4 py-4 border-b border-border/50">
            <button
              onClick={() => onOpenChange(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted/50 transition-colors"
            >
              <X className="h-5 w-5 text-foreground" />
            </button>
            <div className="flex-1 text-center">
              <h2 className="font-arabic text-lg font-bold text-foreground">{surahName}</h2>
              <p className="text-xs text-muted-foreground">{reciter.name}</p>
            </div>
            <div className="w-10" />
          </div>

          <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
            {loadingAyahs ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4 py-6 pb-40">
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
                      className={`relative rounded-2xl p-5 transition-all duration-300 cursor-pointer ${
                        isCurrentAyah
                          ? 'bg-primary/10 border-2 border-primary/30 shadow-lg'
                          : 'bg-card/50 border border-border/50 hover:bg-card/80'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all ${
                            isCurrentAyah
                              ? 'bg-primary text-primary-foreground scale-110'
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
                          className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-16 bg-primary rounded-full"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          <div className="border-t border-border/50 bg-card/80 backdrop-blur-xl px-6 py-6 space-y-4">
            <div className="space-y-2">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-l from-primary to-primary/70"
                  style={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={togglePlayPause}
                disabled={loading}
                className="flex h-16 w-16 items-center justify-center rounded-full counter-button text-primary-foreground disabled:opacity-50 shadow-lg"
              >
                {loading ? (
                  <Loader2 className="h-7 w-7 animate-spin" />
                ) : playing ? (
                  <Pause className="h-7 w-7" />
                ) : (
                  <Play className="h-7 w-7 translate-x-[-2px]" />
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
