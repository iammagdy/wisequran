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

export function useSpeechRecognition(): UseSpeechRecognitionResult {
  const [status, setStatus] = useState<SpeechRecognitionStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef("");

  const isSupported = hasWebSpeechAPI();

  const start = useCallback(() => {
    if (!isSupported) return;

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();

    recognition.lang = "ar-SA";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    finalTranscriptRef.current = "";
    setTranscript("");
    setInterimTranscript("");
    setError(null);
    setStatus("listening");

    recognition.onresult = (event) => {
      let newFinalText = "";
      let interimText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          newFinalText += result[0].transcript + " ";
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
      if (event.error === "no-speech") return;

      const mapped = ERROR_MAP[event.error] ?? event.error;
      setError(mapped);

      const isTransient = event.error === "network";
      setStatus("error");

      if (isTransient) {
        setTimeout(() => {
          setStatus("idle");
          setError(null);
        }, 3000);
      }
    };

    recognition.onend = () => {
      setInterimTranscript("");
      setStatus((prev) => (prev === "error" ? prev : "done"));
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const reset = useCallback(() => {
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    finalTranscriptRef.current = "";
    setStatus("idle");
    setTranscript("");
    setInterimTranscript("");
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
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
