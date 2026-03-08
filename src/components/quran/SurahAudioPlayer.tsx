import { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Play, Pause, Download, Loader2, WifiOff, Check } from "lucide-react";
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

  useEffect(() => {
    getAudio(surahNumber).then((r) => setCached(!!r));
  }, [surahNumber]);

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

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {offline && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-center gap-2 rounded-lg bg-muted p-2 text-xs text-muted-foreground"
            dir="rtl"
          >
            <WifiOff className="h-3.5 w-3.5" />
            صوت غير متاح بدون إنترنت — حمّل الصوت أولاً
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compact recitation bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={handlePlayPause}
          disabled={loading}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-all hover:bg-primary hover:text-primary-foreground active:scale-95 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : playing ? (
            <Pause className="h-3.5 w-3.5" />
          ) : (
            <Play className="h-3.5 w-3.5 translate-x-[1px]" />
          )}
        </button>

        <div className="flex flex-1 flex-col gap-0.5">
          {/* Progress track */}
          <div className="relative h-1 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          {/* Seekbar (invisible, overlaid) */}
          <input
            type="range"
            min={0}
            max={duration || 1}
            value={currentTime}
            onChange={handleSeek}
            className="absolute inset-0 h-1 w-full cursor-pointer opacity-0"
            style={{ position: "relative", marginTop: "-4px" }}
          />
          <div className="flex justify-between text-[10px] text-muted-foreground tabular-nums">
            <span>{formatTime(currentTime)}</span>
            <span>{duration > 0 ? formatTime(duration) : "--:--"}</span>
          </div>
        </div>

        {/* Download badge */}
        {!cached && !downloading && (
          <button
            onClick={handleDownload}
            className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
          >
            <Download className="h-3 w-3" />
            تحميل
          </button>
        )}
        {downloading && (
          <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[10px] text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            {dlProgress}%
          </span>
        )}
        {cached && !downloading && (
          <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-medium text-primary">
            <Check className="h-3 w-3" />
            محمّل
          </span>
        )}
      </div>
    </div>
  );
}
