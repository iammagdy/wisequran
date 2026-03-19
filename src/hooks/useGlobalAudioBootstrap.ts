import { useEffect } from "react";
import { mobileAudioManager } from "@/lib/mobile-audio";

export function useGlobalAudioBootstrap() {
  useEffect(() => {
    let primed = false;
    let audioContextWarmedUp = false;

    const cleanup = () => {
      window.removeEventListener("pointerdown", handleInteraction, true);
      window.removeEventListener("touchstart", handleInteraction, true);
      window.removeEventListener("keydown", handleInteraction, true);
    };

    const warmAudioContext = () => {
      if (audioContextWarmedUp) return;

      const AudioContextCtor = window.AudioContext || (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextCtor) return;

      try {
        const ctx = new AudioContextCtor();
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        void ctx.resume().catch(() => {});
        source.start(0);
        audioContextWarmedUp = true;
      } catch {
        // Best effort only for iOS Safari audio warm-up.
      }
    };

    const handleInteraction = () => {
      if (primed) return;
      primed = true;
      warmAudioContext();
      cleanup();
      mobileAudioManager.primeAll().catch(() => {
        // Best effort bootstrap for mobile browsers.
      });
    };

    window.addEventListener("pointerdown", handleInteraction, { capture: true, passive: true });
    window.addEventListener("touchstart", handleInteraction, { capture: true, passive: true });
    window.addEventListener("keydown", handleInteraction, { capture: true });

    return cleanup;
  }, []);
}