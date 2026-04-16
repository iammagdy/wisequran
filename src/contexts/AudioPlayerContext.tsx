import { createContext, useContext, useState, useRef, useCallback, useEffect, useMemo, type ReactNode } from "react";
import { resolveAudioSource, cachePlayingAudio } from "@/lib/quran-audio";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { DEFAULT_RECITER, getReciterById, getReciterAyahAudioUrl, getReciterAudioUrls } from "@/lib/reciters";
import { fetchChapterRecitation, findCurrentAyahByTime, type AyahTimestamp } from "@/lib/ayah-timestamps";
import { SURAH_META } from "@/data/surah-meta";
import { toast } from "sonner";
import type { Ayah } from "@/lib/quran-api";
import { mobileAudioManager } from "@/lib/mobile-audio";

interface AudioPlayerStableState {
  surahNumber: number | null;
  surahName: string;
  playing: boolean;
  loading: boolean;
  offline: boolean;
  playingReciterId: string;
  currentAyahNumber: number | null;
  isAyahMode: boolean;
  currentAyahIndex: number;
  totalAyahs: number;
}

interface AudioPlayerVolatileState {
  currentTime: number;
  duration: number;
  currentAyahInSurah: number | null;
}

interface AudioPlayerActions {
  reciterId: string;
  play: (surahNumber: number, surahName: string, ayahs?: Ayah[]) => void;
  togglePlayPause: () => Promise<void>;
  seek: (time: number) => void;
  seekToAyah: (ayahNumber: number) => void;
  stop: () => void;
  setPlaybackRate: (rate: number) => void;
  setOnAyahEnded: (cb: (() => void) | null) => void;
  playNextSurah: () => Promise<void>;
  playPreviousSurah: () => Promise<void>;
  hasPrev: boolean;
  hasNext: boolean;
}

type AudioPlayerStateContextType = AudioPlayerStableState & AudioPlayerActions;
type AudioPlayerTimeContextType = AudioPlayerVolatileState;
type AudioPlayerContextType = AudioPlayerStateContextType & AudioPlayerTimeContextType;

const AudioPlayerStateContext = createContext<AudioPlayerStateContextType | null>(null);
const AudioPlayerTimeContext = createContext<AudioPlayerTimeContextType>({
  currentTime: 0,
  duration: 0,
  currentAyahInSurah: null,
});
// Separate ayah-only context so components that only need currentAyahInSurah
// (e.g. SurahReaderPage, ListeningTab) are NOT re-rendered on every 250ms
// timeupdate tick. This context updates only when the ayah number changes.
const AudioPlayerAyahContext = createContext<{ currentAyahInSurah: number | null }>({
  currentAyahInSurah: null,
});

export function useAudioPlayerState() {
  const ctx = useContext(AudioPlayerStateContext);
  if (!ctx) throw new Error("useAudioPlayerState must be used within AudioPlayerProvider");
  return ctx;
}

export function useAudioPlayerTime() {
  return useContext(AudioPlayerTimeContext);
}

export function useAudioPlayerAyah() {
  return useContext(AudioPlayerAyahContext);
}

export function useAudioPlayer(): AudioPlayerContextType {
  const state = useAudioPlayerState();
  const time = useAudioPlayerTime();
  return { ...state, ...time };
}

const INITIAL_STABLE: AudioPlayerStableState = {
  surahNumber: null,
  surahName: "",
  playing: false,
  loading: false,
  offline: false,
  playingReciterId: DEFAULT_RECITER,
  currentAyahNumber: null,
  isAyahMode: false,
  currentAyahIndex: 0,
  totalAyahs: 0,
};

const INITIAL_VOLATILE: AudioPlayerVolatileState = {
  currentTime: 0,
  duration: 0,
  currentAyahInSurah: null,
};

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const onAyahEndedRef = useRef<(() => void) | null>(null);
  const [reciterId] = useLocalStorage<string>("wise-reciter", DEFAULT_RECITER);

  const reciterIdRef = useRef(reciterId);
  const surahNumberRef = useRef<number | null>(null);

  const timestampsRef = useRef<AyahTimestamp[]>([]);
  const ayahsRef = useRef<Ayah[]>([]);
  const stoppedRef = useRef(false);
  const lastTimeUpdateRef = useRef(0);
  const isVisibleRef = useRef(true);

  const [stableState, setStableState] = useState<AudioPlayerStableState>(INITIAL_STABLE);
  const [volatileState, setVolatileState] = useState<AudioPlayerVolatileState>(INITIAL_VOLATILE);
  const [ayahState, setAyahState] = useState<{ currentAyahInSurah: number | null }>({ currentAyahInSurah: null });

  useEffect(() => {
    reciterIdRef.current = reciterId;
  }, [reciterId]);

  useEffect(() => {
    const handleVisibility = () => {
      const visible = document.visibilityState === "visible";
      isVisibleRef.current = visible;
      if (visible) {
        // Force an immediate timeupdate on return so the progress bar syncs at once.
        lastTimeUpdateRef.current = 0;
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const cleanupBlobUrl = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      mobileAudioManager.stop("quran", true);
      audioRef.current = null;
      cleanupBlobUrl();
    };
  }, [cleanupBlobUrl]);

  useEffect(() => {
    if (!("mediaSession" in navigator) || !stableState.playing) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: stableState.surahName,
      artist: getReciterById(stableState.playingReciterId).name,
      album: "القرآن الكريم",
    });

    const handlePlay = () => { mobileAudioManager.play("quran").catch(() => {}); };
    const handlePause = () => { audioRef.current?.pause(); };

    navigator.mediaSession.setActionHandler("play", handlePlay);
    navigator.mediaSession.setActionHandler("pause", handlePause);

    return () => {
      if ("mediaSession" in navigator) {
        navigator.mediaSession.setActionHandler("play", null);
        navigator.mediaSession.setActionHandler("pause", null);
      }
    };
  }, [stableState.playing, stableState.surahName, stableState.playingReciterId]);

  const fallbackUrlsRef = useRef<string[]>([]);
  const fallbackIndexRef = useRef(0);
  const activeSurahForRetryRef = useRef<number | null>(null);
  const activeReciterForRetryRef = useRef<string>("");
  const sourceSetRef = useRef(false);

  const setupAudioListeners = useCallback((audio: HTMLAudioElement) => {
    audio.addEventListener("loadedmetadata", () => {
      setStableState((s) => ({ ...s, loading: false }));
      setVolatileState((s) => ({ ...s, duration: audio.duration }));
    });
    audio.addEventListener("timeupdate", () => {
      if (!isVisibleRef.current) return;
      const now = Date.now();
      if (now - lastTimeUpdateRef.current < 250) return;
      lastTimeUpdateRef.current = now;

      const currentTime = audio.currentTime;
      const timestamps = timestampsRef.current;

      let ayahInSurah: number | null = null;
      if (timestamps.length > 0) {
        ayahInSurah = findCurrentAyahByTime(timestamps, currentTime * 1000);
      }

      setVolatileState((s) => ({
        ...s,
        currentTime,
        currentAyahInSurah: ayahInSurah,
      }));
      setAyahState((prev) =>
        prev.currentAyahInSurah === ayahInSurah ? prev : { currentAyahInSurah: ayahInSurah }
      );
    });
    audio.addEventListener("ended", () => {
      setStableState((s) => ({ ...s, playing: false }));
      setVolatileState((s) => ({ ...s, currentAyahInSurah: null }));
      setAyahState({ currentAyahInSurah: null });
      onAyahEndedRef.current?.();
    });
    audio.addEventListener("error", () => {
      if (!sourceSetRef.current) return;

      const nextIndex = fallbackIndexRef.current;
      const fallbacks = fallbackUrlsRef.current;

      if (nextIndex < fallbacks.length && audioRef.current === audio) {
        const nextUrl = fallbacks[nextIndex];
        fallbackIndexRef.current = nextIndex + 1;
        mobileAudioManager.play("quran", nextUrl, { forceLoad: true }).catch(() => {});
        return;
      }

      setStableState((s) => ({ ...s, loading: false }));
      toast.error("تعذر تشغيل الصوت. يرجى المحاولة مرة أخرى.");
    });
    audio.addEventListener("pause", () => {
      setStableState((s) => ({ ...s, playing: false }));
    });
    audio.addEventListener("play", () => {
      setStableState((s) => ({ ...s, playing: true, loading: false }));
    });
  }, []);

  const play = useCallback((surahNumber: number, surahName: string, ayahs?: Ayah[]) => {
    stoppedRef.current = false;
    const currentReciterId = reciterIdRef.current;

    if (audioRef.current && surahNumberRef.current === surahNumber) {
      audioRef.current.play().catch(() => {});
      return;
    }

    audioRef.current?.pause();
    cleanupBlobUrl();

    surahNumberRef.current = surahNumber;
    ayahsRef.current = ayahs || [];
    timestampsRef.current = [];

    let audio = audioRef.current;
    if (!audio) {
      audio = mobileAudioManager.getAudio("quran");
      audioRef.current = audio;
      setupAudioListeners(audio);
    }

    const primePromise = mobileAudioManager.prime("quran");

    setStableState(() => ({
      ...INITIAL_STABLE,
      surahNumber,
      surahName,
      loading: true,
      playingReciterId: currentReciterId,
    }));
    setVolatileState(INITIAL_VOLATILE);
    setAyahState({ currentAyahInSurah: null });

    const loadAndPlay = async () => {
      try {
        await primePromise;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'NotAllowedError') {
          setStableState((s) => ({ ...s, loading: false }));
          toast.error("يحتاج المتصفح إلى التفاعل لتشغيل الصوت. يرجى الضغط على زر التشغيل مرة أخرى.");
        }
        return;
      }

      if (surahNumberRef.current !== surahNumber || stoppedRef.current) return;

      activeSurahForRetryRef.current = surahNumber;
      activeReciterForRetryRef.current = currentReciterId;
      sourceSetRef.current = false;

      let primaryUrl: string | null = null;
      try {
        const qfData = await fetchChapterRecitation(currentReciterId, surahNumber);
        if (qfData) {
          timestampsRef.current = qfData.timestamps;
          primaryUrl = qfData.audioUrl;
          setStableState((s) => ({ ...s, totalAyahs: qfData.timestamps.length }));
        }
      } catch {/* fallback */}

      if (!primaryUrl) {
        const cached = await resolveAudioSource(currentReciterId, surahNumber);
        if (cached?.cached) {
          primaryUrl = cached.url;
          blobUrlRef.current = cached.url;
        }
      }

      if (stoppedRef.current) return;

      const allUrls = await getReciterAudioUrls(currentReciterId, surahNumber);
      if (!primaryUrl && !navigator.onLine) {
        setStableState((s) => ({ ...s, offline: true, loading: false }));
        return;
      }

      const orderedUrls: string[] = [];
      if (primaryUrl) orderedUrls.push(primaryUrl);
      allUrls.forEach(u => !orderedUrls.includes(u) && orderedUrls.push(u));

      if (orderedUrls.length === 0) {
        setStableState((s) => ({ ...s, offline: true, loading: false }));
        return;
      }

      fallbackUrlsRef.current = orderedUrls.slice(1);
      fallbackIndexRef.current = 0;
      sourceSetRef.current = true;

      if (audioRef.current) {
        try {
          await mobileAudioManager.play("quran", orderedUrls[0], { forceLoad: true });
          if (!blobUrlRef.current) {
            cachePlayingAudio(currentReciterId, surahNumber, orderedUrls[0]).catch(() => {});
          }
        } catch (error) {
          setStableState((s) => ({ ...s, loading: false }));
        }
      }
    };

    loadAndPlay();

  }, [cleanupBlobUrl, setupAudioListeners]);

  const togglePlayPause = useCallback(async () => {
    if (!audioRef.current) return;

    if (!audioRef.current.paused) {
      audioRef.current.pause();
    } else {
      await mobileAudioManager.play("quran");
    }
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setVolatileState((s) => ({ ...s, currentTime: time }));
    }
  }, []);

  const stop = useCallback(() => {
    stoppedRef.current = true;
    surahNumberRef.current = null;
    mobileAudioManager.stop("quran", true);
    audioRef.current = null;
    cleanupBlobUrl();
    timestampsRef.current = [];
    ayahsRef.current = [];
    setStableState(INITIAL_STABLE);
    setVolatileState(INITIAL_VOLATILE);
    setAyahState({ currentAyahInSurah: null });
  }, [cleanupBlobUrl]);

  const setPlaybackRate = useCallback((rate: number) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  }, []);

  const setOnAyahEnded = useCallback((cb: (() => void) | null) => {
    onAyahEndedRef.current = cb;
  }, []);

  const seekToAyah = useCallback((ayahNumber: number) => {
    const ts = timestampsRef.current.find((t) => t.numberInSurah === ayahNumber);
    if (ts && audioRef.current) {
      const timeInSeconds = ts.from / 1000;
      audioRef.current.currentTime = timeInSeconds;
      setVolatileState((s) => ({ ...s, currentTime: timeInSeconds }));
    }
  }, []);

  const playNextSurah = useCallback(() => {
    const current = surahNumberRef.current;
    if (!current || current >= 114) return;
    const next = SURAH_META[current];
    if (next) {
      play(next.number, next.name);
    }
  }, [play]);

  const playPreviousSurah = useCallback(() => {
    const current = surahNumberRef.current;
    if (!current || current <= 1) return;
    const prev = SURAH_META[current - 2];
    if (prev) {
      play(prev.number, prev.name);
    }
  }, [play]);

  const hasPrev = stableState.surahNumber !== null && stableState.surahNumber > 1;
  const hasNext = stableState.surahNumber !== null && stableState.surahNumber < 114;

  const stableContextValue = useMemo<AudioPlayerStateContextType>(
    () => ({
      ...stableState,
      reciterId,
      play,
      togglePlayPause,
      seek,
      seekToAyah,
      stop,
      setPlaybackRate,
      setOnAyahEnded,
      playNextSurah,
      playPreviousSurah,
      hasPrev,
      hasNext,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stableState, reciterId, play, togglePlayPause, seek, seekToAyah, stop, setPlaybackRate, setOnAyahEnded, playNextSurah, playPreviousSurah, hasPrev, hasNext]
  );

  return (
    <AudioPlayerStateContext.Provider value={stableContextValue}>
      <AudioPlayerAyahContext.Provider value={ayahState}>
        <AudioPlayerTimeContext.Provider value={volatileState}>
          {children}
        </AudioPlayerTimeContext.Provider>
      </AudioPlayerAyahContext.Provider>
    </AudioPlayerStateContext.Provider>
  );
}
