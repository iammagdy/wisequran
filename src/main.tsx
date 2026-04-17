import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import { logger } from "./lib/logger";

// Self-hosted fonts (replaces the prior Google Fonts @import in index.css).
// Importing the @fontsource packages emits @font-face rules with woff2 files
// served from our own origin, so the first paint is no longer blocked on
// fonts.googleapis.com / fonts.gstatic.com and the app is fully usable
// offline on a fresh install. Only the weights actually used by the design
// are imported to keep the precache small.
import "@fontsource/jost/400.css";
import "@fontsource/jost/500.css";
import "@fontsource/jost/600.css";
import "@fontsource/jost/700.css";
import "@fontsource/noto-sans-arabic/400.css";
import "@fontsource/noto-sans-arabic/500.css";
import "@fontsource/noto-sans-arabic/600.css";
import "@fontsource/noto-sans-arabic/700.css";
import "@fontsource/amiri/400.css";
import "@fontsource/amiri/700.css";
import "@fontsource/scheherazade-new/400.css";
import "@fontsource/scheherazade-new/700.css";
import "@fontsource/bodoni-moda/400.css";
import "@fontsource/bodoni-moda/700.css";

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
