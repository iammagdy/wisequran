import { createContext, useContext, useState, useRef, useCallback, useEffect, type ReactNode } from "react";
import { resolveAudioSource } from "@/lib/quran-audio";
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
  }, []);

  // Media Session API
  useEffect(() => {
    if (!("mediaSession" in navigator) || !state.playing) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: state.surahName,
      artist: getReciterById(state.playingReciterId).name,
      album: "القرآن الكريم",
    });
    navigator.mediaSession.setActionHandler("play", () => togglePlayPause());
    navigator.mediaSession.setActionHandler("pause", () => togglePlayPause());

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
      }
    } catch {
      // QF API failed, fall back to normal source
    }

    // If no QF audio URL, use the regular source
    if (!audioUrl) {
      const source = await resolveAudioSource(reciterId, surahNumber);
      if (!source) {
        setState((s) => ({ ...s, offline: true, loading: false }));
        return;
      }
      audioUrl = source.url;
      if (source.cached) blobUrlRef.current = source.url;
    }

    if (stoppedRef.current) return;

    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    setupAudioListeners(audio);

    try {
      await audio.play();
      setState((s) => ({ ...s, playing: true }));
    } catch {
      setState((s) => ({ ...s, loading: false }));
    }
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

  return (
    <AudioPlayerContext.Provider
      value={{
        ...state,
        reciterId,
        play,
        togglePlayPause,
        seek,
        stop,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
}
