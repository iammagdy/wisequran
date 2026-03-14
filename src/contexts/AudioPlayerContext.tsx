import { createContext, useContext, useState, useRef, useCallback, useEffect, type ReactNode } from "react";
import { resolveAudioSource, cachePlayingAudio } from "@/lib/quran-audio";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { DEFAULT_RECITER, getReciterById, getReciterAyahAudioUrl } from "@/lib/reciters";
import { fetchChapterRecitation, findCurrentAyahByTime, type AyahTimestamp } from "@/lib/ayah-timestamps";
import { toast } from "sonner";
import type { Ayah } from "@/lib/quran-api";

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
  play: (surahNumber: number, surahName: string, ayahs?: Ayah[]) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  seek: (time: number) => void;
  seekToAyah: (ayahNumber: number) => void;
  stop: () => void;
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
  const [reciterId] = useLocalStorage<string>("wise-reciter", DEFAULT_RECITER);

  // Ayah timestamp refs for highlighting
  const timestampsRef = useRef<AyahTimestamp[]>([]);
  const ayahsRef = useRef<Ayah[]>([]);
  const stoppedRef = useRef(false);

  const [state, setState] = useState<AudioPlayerState>(INITIAL_STATE);

  const cleanupBlobUrl = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
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

    const handlePlay = () => {
      audioRef.current?.play();
    };
    const handlePause = () => {
      audioRef.current?.pause();
    };

    navigator.mediaSession.setActionHandler("play", handlePlay);
    navigator.mediaSession.setActionHandler("pause", handlePause);

    return () => {
      if ("mediaSession" in navigator) {
        navigator.mediaSession.setActionHandler("play", null);
        navigator.mediaSession.setActionHandler("pause", null);
      }
    };
  }, [state.playing, state.surahName, state.playingReciterId]);

  const setupAudioListeners = useCallback((audio: HTMLAudioElement) => {
    audio.addEventListener("loadedmetadata", () => {
      setState((s) => ({ ...s, duration: audio.duration, loading: false }));
    });
    audio.addEventListener("timeupdate", () => {
      const currentTime = audio.currentTime;
      const timestamps = timestampsRef.current;

      // Update ayah highlighting if we have timestamps
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
    });
    audio.addEventListener("error", () => {
      setState((s) => ({ ...s, loading: false }));
      toast.error("تعذر تشغيل الصوت");
    });
  }, []);

  const play = useCallback(async (surahNumber: number, surahName: string, ayahs?: Ayah[]) => {
    stoppedRef.current = false;
    ayahsRef.current = ayahs || [];
    timestampsRef.current = [];

    // Resume if same surah
    if (audioRef.current && state.surahNumber === surahNumber) {
      audioRef.current.play();
      setState((s) => ({ ...s, playing: true }));
      return;
    }

    audioRef.current?.pause();
    audioRef.current = null;
    cleanupBlobUrl();

    // Create Audio element IMMEDIATELY to preserve user gesture context
    const audio = new Audio();
    audioRef.current = audio;
    setupAudioListeners(audio);
    // Silent unlock for iOS/Safari — ignore the expected error
    audio.play().catch(() => {});

    setState((s) => ({
      ...s,
      surahNumber,
      surahName,
      loading: true,
      offline: false,
      currentTime: 0,
      duration: 0,
      playingReciterId: reciterId,
      currentAyahNumber: null,
      currentAyahInSurah: null,
      isAyahMode: false,
      currentAyahIndex: 0,
      totalAyahs: 0,
    }));

    // Try to get QF API data (audio URL + timestamps) for supported reciters
    let audioUrl: string | null = null;

    try {
      const qfData = await fetchChapterRecitation(reciterId, surahNumber);
      if (qfData) {
        timestampsRef.current = qfData.timestamps;
        audioUrl = qfData.audioUrl;
        setState((s) => ({ ...s, totalAyahs: qfData.timestamps.length }));
      }
    } catch {
      // QF API failed, fall back to normal source
    }

    // If no QF audio URL, use the regular source
    if (!audioUrl) {
      const source = await resolveAudioSource(reciterId, surahNumber);
      if (!source) {
        setState((s) => ({ ...s, offline: true, loading: false }));
        audioRef.current = null;
        return;
      }
      audioUrl = source.url;
      if (source.cached) blobUrlRef.current = source.url;
    }

    if (stoppedRef.current) {
      audioRef.current = null;
      return;
    }

    // Now set the src and play using the already-unlocked audio element
    audio.src = audioUrl;
    try {
      await audio.play();
      setState((s) => ({ ...s, playing: true }));
      // Auto-cache in background (Spotify-like)
      if (!blobUrlRef.current && audioUrl) {
        cachePlayingAudio(reciterId, surahNumber, audioUrl).catch(() => {});
      }
      return;
    } catch {
      // Primary source failed, try fallback
    }

    // Fallback: try resolveAudioSource (uses CUSTOM_CDN)
    const fallback = await resolveAudioSource(reciterId, surahNumber);
    if (fallback) {
      if (fallback.cached) blobUrlRef.current = fallback.url;
      audio.src = fallback.url;
      try {
        await audio.play();
        setState((s) => ({ ...s, playing: true }));
        if (!fallback.cached) {
          cachePlayingAudio(reciterId, surahNumber, fallback.url).catch(() => {});
        }
        return;
      } catch {
        // Fallback also failed
      }
    }

    audioRef.current = null;
    setState((s) => ({ ...s, loading: false }));
  }, [state.surahNumber, reciterId, cleanupBlobUrl, setupAudioListeners]);

  const togglePlayPause = useCallback(async () => {
    if (!audioRef.current) return;

    if (state.playing) {
      audioRef.current.pause();
      setState((s) => ({ ...s, playing: false }));
    } else {
      audioRef.current.play();
      setState((s) => ({ ...s, playing: true }));
    }
  }, [state.playing]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setState((s) => ({ ...s, currentTime: time }));
    }
  }, []);

  const stop = useCallback(() => {
    stoppedRef.current = true;
    audioRef.current?.pause();
    audioRef.current = null;
    cleanupBlobUrl();
    timestampsRef.current = [];
    ayahsRef.current = [];
    setState(INITIAL_STATE);
  }, [cleanupBlobUrl]);

  const seekToAyah = useCallback((ayahNumber: number) => {
    const ts = timestampsRef.current.find((t) => t.numberInSurah === ayahNumber);
    if (ts && audioRef.current) {
      const timeInSeconds = ts.from / 1000;
      audioRef.current.currentTime = timeInSeconds;
      setState((s) => ({ ...s, currentTime: timeInSeconds }));
    }
  }, []);

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
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
}
