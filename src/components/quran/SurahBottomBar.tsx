import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Download, Loader2, WifiOff, Check, X, Timer } from "lucide-react";
import { downloadSurahAudio, formatBytes } from "@/lib/quran-audio";
import { getAudio } from "@/lib/db";
import { toast } from "sonner";
import { cn, toArabicNumerals } from "@/lib/utils";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { getReciterById } from "@/lib/reciters";
import type { Ayah } from "@/lib/quran-api";

interface Props {
  surahNumber: number;
  surahName: string;
  ayahs?: Ayah[];
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return toArabicNumerals(`${m}:${sec.toString().padStart(2, "0")}`);
}

const TIMER_PRESETS = [5, 10, 15, 20];

export default function SurahBottomBar({ surahNumber, surahName, ayahs }: Props) {
  const player = useAudioPlayer();
  const isThisSurah = player.surahNumber === surahNumber;

  // Download state
  const [cached, setCached] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [dlProgress, setDlProgress] = useState(0);

  // Timer state
  const [timerActive, setTimerActive] = useState(false);
  const [timerRemaining, setTimerRemaining] = useState(0);
  const [showTimer, setShowTimer] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check cached status
  useEffect(() => {
    getAudio(player.reciterId, surahNumber).then((r) => setCached(!!r));
  }, [surahNumber, player.reciterId]);

  // Timer logic
  useEffect(() => {
    if (!timerActive) return;
    timerRef.current = setInterval(() => {
      setTimerRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          setTimerActive(false);
          toast("انتهى وقت القراءة 📖", { duration: 5000 });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive]);

  const handlePlayPause = useCallback(async () => {
    if (isThisSurah) {
      player.togglePlayPause();
    } else {
      player.play(surahNumber, surahName, ayahs);
    }
  }, [isThisSurah, surahNumber, surahName, ayahs, player]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    player.seek(val);
  };

  const handleDownload = async () => {
    setDownloading(true);
    setDlProgress(0);
    try {
      const size = await downloadSurahAudio(player.reciterId, surahNumber, setDlProgress);
      // Verify actually saved
      const check = await getAudio(player.reciterId, surahNumber);
      if (check && check.data.byteLength > 1024) {
        setCached(true);
        toast.success(`تم تحميل الصوت (${formatBytes(size)})`);
      } else {
        toast.error("فشل حفظ الصوت — حاول مرة أخرى");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل تحميل الصوت");
    }
    setDownloading(false);
  };

  const startTimer = (minutes: number) => {
    const secs = minutes * 60;
    setTimerRemaining(secs);
    setTimerActive(true);
  };

  const stopTimer = () => {
    setTimerActive(false);
    setTimerRemaining(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const playing = isThisSurah && player.playing;
  const loading = isThisSurah && player.loading;
  const currentTime = isThisSurah ? player.currentTime : 0;
  const duration = isThisSurah ? player.duration : 0;
  const offline = isThisSurah && player.offline;
  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-above-nav inset-x-0 z-50 px-3">
      <div className="rounded-t-2xl glass-card shadow-elevated-lg overflow-hidden">
        <div className="px-4 pt-4 pb-2 space-y-3">
          {/* Offline warning */}
          <AnimatePresence>
            {offline && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-center gap-2 rounded-xl bg-muted p-2 text-[0.625rem] text-muted-foreground"
                dir="rtl"
              >
                <WifiOff className="h-3 w-3" />
                صوت غير متاح بدون إنترنت — حمّل الصوت أولاً
              </motion.div>
            )}
          </AnimatePresence>

          {/* Row 1: Play + Progress + Time + Timer toggle */}
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handlePlayPause}
              disabled={loading}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full counter-button text-primary-foreground disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : playing ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 translate-x-[1px]" />
              )}
            </motion.button>

            <div className="flex flex-1 flex-col gap-1 min-w-0">
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="absolute inset-y-0 right-0 rounded-full bg-gradient-to-l from-primary to-primary/70"
                  style={{ width: `${pct}%` }}
                  transition={{ duration: 0.3 }}
                />
                <input
                    type="range"
                    min={0}
                    max={duration || 1}
                    value={currentTime}
                    onChange={handleSeek}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    dir="rtl"
                  />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground tabular-nums" dir="rtl">
                <span>{formatTime(currentTime)}</span>
                <span>{duration > 0 ? formatTime(duration) : "--:--"}</span>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowTimer(!showTimer)}
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all",
                showTimer || timerActive
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <Timer className="h-4 w-4" />
            </motion.button>
          </div>

          {/* Row 2: Surah name + reciter + status + download */}
          <div className="flex items-center justify-between" dir="rtl">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-arabic text-sm font-bold text-foreground truncate">
                {surahName}
              </span>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                {getReciterById(player.surahNumber === surahNumber ? player.playingReciterId : player.reciterId).name}
              </span>
              {playing && (
                <span className="text-[10px] text-primary font-semibold whitespace-nowrap flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-glow-pulse" />
                  تلاوة جارية
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {!cached && !downloading && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-[10px] font-semibold text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                >
                  <Download className="h-3 w-3" />
                  تحميل
                </motion.button>
              )}
              {downloading && (
                <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-[10px] text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {toArabicNumerals(`${dlProgress}%`)}
                </span>
              )}
              {cached && !downloading && (
                <span className="flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1.5 text-[10px] font-semibold text-primary">
                  <Check className="h-3 w-3" />
                  محمّل
                </span>
              )}
            </div>
          </div>

          {/* Timer section */}
          <AnimatePresence>
            {showTimer && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="border-t border-border/30 pt-3">
                  {!timerActive ? (
                    <div className="flex gap-2" dir="rtl">
                      {TIMER_PRESETS.map((m) => (
                        <motion.button
                          key={m}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => startTimer(m)}
                          className="flex-1 rounded-xl bg-muted px-2 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                        >
                          {toArabicNumerals(m)} د
                        </motion.button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between" dir="rtl">
                      <div className="flex items-center gap-2">
                        <Timer className="h-4 w-4 text-primary" />
                        <span className="font-arabic text-base font-bold tabular-nums text-foreground">
                          {formatTime(timerRemaining)}
                        </span>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={stopTimer}
                        className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted"
                      >
                        <X className="h-4 w-4" />
                      </motion.button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="px-4 pb-2">
          <p className="text-center text-[9px] text-muted-foreground/50" dir="rtl">
            قد يتوقف الصوت تلقائياً حسب إعدادات الجهاز والمتصفح
          </p>
        </div>
      </div>
    </div>
  );
}
