import { useEffect } from "react";
import { mobileAudioManager } from "@/lib/mobile-audio";

export function useGlobalAudioBootstrap() {
  useEffect(() => {
    let primed = false;

    const cleanup = () => {
      window.removeEventListener("pointerdown", handleInteraction, true);
      window.removeEventListener("touchstart", handleInteraction, true);
      window.removeEventListener("keydown", handleInteraction, true);
    };

    const handleInteraction = () => {
      if (primed) return;
      primed = true;
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