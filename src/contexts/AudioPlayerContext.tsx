import { createContext, useContext, useState, useRef, useCallback, useEffect, type ReactNode } from "react";
import { resolveAudioSource } from "@/lib/quran-audio";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { DEFAULT_RECITER, getReciterById, getReciterAyahAudioUrl } from "@/lib/reciters";
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
  const nextAudioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const [reciterId] = useLocalStorage<string>("wise-reciter", DEFAULT_RECITER);

  // Per-ayah playback refs
  const ayahsRef = useRef<Ayah[]>([]);
  const ayahIndexRef = useRef<number>(0);
  const isAyahModeRef = useRef(false);
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
      nextAudioRef.current = null;
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

  /** Pre-load the next ayah's audio to eliminate gaps */
  const preloadNextAyah = useCallback((nextIndex: number, recId: string) => {
    const ayahs = ayahsRef.current;
    if (nextIndex < 0 || nextIndex >= ayahs.length) {
      nextAudioRef.current = null;
      return;
    }
    const nextAyah = ayahs[nextIndex];
    const url = getReciterAyahAudioUrl(recId, nextAyah.number);
    const nextAudio = new Audio();
    nextAudio.preload = "auto";
    nextAudio.src = url;
    nextAudio.load();
    nextAudioRef.current = nextAudio;
  }, []);

  const playAyahAtIndex = useCallback(async (index: number, recId: string) => {
    const ayahs = ayahsRef.current;
    if (index < 0 || index >= ayahs.length) {
      setState((s) => ({ ...s, playing: false, currentAyahNumber: null, currentAyahInSurah: null }));
      return;
    }

    if (stoppedRef.current) return;

    const ayah = ayahs[index];
    ayahIndexRef.current = index;

    setState((s) => ({
      ...s,
      loading: true,
      currentAyahNumber: ayah.number,
      currentAyahInSurah: ayah.numberInSurah,
      currentAyahIndex: index,
      totalAyahs: ayahs.length,
      isAyahMode: true,
    }));

    // Use pre-loaded audio if available, otherwise create new
    let audio: HTMLAudioElement;
    if (nextAudioRef.current && index > 0) {
      audio = nextAudioRef.current;
      nextAudioRef.current = null;
    } else {
      // Cleanup previous
      audioRef.current?.pause();
      cleanupBlobUrl();
      const url = getReciterAyahAudioUrl(recId, ayah.number);
      audio = new Audio(url);
    }

    audioRef.current = audio;

    audio.addEventListener("loadedmetadata", () => {
      setState((s) => ({ ...s, duration: audio.duration, loading: false }));
    });
    // If already loaded (pre-loaded), fire manually
    if (audio.readyState >= 1) {
      setState((s) => ({ ...s, duration: audio.duration, loading: false }));
    }

    audio.addEventListener("timeupdate", () => {
      setState((s) => ({ ...s, currentTime: audio.currentTime }));
    });
    audio.addEventListener("ended", () => {
      // Auto-advance to next ayah using pre-loaded audio
      playAyahAtIndex(ayahIndexRef.current + 1, recId);
    });
    audio.addEventListener("error", () => {
      setState((s) => ({ ...s, loading: false }));
      toast.error("تعذر تشغيل الصوت");
    });

    // Pre-load the NEXT ayah while this one plays
    preloadNextAyah(index + 1, recId);

    try {
      await audio.play();
      setState((s) => ({ ...s, playing: true }));
    } catch {
      setState((s) => ({ ...s, loading: false }));
    }
  }, [cleanupBlobUrl, preloadNextAyah]);

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

  const play = useCallback(async (surahNumber: number, surahName: string, ayahs?: Ayah[]) => {
    stoppedRef.current = false;
    const reciter = getReciterById(reciterId);

    // Per-ayah mode when ayahs are provided AND reciter supports it
    if (ayahs && ayahs.length > 0 && reciter.hasAyahAudio) {
      // If same surah already playing in ayah mode, just resume
      if (audioRef.current && state.surahNumber === surahNumber && isAyahModeRef.current) {
        audioRef.current.play();
        setState((s) => ({ ...s, playing: true }));
        return;
      }

      audioRef.current?.pause();
      audioRef.current = null;
      nextAudioRef.current = null;
      cleanupBlobUrl();

      ayahsRef.current = ayahs;
      isAyahModeRef.current = true;

      setState((s) => ({
        ...s,
        surahNumber,
        surahName,
        playing: false,
        currentTime: 0,
        duration: 0,
        offline: false,
        playingReciterId: reciterId,
      }));

      await playAyahAtIndex(0, reciterId);
      return;
    }

    // Full-surah mode (fallback)
    isAyahModeRef.current = false;
    ayahsRef.current = [];

    if (audioRef.current && state.surahNumber === surahNumber) {
      audioRef.current.play();
      setState((s) => ({ ...s, playing: true }));
      return;
    }

    audioRef.current?.pause();
    audioRef.current = null;
    nextAudioRef.current = null;
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
  }, [state.surahNumber, reciterId, cleanupBlobUrl, setupAudioListeners, playAyahAtIndex]);

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
    nextAudioRef.current = null;
    cleanupBlobUrl();
    isAyahModeRef.current = false;
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
