import { useState, useRef, useCallback, useEffect } from "react";
import { detectBrowser } from "@/lib/browser-detect";

export type SpeechRecognitionStatus = "idle" | "listening" | "processing" | "done" | "error";

export interface UseSpeechRecognitionResult {
  isSupported: boolean;
  isIOSMode: boolean;
  status: SpeechRecognitionStatus;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

const isIOS = detectBrowser() === "ios-safari";

function hasWebSpeechAPI(): boolean {
  if (isIOS) return false;
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

export function useSpeechRecognition(): UseSpeechRecognitionResult {
  const [status, setStatus] = useState<SpeechRecognitionStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef("");
  const isManualStopRef = useRef(false);
  const restartCountRef = useRef(0);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isActiveRef = useRef(false);

  const isSupported = hasWebSpeechAPI();

  const clearRestartTimer = () => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  };

  const createAndStartRecognition = useCallback(() => {
    if (!isSupported) return;

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();

    recognition.lang = "ar-SA";
    recognition.continuous = true;
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
        finalTranscriptRef.current += newFinalText;
        setTranscript(finalTranscriptRef.current.trim());
      }
      setInterimTranscript(interimText);
    };

    recognition.onerror = (event) => {
      if (event.error === "aborted") return;

      if (event.error === "no-speech") {
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

      const mapped = ERROR_MAP[event.error] ?? event.error;
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
    recognition.start();
  }, [isSupported]);

  const start = useCallback(() => {
    if (!isSupported) return;

    isManualStopRef.current = false;
    isActiveRef.current = true;
    restartCountRef.current = 0;
    finalTranscriptRef.current = "";

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
    recognitionRef.current?.stop();
  }, []);

  const reset = useCallback(() => {
    isManualStopRef.current = true;
    isActiveRef.current = false;
    clearRestartTimer();
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    finalTranscriptRef.current = "";
    restartCountRef.current = 0;
    setStatus("idle");
    setTranscript("");
    setInterimTranscript("");
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      isManualStopRef.current = true;
      isActiveRef.current = false;
      clearRestartTimer();
      recognitionRef.current?.abort();
    };
  }, []);

  return {
    isSupported,
    isIOSMode: isIOS,
    status,
    transcript,
    interimTranscript,
    error,
    start,
    stop,
    reset,
  };
}
