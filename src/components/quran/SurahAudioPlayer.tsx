import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Download, Loader2, WifiOff, Volume2 } from "lucide-react";
import { resolveAudioSource, downloadSurahAudio } from "@/lib/quran-audio";
import { getAudio } from "@/lib/db";
import { toast } from "sonner";

interface Props {
  surahNumber: number;
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function SurahAudioPlayer({ surahNumber }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [offline, setOffline] = useState(false);
  const [cached, setCached] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [dlProgress, setDlProgress] = useState(0);

  // Check cache status on mount
  useEffect(() => {
    getAudio(surahNumber).then((r) => setCached(!!r));
  }, [surahNumber]);

  // Cleanup blob URLs and audio on unmount / surah change
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    };
  }, [surahNumber]);

  const handlePlayPause = useCallback(async () => {
    if (playing && audioRef.current) {
      audioRef.current.pause();
      setPlaying(false);
      return;
    }

    // If we already have an audio element ready, just resume
    if (audioRef.current && audioRef.current.src) {
      audioRef.current.play();
      setPlaying(true);
      return;
    }

    // Resolve source
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

  return (
    <div className="rounded-xl bg-card p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between" dir="rtl">
        <div className="flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">الاستماع</span>
        </div>

        {!cached && !downloading && (
          <button
            onClick={handleDownload}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
          >
            <Download className="h-3.5 w-3.5" />
            تحميل
          </button>
        )}
        {downloading && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {dlProgress}%
          </span>
        )}
        {cached && !downloading && (
          <span className="text-xs text-primary">✓ محمّل</span>
        )}
      </div>

      <AnimatePresence>
        {offline && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-2 flex items-center justify-center gap-2 rounded-lg bg-muted p-2 text-xs text-muted-foreground"
            dir="rtl"
          >
            <WifiOff className="h-3.5 w-3.5" />
            صوت غير متاح بدون إنترنت — حمّل الصوت أولاً
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-3">
        <button
          onClick={handlePlayPause}
          disabled={loading}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform active:scale-95 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : playing ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 translate-x-[1px]" />
          )}
        </button>

        <div className="flex flex-1 flex-col gap-1">
          <input
            type="range"
            min={0}
            max={duration || 1}
            value={currentTime}
            onChange={handleSeek}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground tabular-nums">
            <span>{formatTime(currentTime)}</span>
            <span>{duration > 0 ? formatTime(duration) : "--:--"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
