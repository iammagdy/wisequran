import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Loader as Loader2, ChevronDown, RotateCcw, Repeat1, Volume2 } from "lucide-react";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { RECITERS, DEFAULT_RECITER, getReciterById } from "@/lib/reciters";
import { cn, toArabicNumerals, stripBismillah } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Ayah } from "@/lib/quran-api";

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;
const REPEAT_OPTIONS = [0, 2, 3, 5, 7, 10] as const;

interface Props {
  surahNumber: number;
  surahName: string;
  ayahs: Ayah[];
}

export default function ListeningTab({ surahNumber, surahName, ayahs }: Props) {
  const { t, language, isRTL } = useLanguage();
  const player = useAudioPlayer();
  const [reciterId, setReciterId] = useLocalStorage<string>("wise-reciter", DEFAULT_RECITER);

  const [speed, setSpeed] = useState<number>(1);
  const [repeatCount, setRepeatCount] = useState<number>(0);
  const [currentRepeat, setCurrentRepeat] = useState(0);
  const [showReciterPicker, setShowReciterPicker] = useState(false);
  const repeatRef = useRef(repeatCount);
  const currentRepeatRef = useRef(currentRepeat);

  repeatRef.current = repeatCount;
  currentRepeatRef.current = currentRepeat;

  const isThisSurah = player.surahNumber === surahNumber;
  const playing = isThisSurah && player.playing;
  const loading = isThisSurah && player.loading;

  const currentAyahInSurah = isThisSurah ? player.currentAyahInSurah : null;
  const currentAyah = ayahs.find((a) => a.numberInSurah === currentAyahInSurah);

  const currentReciter = getReciterById(reciterId);

  const handlePlayPause = () => {
    if (isThisSurah) {
      player.togglePlayPause();
    } else {
      player.play(surahNumber, surahName, ayahs);
    }
  };

  useEffect(() => {
    const audioEl = document.querySelector("audio") as HTMLAudioElement | null;
    if (audioEl) {
      audioEl.playbackRate = speed;
    }
  }, [speed, playing]);

  const currentIndex = currentAyah
    ? ayahs.findIndex((a) => a.numberInSurah === currentAyah.numberInSurah)
    : -1;

  const progressPct =
    ayahs.length > 0 && currentIndex >= 0
      ? Math.round(((currentIndex + 1) / ayahs.length) * 100)
      : 0;

  return (
    <div className="space-y-4 pb-40" dir={isRTL ? "rtl" : "ltr"}>
      {/* Now Playing Card */}
      <div className="rounded-2xl bg-card border border-border/50 shadow-soft overflow-hidden">
        <div className="p-5 text-center">
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">{t("loading")}</p>
            </div>
          ) : currentAyah ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentAyah.numberInSurah}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-center gap-2 mb-3">
                  <span className="text-xs text-muted-foreground">{t("now_playing_verse")}</span>
                  <span className="text-xs font-bold text-primary bg-primary/10 rounded-full px-2 py-0.5">
                    {language === "ar" ? toArabicNumerals(currentAyah.numberInSurah) : currentAyah.numberInSurah}
                  </span>
                </div>
                <p
                  className="font-arabic text-foreground leading-loose mx-auto max-w-sm"
                  style={{ fontSize: 22, lineHeight: 2.2 }}
                  dir="rtl"
                >
                  {stripBismillah(currentAyah.text, surahNumber, currentAyah.numberInSurah)}
                </p>
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="py-6">
              <Volume2 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">{t("listening_hint")}</p>
            </div>
          )}
        </div>

        {/* Progress bar through surah */}
        {isThisSurah && ayahs.length > 0 && (
          <div className="px-5 pb-4">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs text-muted-foreground">{t("reading_progress")}</span>
              <span className="text-xs font-bold text-primary ms-auto">
                {language === "ar" ? toArabicNumerals(progressPct) : progressPct}%
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary"
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <div className="flex justify-between mt-1 text-[0.625rem] text-muted-foreground/60">
              <span>{language === "ar" ? toArabicNumerals(currentIndex + 1) : currentIndex + 1} / {language === "ar" ? toArabicNumerals(ayahs.length) : ayahs.length}</span>
              <span>{surahName}</span>
            </div>
          </div>
        )}

        {/* Play button */}
        <div className="flex justify-center pb-5">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handlePlayPause}
            disabled={loading}
            className="flex h-16 w-16 items-center justify-center rounded-full counter-button text-primary-foreground disabled:opacity-50 shadow-elevated"
          >
            {loading ? (
              <Loader2 className="h-7 w-7 animate-spin" />
            ) : playing ? (
              <Pause className="h-7 w-7" />
            ) : (
              <Play className="h-7 w-7 translate-x-[1px]" />
            )}
          </motion.button>
        </div>
      </div>

      {/* Reciter Selection */}
      <div className="rounded-2xl bg-card border border-border/50 shadow-soft overflow-hidden">
        <button
          onClick={() => setShowReciterPicker((p) => !p)}
          className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">{t("reciter_label")}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground font-arabic">{currentReciter.name}</span>
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", showReciterPicker && "rotate-180")} />
          </div>
        </button>

        <AnimatePresence>
          {showReciterPicker && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="border-t border-border/40 max-h-56 overflow-y-auto divide-y divide-border/30">
                {RECITERS.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setReciterId(r.id);
                      setShowReciterPicker(false);
                      if (isThisSurah) {
                        player.stop();
                      }
                    }}
                    className={cn(
                      "w-full text-start px-4 py-3 text-sm font-arabic hover:bg-muted/40 transition-colors",
                      r.id === reciterId && "text-primary font-semibold bg-primary/5"
                    )}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Playback Speed */}
      <div className="rounded-2xl bg-card border border-border/50 shadow-soft p-4">
        <div className="flex items-center gap-2 mb-3">
          <RotateCcw className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">{t("playback_speed")}</span>
          <span className="ms-auto text-sm font-bold text-primary">{speed}x</span>
        </div>
        <div className="flex gap-2">
          {SPEED_OPTIONS.map((s) => (
            <motion.button
              key={s}
              whileTap={{ scale: 0.92 }}
              onClick={() => setSpeed(s)}
              className={cn(
                "flex-1 rounded-xl py-2.5 text-xs font-bold transition-all",
                speed === s
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              )}
            >
              {s}x
            </motion.button>
          ))}
        </div>
      </div>

      {/* Verse Repeat */}
      <div className="rounded-2xl bg-card border border-border/50 shadow-soft p-4">
        <div className="flex items-center gap-2 mb-3">
          <Repeat1 className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">{t("verse_repeat")}</span>
          <span className="ms-auto text-sm font-bold text-primary">
            {repeatCount === 0
              ? t("repeat_off")
              : `${language === "ar" ? toArabicNumerals(repeatCount) : repeatCount} ${t("repeat_times")}`}
          </span>
        </div>
        <div className="flex gap-2">
          {REPEAT_OPTIONS.map((r) => (
            <motion.button
              key={r}
              whileTap={{ scale: 0.92 }}
              onClick={() => {
                setRepeatCount(r);
                setCurrentRepeat(0);
              }}
              className={cn(
                "flex-1 rounded-xl py-2.5 text-xs font-bold transition-all",
                repeatCount === r
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              )}
            >
              {r === 0 ? t("repeat_off") : (language === "ar" ? toArabicNumerals(r) : r)}
            </motion.button>
          ))}
        </div>
        {repeatCount > 0 && currentRepeat > 0 && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {language === "ar"
              ? `تكرار ${toArabicNumerals(currentRepeat)} من ${toArabicNumerals(repeatCount)}`
              : `Repeat ${currentRepeat} of ${repeatCount}`}
          </p>
        )}
      </div>

      {/* Ayah list for reference */}
      {ayahs.length > 0 && (
        <div className="rounded-2xl bg-card border border-border/50 shadow-soft overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <p className="text-sm font-semibold text-muted-foreground">{t("surah")} · {surahName}</p>
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-border/30">
            {ayahs.map((ayah) => {
              const isCurrent = currentAyah?.numberInSurah === ayah.numberInSurah;
              return (
                <motion.button
                  key={ayah.numberInSurah}
                  onClick={() => {
                    if (isThisSurah) player.seekToAyah(ayah.numberInSurah);
                  }}
                  className={cn(
                    "w-full text-start px-4 py-3 transition-colors",
                    isCurrent ? "bg-primary/10 border-s-2 border-primary" : "hover:bg-muted/30"
                  )}
                >
                  <div className="flex items-start gap-3" dir="rtl">
                    <span className={cn(
                      "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-1",
                      isCurrent ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      {language === "ar" ? toArabicNumerals(ayah.numberInSurah) : ayah.numberInSurah}
                    </span>
                    <p className={cn(
                      "font-arabic text-sm leading-loose flex-1",
                      isCurrent && "text-primary font-semibold"
                    )}>
                      {stripBismillah(ayah.text, surahNumber, ayah.numberInSurah)}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
