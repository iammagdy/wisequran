import { createContext, useContext, useState, useRef, useCallback, useEffect, type ReactNode } from "react";
import { resolveAudioSource, cachePlayingAudio } from "@/lib/quran-audio";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { DEFAULT_RECITER, getReciterById, getReciterAyahAudioUrl, getReciterAudioUrls } from "@/lib/reciters";
import { fetchChapterRecitation, findCurrentAyahByTime, type AyahTimestamp } from "@/lib/ayah-timestamps";
import { SURAH_META } from "@/data/surah-meta";
import { toast } from "sonner";
import type { Ayah } from "@/lib/quran-api";
import { mobileAudioManager } from "@/lib/mobile-audio";

interface AudioPlayerState {
  surahNumber: number | null;
  surahName: string;
  playing: boolean;
  currentTime: number;
  duration: number;
  loading: boolean;
  offline: boolean;
  playingReciterId: string;
  currentAyahNumber: number | null;
  currentAyahInSurah: number | null;
  isAyahMode: boolean;
  currentAyahIndex: number;
  totalAyahs: number;
}

interface AudioPlayerContextType extends AudioPlayerState {
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

const AudioPlayerContext = createContext<AudioPlayerContextType | null>(null);

export function useAudioPlayer() {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx) throw new Error("useAudioPlayer must be used within AudioPlayerProvider");
  return ctx;
}

const INITIAL_STATE: AudioPlayerState = {
  surahNumber: null,
  surahName: "",
  playing: false,
  currentTime: 0,
  duration: 0,
  loading: false,
  offline: false,
  playingReciterId: DEFAULT_RECITER,
  currentAyahNumber: null,
  currentAyahInSurah: null,
  isAyahMode: false,
  currentAyahIndex: 0,
  totalAyahs: 0,
};

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const onAyahEndedRef = useRef<(() => void) | null>(null);
  const [reciterId] = useLocalStorage<string>("wise-reciter", DEFAULT_RECITER);

  // Use refs so callbacks always have latest values without re-memoizing
  const reciterIdRef = useRef(reciterId);
  const surahNumberRef = useRef<number | null>(null);

  const timestampsRef = useRef<AyahTimestamp[]>([]);
  const ayahsRef = useRef<Ayah[]>([]);
  const stoppedRef = useRef(false);

  const [state, setState] = useState<AudioPlayerState>(INITIAL_STATE);

  // Keep refs in sync with latest values
  useEffect(() => {
    reciterIdRef.current = reciterId;
  }, [reciterId]);

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

  // Media Session API
  useEffect(() => {
    if (!("mediaSession" in navigator) || !state.playing) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: state.surahName,
      artist: getReciterById(state.playingReciterId).name,
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
  }, [state.playing, state.surahName, state.playingReciterId]);

  const fallbackUrlsRef = useRef<string[]>([]);
  const fallbackIndexRef = useRef(0);
  const activeSurahForRetryRef = useRef<number | null>(null);
  const activeReciterForRetryRef = useRef<string>("");
  const sourceSetRef = useRef(false);

  const setupAudioListeners = useCallback((audio: HTMLAudioElement) => {
    audio.addEventListener("loadedmetadata", () => {
      setState((s) => ({ ...s, duration: audio.duration, loading: false }));
    });
    audio.addEventListener("timeupdate", () => {
      const currentTime = audio.currentTime;
      const timestamps = timestampsRef.current;

      let ayahInSurah: number | null = null;
      if (timestamps.length > 0) {
        ayahInSurah = findCurrentAyahByTime(timestamps, currentTime * 1000);
      }

      setState((s) => ({
        ...s,
        currentTime,
        currentAyahInSurah: ayahInSurah,
      }));
    });
    audio.addEventListener("ended", () => {
      setState((s) => ({ ...s, playing: false, currentAyahInSurah: null }));
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

      setState((s) => ({ ...s, loading: false }));
      toast.error("تعذر تشغيل الصوت. يرجى المحاولة مرة أخرى.");
    });
    // Sync playing state if browser pauses audio (e.g. interruption)
    audio.addEventListener("pause", () => {
      setState((s) => ({ ...s, playing: false }));
    });
    audio.addEventListener("play", () => {
      setState((s) => ({ ...s, playing: true, loading: false }));
    });
  }, []);

  const play = useCallback((surahNumber: number, surahName: string, ayahs?: Ayah[]) => {
    stoppedRef.current = false;
    const currentReciterId = reciterIdRef.current;

    // Resume playback only when the same surah AND the same reciter are already loaded.
    // If the reciter changed we must reload even if the surah number matches.
    if (
      audioRef.current &&
      surahNumberRef.current === surahNumber &&
      activeReciterForRetryRef.current === currentReciterId
    ) {
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

    setState((s) => ({
      ...INITIAL_STATE,
      surahNumber,
      surahName,
      loading: true,
      playingReciterId: currentReciterId,
    }));

    const loadAndPlay = async () => {
      try {
        await primePromise;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'NotAllowedError') {
          setState((s) => ({ ...s, loading: false }));
          toast.error("يحتاج المتصفح إلى التفاعل لتشغيل الصوت. يرجى الضغط على زر التشغيل مرة أخرى.");
        }
        return;
      }
      
      // If another play request has started, abort this one
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
          setState((s) => ({ ...s, totalAyahs: qfData.timestamps.length }));
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
        setState((s) => ({ ...s, offline: true, loading: false }));
        return;
      }

      const orderedUrls: string[] = [];
      if (primaryUrl) orderedUrls.push(primaryUrl);
      allUrls.forEach(u => !orderedUrls.includes(u) && orderedUrls.push(u));

      if (orderedUrls.length === 0) {
        setState((s) => ({ ...s, offline: true, loading: false }));
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
          setState((s) => ({ ...s, loading: false }));
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
      setState((s) => ({ ...s, currentTime: time }));
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
    setState(INITIAL_STATE);
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
      setState((s) => ({ ...s, currentTime: timeInSeconds }));
    }
  }, []);

  const playNextSurah = useCallback(() => {
    const current = surahNumberRef.current;
    if (!current || current >= 114) return;
    const next = SURAH_META[current]; // index is surahNumber (1-based), so index = current gives next surah
    if (next) {
      play(next.number, next.name);
    }
  }, [play]);

  const playPreviousSurah = useCallback(() => {
    const current = surahNumberRef.current;
    if (!current || current <= 1) return;
    const prev = SURAH_META[current - 2]; // index current-2 gives previous surah
    if (prev) {
      play(prev.number, prev.name);
    }
  }, [play]);

  const hasPrev = state.surahNumber !== null && state.surahNumber > 1;
  const hasNext = state.surahNumber !== null && state.surahNumber < 114;

  return (
    <AudioPlayerContext.Provider
      value={{
        ...state,
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
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
}
