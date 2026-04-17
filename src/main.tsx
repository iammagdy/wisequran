import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import { logger } from "./lib/logger";

// Self-hosted fonts (replaces the prior Google Fonts @import in index.css).
// Importing the @fontsource packages emits @font-face rules with woff2
// files served from our own origin, so the first paint is no longer
// blocked on fonts.googleapis.com / fonts.gstatic.com and the app is
// fully usable offline on a fresh install.
//
// IMPORTANT: import only the SPECIFIC subsets the app actually renders.
// Generic `<weight>.css` entrypoints pull every subset (latin, latin-ext,
// cyrillic, vietnamese, …) which inflated the precache by ~1 MB. We
// only render Arabic + ASCII Latin, so:
//  - Arabic display fonts (Noto Sans Arabic, Amiri, Scheherazade): arabic
//  - Latin UI fonts (Jost, Bodoni Moda): latin
import "@fontsource/jost/latin-400.css";
import "@fontsource/jost/latin-500.css";
import "@fontsource/jost/latin-600.css";
import "@fontsource/jost/latin-700.css";
import "@fontsource/noto-sans-arabic/arabic-400.css";
import "@fontsource/noto-sans-arabic/arabic-500.css";
import "@fontsource/noto-sans-arabic/arabic-600.css";
import "@fontsource/noto-sans-arabic/arabic-700.css";
import "@fontsource/amiri/arabic-400.css";
import "@fontsource/amiri/arabic-700.css";
import "@fontsource/scheherazade-new/arabic-400.css";
import "@fontsource/scheherazade-new/arabic-700.css";
import "@fontsource/bodoni-moda/latin-400.css";
import "@fontsource/bodoni-moda/latin-700.css";

import "./index.css";

// Capture the install-prompt event as early as possible — before React mounts —
// to avoid losing it during the splash-screen delay.
window.addEventListener(
  "beforeinstallprompt",
  (e) => {
    e.preventDefault();
    (window as Window & { __installPromptEvent?: Event }).__installPromptEvent = e;
  },
  { once: true }
);

registerSW({
  immediate: true,
  onNeedRefresh() {
    logger.debug("[sw] new version available");
    window.dispatchEvent(new CustomEvent('sw-update-available'));
  },
  onOfflineReady() {
    logger.debug("[sw] ready to work offline");
  }
});

createRoot(document.getElementById("root")!).render(<App />);
