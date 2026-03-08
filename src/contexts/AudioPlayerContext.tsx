import { createContext, useContext, useState, useRef, useCallback, useEffect, type ReactNode } from "react";
import { resolveAudioSource } from "@/lib/quran-audio";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { DEFAULT_RECITER, getReciterById } from "@/lib/reciters";
import { toast } from "sonner";

interface AudioPlayerState {
  surahNumber: number | null;
  surahName: string;
  playing: boolean;
  currentTime: number;
  duration: number;
  loading: boolean;
  offline: boolean;
}

interface AudioPlayerContextType extends AudioPlayerState {
  reciterId: string;
  play: (surahNumber: number, surahName: string) => Promise<void>;
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

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const [reciterId] = useLocalStorage<string>("wise-reciter", DEFAULT_RECITER);

  const [state, setState] = useState<AudioPlayerState>({
    surahNumber: null,
    surahName: "",
    playing: false,
    currentTime: 0,
    duration: 0,
    loading: false,
    offline: false,
  });

  // Cleanup blob URL helper
  const cleanupBlobUrl = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  }, []);

  // Cleanup on unmount
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
      artist: getReciterById(reciterId).name,
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
  }, [state.playing, state.surahName, reciterId]);

  const setupAudioListeners = useCallback((audio: HTMLAudioElement) => {
    audio.addEventListener("loadedmetadata", () => {
      setState((s) => ({ ...s, duration: audio.duration, loading: false }));
    });
    audio.addEventListener("timeupdate", () => {
      setState((s) => ({ ...s, currentTime: audio.currentTime }));
    });
    audio.addEventListener("ended", () => {
      setState((s) => ({ ...s, playing: false }));
    });
    audio.addEventListener("error", () => {
      setState((s) => ({ ...s, loading: false }));
      toast.error("تعذر تشغيل الصوت");
    });
  }, []);

  const play = useCallback(async (surahNumber: number, surahName: string) => {
    // If same surah is already loaded, just resume
    if (audioRef.current && state.surahNumber === surahNumber) {
      audioRef.current.play();
      setState((s) => ({ ...s, playing: true }));
      return;
    }

    // Stop current audio
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
    }));

    const source = await resolveAudioSource(reciterId, surahNumber);
    if (!source) {
      setState((s) => ({ ...s, offline: true, loading: false }));
      return;
    }

    const audio = new Audio(source.url);
    if (source.cached) blobUrlRef.current = source.url;
    audioRef.current = audio;
    setupAudioListeners(audio);

    audio.play();
    setState((s) => ({ ...s, playing: true }));
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
    audioRef.current?.pause();
    audioRef.current = null;
    cleanupBlobUrl();
    setState({
      surahNumber: null,
      surahName: "",
      playing: false,
      currentTime: 0,
      duration: 0,
      loading: false,
      offline: false,
    });
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
