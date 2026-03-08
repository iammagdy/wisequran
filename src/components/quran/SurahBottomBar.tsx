import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Download, Loader2, WifiOff, Check, X, Timer } from "lucide-react";
import { resolveAudioSource, downloadSurahAudio } from "@/lib/quran-audio";
import { getAudio } from "@/lib/db";
import { toast } from "sonner";
import { cn, toArabicNumerals } from "@/lib/utils";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { DEFAULT_RECITER, getReciterById } from "@/lib/reciters";

interface Props {
  surahNumber: number;
  surahName: string;
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return toArabicNumerals(`${m}:${sec.toString().padStart(2, "0")}`);
}

const TIMER_PRESETS = [5, 10, 15, 20];

export default function SurahBottomBar({ surahNumber, surahName }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const [reciterId] = useLocalStorage<string>("wise-reciter", DEFAULT_RECITER);

  // Audio state
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [offline, setOffline] = useState(false);
  const [cached, setCached] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [dlProgress, setDlProgress] = useState(0);

  // Timer state
  const [timerActive, setTimerActive] = useState(false);
  const [timerRemaining, setTimerRemaining] = useState(0);
  const [timerTotal, setTimerTotal] = useState(0);
  const [showTimer, setShowTimer] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check cached status
  useEffect(() => {
    getAudio(reciterId, surahNumber).then((r) => setCached(!!r));
  }, [surahNumber, reciterId]);

  // Cleanup audio on unmount or surah change
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    };
  }, [surahNumber]);

  // Media Session API for lock screen controls
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    if (playing) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: surahName,
        artist: getReciterById(reciterId).name,
        album: "القرآن الكريم",
      });
      navigator.mediaSession.setActionHandler("play", () => handlePlayPause());
      navigator.mediaSession.setActionHandler("pause", () => handlePlayPause());
    }

    return () => {
      if ("mediaSession" in navigator) {
        navigator.mediaSession.setActionHandler("play", null);
        navigator.mediaSession.setActionHandler("pause", null);
      }
    };
  }, [playing, surahName]);

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
    if (playing && audioRef.current) {
      audioRef.current.pause();
      setPlaying(false);
      return;
    }

    if (audioRef.current && audioRef.current.src) {
      audioRef.current.play();
      setPlaying(true);
      return;
    }

    setLoading(true);
    setOffline(false);
    const source = await resolveAudioSource(surahNumber);

    if (!source) {
      setOffline(true);
      setLoading(false);
      return;
    }

    const audio = new Audio(source.url);
    if (source.cached) blobUrlRef.current = source.url;
    audioRef.current = audio;

    audio.addEventListener("loadedmetadata", () => {
      setDuration(audio.duration);
      setLoading(false);
    });
    audio.addEventListener("timeupdate", () => setCurrentTime(audio.currentTime));
    audio.addEventListener("ended", () => setPlaying(false));
    audio.addEventListener("error", () => {
      setLoading(false);
      toast.error("تعذر تشغيل الصوت");
    });

    audio.play();
    setPlaying(true);
  }, [playing, surahNumber]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    setDlProgress(0);
    try {
      await downloadSurahAudio(surahNumber, setDlProgress);
      setCached(true);
      toast.success("تم تحميل الصوت للاستخدام بدون إنترنت");
    } catch {
      toast.error("فشل تحميل الصوت");
    }
    setDownloading(false);
  };

  const startTimer = (minutes: number) => {
    const secs = minutes * 60;
    setTimerTotal(secs);
    setTimerRemaining(secs);
    setTimerActive(true);
  };

  const stopTimer = () => {
    setTimerActive(false);
    setTimerRemaining(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50">
      <div className="rounded-t-2xl border-t border-border/50 bg-card/95 backdrop-blur-md shadow-[0_-4px_20px_-4px_hsl(var(--foreground)/0.08)]">
        <div className="px-4 pt-3 pb-1 space-y-2">
          {/* Offline warning */}
          <AnimatePresence>
            {offline && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-center gap-2 rounded-lg bg-muted p-1.5 text-[10px] text-muted-foreground"
                dir="rtl"
              >
                <WifiOff className="h-3 w-3" />
                صوت غير متاح بدون إنترنت — حمّل الصوت أولاً
              </motion.div>
            )}
          </AnimatePresence>

          {/* Row 1: Play + Progress + Time + Timer toggle */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePlayPause}
              disabled={loading}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : playing ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 translate-x-[1px]" />
              )}
            </button>

            <div className="flex flex-1 flex-col gap-0.5 min-w-0">
              {/* Progress track + seek */}
              <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-300"
                  style={{ width: `${pct}%` }}
                />
                <input
                  type="range"
                  min={0}
                  max={duration || 1}
                  value={currentTime}
                  onChange={handleSeek}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground tabular-nums">
                <span>{formatTime(currentTime)}</span>
                <span>{duration > 0 ? formatTime(duration) : "--:--"}</span>
              </div>
            </div>

            {/* Timer toggle */}
            <button
              onClick={() => setShowTimer(!showTimer)}
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors",
                showTimer || timerActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <Timer className="h-4 w-4" />
            </button>
          </div>

          {/* Row 2: Surah name + status + download */}
          <div className="flex items-center justify-between" dir="rtl">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-arabic text-sm font-semibold text-foreground truncate">
                {surahName}
              </span>
              {playing && (
                <span className="text-[10px] text-primary font-medium whitespace-nowrap">
                  تلاوة جارية
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {!cached && !downloading && (
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                >
                  <Download className="h-3 w-3" />
                  تحميل
                </button>
              )}
              {downloading && (
                <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {toArabicNumerals(`${dlProgress}%`)}
                </span>
              )}
              {cached && !downloading && (
                <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                  <Check className="h-3 w-3" />
                  محمّل
                </span>
              )}
            </div>
          </div>

          {/* Timer section (expandable) */}
          <AnimatePresence>
            {showTimer && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="border-t border-border/30 pt-2 pb-0.5">
                  {!timerActive ? (
                    <div className="flex gap-2" dir="rtl">
                      {TIMER_PRESETS.map((m) => (
                        <button
                          key={m}
                          onClick={() => startTimer(m)}
                          className="flex-1 rounded-full bg-muted px-2 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                        >
                          {toArabicNumerals(m)} د
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between" dir="rtl">
                      <div className="flex items-center gap-2">
                        <Timer className="h-3.5 w-3.5 text-primary" />
                        <span className="font-arabic text-sm font-bold tabular-nums text-foreground">
                          {formatTime(timerRemaining)}
                        </span>
                      </div>
                      <button
                        onClick={stopTimer}
                        className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Browser limitation note */}
        <div className="px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <p className="text-center text-[9px] text-muted-foreground/60" dir="rtl">
            قد يتوقف الصوت تلقائياً حسب إعدادات الجهاز والمتصفح
          </p>
        </div>
      </div>
    </div>
  );
}
