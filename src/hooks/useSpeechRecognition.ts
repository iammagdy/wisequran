import { useState, useRef, useCallback, useEffect } from "react";

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

function isIOS(): boolean {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua);
}

function isIOSSafari(): boolean {
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua);
  const safari = /Safari/.test(ua) && !/Chrome/.test(ua) && !/CriOS/.test(ua) && !/FxiOS/.test(ua);
  return ios && safari;
}

function hasWebSpeechAPI(): boolean {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

function hasMediaRecorder(): boolean {
  return typeof MediaRecorder !== "undefined";
}

function getSupabaseUrl(): string {
  return (import.meta.env.VITE_SUPABASE_URL as string) ?? "";
}

async function transcribeViaWhisper(audioBlob: Blob): Promise<string> {
  const supabaseUrl = getSupabaseUrl();
  const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ?? "";

  const ext = audioBlob.type.includes("mp4") ? "mp4" : "webm";
  const file = new File([audioBlob], `recording.${ext}`, { type: audioBlob.type });

  const form = new FormData();
  form.append("audio", file);

  const res = await fetch(`${supabaseUrl}/functions/v1/transcribe-audio`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${anonKey}`,
    },
    body: form,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Transcription failed: ${body}`);
  }

  const data = await res.json();
  return data.transcript ?? "";
}

function useWebSpeechRecognition(
  setStatus: (s: SpeechRecognitionStatus) => void,
  setTranscript: (t: string) => void,
  setInterimTranscript: (t: string) => void,
  setError: (e: string | null) => void
) {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const stoppedManuallyRef = useRef(false);

  const start = useCallback(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();

    recognition.lang = "ar-SA";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    stoppedManuallyRef.current = false;
    setTranscript("");
    setInterimTranscript("");
    setError(null);
    setStatus("listening");

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript + " ";
        } else {
          interimText += result[0].transcript;
        }
      }

      if (finalText) setTranscript(finalText.trim());
      setInterimTranscript(interimText);
    };

    recognition.onerror = (event) => {
      if (event.error === "aborted" || event.error === "no-speech") return;
      setError(event.error);
      setStatus("error");
    };

    recognition.onend = () => {
      setInterimTranscript("");
      setStatus("done");
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [setStatus, setTranscript, setInterimTranscript, setError]);

  const stop = useCallback(() => {
    stoppedManuallyRef.current = true;
    recognitionRef.current?.stop();
  }, []);

  const reset = useCallback(() => {
    stoppedManuallyRef.current = true;
    recognitionRef.current?.abort();
    recognitionRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  return { start, stop, reset };
}

function useMediaRecorderRecognition(
  setStatus: (s: SpeechRecognitionStatus) => void,
  setTranscript: (t: string) => void,
  setInterimTranscript: (t: string) => void,
  setError: (e: string | null) => void
) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const start = useCallback(async () => {
    setTranscript("");
    setInterimTranscript("");
    setError(null);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "";

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        chunksRef.current = [];

        setStatus("processing");

        try {
          const text = await transcribeViaWhisper(blob);
          if (!text.trim()) {
            setError("no_speech_detected");
            setStatus("error");
          } else {
            setTranscript(text.trim());
            setStatus("done");
          }
        } catch (err) {
          setError(String(err));
          setStatus("error");
        }
      };

      recorder.onerror = () => {
        setError("recording_error");
        setStatus("error");
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000);
      setStatus("listening");
    } catch (err) {
      setError(String(err));
      setStatus("error");
    }
  }, [setStatus, setTranscript, setInterimTranscript, setError]);

  const stop = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const reset = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
    chunksRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return { start, stop, reset };
}

export function useSpeechRecognition(): UseSpeechRecognitionResult {
  const [status, setStatus] = useState<SpeechRecognitionStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const useIOSPath = isIOS() || (isIOSSafari()) || (!hasWebSpeechAPI() && hasMediaRecorder());
  const isSupported = useIOSPath ? hasMediaRecorder() : hasWebSpeechAPI();

  const webSpeech = useWebSpeechRecognition(setStatus, setTranscript, setInterimTranscript, setError);
  const mediaRecorder = useMediaRecorderRecognition(setStatus, setTranscript, setInterimTranscript, setError);

  const active = useIOSPath ? mediaRecorder : webSpeech;

  const start = useCallback(() => {
    if (!isSupported) return;
    setStatus("idle");
    active.start();
  }, [isSupported, active]);

  const stop = useCallback(() => {
    active.stop();
  }, [active]);

  const reset = useCallback(() => {
    active.reset();
    setStatus("idle");
    setTranscript("");
    setInterimTranscript("");
    setError(null);
  }, [active]);

  return {
    isSupported,
    isIOSMode: useIOSPath,
    status,
    transcript,
    interimTranscript,
    error,
    start,
    stop,
    reset,
  };
}
