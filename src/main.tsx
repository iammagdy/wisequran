import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import { logger } from "./lib/logger";
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
