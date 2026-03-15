import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Pause, Loader as Loader2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { getReciterById } from "@/lib/reciters";
import { toArabicNumerals } from "@/lib/utils";
import { fetchSurahAyahs, type Ayah } from "@/lib/quran-api";
import { useLanguage } from "@/contexts/LanguageContext";

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

  const { t, language } = useLanguage();

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
    if (language === "ar") {
      return `${toArabicNumerals(mins)}:${toArabicNumerals(secs.toString().padStart(2, '0'))}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full h-full w-full p-0 border-0 bg-background rounded-none data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100 [&>button:last-child]:hidden">
        <div className="flex flex-col h-full safe-area-bottom">
          <div className="flex items-center justify-between px-4 py-5 border-b border-border bg-card/50 backdrop-blur-sm">
            <button
              onClick={() => onOpenChange(false)}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 hover:bg-primary/25 transition-all shadow-lg active:scale-95 border-2 border-primary/30"
              aria-label={t("close")}
            >
              <X className="h-6 w-6 text-foreground" strokeWidth={2.5} />
            </button>
            <div className="flex-1 text-center px-4">
              <h2 className="font-arabic text-xl font-bold text-foreground">{surahName}</h2>
              <p className="text-sm text-foreground/70 mt-0.5 font-medium">{language === "en" && reciter.nameEn ? reciter.nameEn : reciter.name}</p>
            </div>
            <div className="w-12" />
          </div>

          <ScrollArea className="flex-1 px-4 bg-gradient-to-b from-background via-background to-muted/20" ref={scrollAreaRef}>
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
                          ? 'bg-primary/15 border-2 border-primary/50 shadow-lg'
                          : 'bg-card border border-border hover:bg-card/80 hover:border-primary/30 active:scale-[0.98]'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all ${
                            isCurrentAyah
                              ? 'bg-primary text-primary-foreground scale-110 shadow-md'
                              : 'bg-muted text-foreground'
                          }`}
                        >
                          {language === "ar" ? toArabicNumerals(ayah.numberInSurah) : ayah.numberInSurah}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`font-arabic leading-loose transition-all ${
                              isCurrentAyah
                                ? 'text-foreground text-2xl font-semibold'
                                : 'text-foreground text-xl'
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

          <div className="border-t-2 border-border bg-card backdrop-blur-xl px-6 py-6 pb-8 space-y-5 safe-bottom shadow-2xl">
            <div className="space-y-3">
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted/80">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-l from-primary to-primary/70 shadow-sm"
                  style={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="flex items-center justify-between text-sm text-foreground/80 font-semibold">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 pb-2">
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={togglePlayPause}
                disabled={loading}
                className="flex h-20 w-20 items-center justify-center rounded-full counter-button text-primary-foreground disabled:opacity-50 shadow-2xl"
              >
                {loading ? (
                  <Loader2 className="h-9 w-9 animate-spin" strokeWidth={2.5} />
                ) : playing ? (
                  <Pause className="h-9 w-9" strokeWidth={2.5} />
                ) : (
                  <Play className="h-9 w-9 translate-x-[-2px]" strokeWidth={2.5} />
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
