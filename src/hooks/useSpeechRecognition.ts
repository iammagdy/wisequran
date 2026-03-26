import { useState, useRef, useCallback, useEffect } from "react";
import { detectBrowser, isIOSVersionAtLeast } from "@/lib/browser-detect";

export type SpeechRecognitionStatus = "idle" | "listening" | "processing" | "done" | "error";

export interface UseSpeechRecognitionResult {
  isSupported: boolean;
  isIOSMode: boolean;
  iosVersionTooOld: boolean;
  status: SpeechRecognitionStatus;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
  /** Clear accumulated transcript without stopping or destroying the recognition instance.
   *  Useful on iOS where destroying and re-creating a recognition instance between ayahs
   *  requires a new user gesture. Clearing the transcript lets the same instance continue. */
  clearTranscript: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

const isIOS = detectBrowser() === "ios-safari";

function normalizeChunk(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function mergeTranscriptWithOverlap(base: string, incoming: string): string {
  const normalizedBase = normalizeChunk(base);
  const normalizedIncoming = normalizeChunk(incoming);

  if (!normalizedIncoming) return normalizedBase;
  if (!normalizedBase) return normalizedIncoming;
  if (normalizedBase.includes(normalizedIncoming)) return normalizedBase;

  const baseWords = normalizedBase.split(" ");
  const incomingWords = normalizedIncoming.split(" ");
  const maxOverlap = Math.min(baseWords.length, incomingWords.length, 12);

  for (let overlap = maxOverlap; overlap > 0; overlap--) {
    const baseTail = baseWords.slice(-overlap).join(" ");
    const incomingHead = incomingWords.slice(0, overlap).join(" ");

    if (baseTail === incomingHead) {
      return [...baseWords, ...incomingWords.slice(overlap)].join(" ").trim();
    }
  }

  return `${normalizedBase} ${normalizedIncoming}`.trim();
}

function hasWebSpeechAPI(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

const ERROR_MAP: Record<string, string> = {
  "not-allowed": "mic_permission_denied",
  "audio-capture": "mic_not_found",
  "network": "speech_network_error",
  "service-not-allowed": "speech_service_unavailable",
  "language-not-supported": "speech_language_unsupported",
  "bad-grammar": "speech_error_generic",
};

const MAX_RESTARTS = 12;
const RESTART_DELAY_MS = 250;
const MIN_IOS_SPEECH_MAJOR = 14;
const MIN_IOS_SPEECH_MINOR = 5;

export function useSpeechRecognition(): UseSpeechRecognitionResult {
  const [status, setStatus] = useState<SpeechRecognitionStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef("");
  const interimRef = useRef("");
  const isManualStopRef = useRef(false);
  const restartCountRef = useRef(0);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isActiveRef = useRef(false);

  const iosVersionSupported = isIOS ? isIOSVersionAtLeast(MIN_IOS_SPEECH_MAJOR, MIN_IOS_SPEECH_MINOR) : null;
  const iosVersionTooOld = isIOS && iosVersionSupported === false;
  const isSupported = hasWebSpeechAPI() && !iosVersionTooOld;

  const clearRestartTimer = () => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  };

  const destroyRecognition = useCallback((mode: "stop" | "abort" = "abort") => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;

    try {
      if (mode === "stop") {
        recognition.stop();
      } else {
        recognition.abort();
      }
    } catch {
      // Ignore cleanup race conditions from Web Speech API.
    }

    recognitionRef.current = null;
  }, []);

  const createAndStartRecognition = useCallback(() => {
    if (!isSupported) return;

    destroyRecognition();

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();

    recognition.lang = "ar-SA";
    recognition.continuous = !isIOS;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let newFinalText = "";
      let interimText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          newFinalText += result[0].transcript + " ";
          restartCountRef.current = 0;
        } else {
          interimText += result[0].transcript;
        }
      }

      if (newFinalText) {
        finalTranscriptRef.current = mergeTranscriptWithOverlap(finalTranscriptRef.current, newFinalText);
        interimRef.current = "";
        setTranscript(finalTranscriptRef.current.trim());
      }
      interimRef.current = interimText;
      setInterimTranscript(interimText);
    };

    recognition.onerror = (event) => {
      if (event.error === "aborted") return;

      if (event.error === "no-speech") {
        if (isIOS) return;

        if (!isManualStopRef.current && isActiveRef.current && restartCountRef.current < MAX_RESTARTS) {
          restartCountRef.current++;
          clearRestartTimer();
          restartTimerRef.current = setTimeout(() => {
            if (!isManualStopRef.current && isActiveRef.current) {
              createAndStartRecognition();
            }
          }, RESTART_DELAY_MS);
        }
        return;
      }

      const mapped = event.error === "not-allowed" && isIOS
        ? "ios_safari_mic_permission"
        : ERROR_MAP[event.error] ?? event.error;
      setError(mapped);

      const isTransient = event.error === "network";

      if (isTransient && !isManualStopRef.current && isActiveRef.current && restartCountRef.current < MAX_RESTARTS) {
        restartCountRef.current++;
        clearRestartTimer();
        restartTimerRef.current = setTimeout(() => {
          if (!isManualStopRef.current && isActiveRef.current) {
            setError(null);
            createAndStartRecognition();
          }
        }, 1000);
        return;
      }

      setStatus("error");
      isActiveRef.current = false;

      if (isTransient) {
        setTimeout(() => {
          setStatus("idle");
          setError(null);
        }, 3000);
      }
    };

    recognition.onend = () => {
      interimRef.current = "";
      setInterimTranscript("");

      if (isManualStopRef.current || !isActiveRef.current) {
        setStatus("done");
        return;
      }

      if (restartCountRef.current >= MAX_RESTARTS) {
        setStatus("done");
        isActiveRef.current = false;
        return;
      }

      if (isIOS) {
        try {
          setStatus("listening");
          recognition.start();
          return;
        } catch {
          // Fall through to fresh restart below.
        }
      }

      restartCountRef.current++;
      clearRestartTimer();
      restartTimerRef.current = setTimeout(() => {
        if (!isManualStopRef.current && isActiveRef.current) {
          createAndStartRecognition();
        } else {
          setStatus("done");
        }
      }, RESTART_DELAY_MS);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (error) {
      const isMicDenied = error instanceof DOMException && error.name === "NotAllowedError";
      setError(isMicDenied && isIOS ? "ios_safari_mic_permission" : "speech_error_generic");
      setStatus("error");
      isActiveRef.current = false;
    }
  }, [destroyRecognition, isSupported]);

  const start = useCallback(() => {
    if (!isSupported) return;

    destroyRecognition();
    isManualStopRef.current = false;
    isActiveRef.current = true;
    restartCountRef.current = 0;
    finalTranscriptRef.current = "";
    interimRef.current = "";

    setTranscript("");
    setInterimTranscript("");
    setError(null);
    setStatus("listening");

    createAndStartRecognition();
  }, [isSupported, createAndStartRecognition]);

  const stop = useCallback(() => {
    isManualStopRef.current = true;
    isActiveRef.current = false;
    clearRestartTimer();
    destroyRecognition("stop");
  }, [destroyRecognition]);

  const reset = useCallback(() => {
    isManualStopRef.current = true;
    isActiveRef.current = false;
    clearRestartTimer();
    destroyRecognition();
    finalTranscriptRef.current = "";
    interimRef.current = "";
    restartCountRef.current = 0;
    setStatus("idle");
    setTranscript("");
    setInterimTranscript("");
    setError(null);
  }, []);

  /**
   * Clear accumulated transcript without stopping the recognition instance.
   * On iOS, destroying and re-creating a recognition instance between ayahs
   * requires a new user gesture. This lets the same instance keep running
   * while resetting the accumulated text for the next ayah evaluation.
   */
  const clearTranscript = useCallback(() => {
    finalTranscriptRef.current = "";
    interimRef.current = "";
    restartCountRef.current = 0;
    setTranscript("");
    setInterimTranscript("");
  }, []);

  useEffect(() => {
    return () => {
      isManualStopRef.current = true;
      isActiveRef.current = false;
      clearRestartTimer();
      destroyRecognition();
    };
  }, [destroyRecognition]);

  return {
    isSupported,
    isIOSMode: isIOS,
    iosVersionTooOld,
    status,
    transcript,
    interimTranscript,
    error,
    start,
    stop,
    reset,
    clearTranscript,
  };
}
