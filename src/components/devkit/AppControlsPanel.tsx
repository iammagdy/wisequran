import { useState } from "react";
import { DK } from "./devkit-utils";

const THEMES = ["light", "dark", "system"] as const;
const LANGS = ["ar", "en"] as const;

function readTheme() {
  return (localStorage.getItem("wise-theme") ?? "system") as string;
}
function readLang() {
  return (localStorage.getItem("wise-language") ?? "ar") as string;
}

export default function AppControlsPanel() {
  const [theme, setTheme] = useState(readTheme);
  const [lang, setLang] = useState(readLang);
  const [msg, setMsg] = useState("");

  const flash = (text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(""), 2500);
  };

  const applyTheme = (t: string) => {
    localStorage.setItem("wise-theme", t);
    setTheme(t);
    window.dispatchEvent(new Event("storage"));
    document.documentElement.classList.remove("light", "dark");
    if (t === "dark") document.documentElement.classList.add("dark");
    else if (t === "light") document.documentElement.classList.remove("dark");
    else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) document.documentElement.classList.add("dark");
    }
    flash(`Theme → ${t}`);
  };

  const applyLang = (l: string) => {
    localStorage.setItem("wise-language", l);
    setLang(l);
    flash(`Language → ${l} (reload the main app to see changes)`);
  };

  const resetInstallBanner = () => {
    localStorage.removeItem("wise-install-sessions");
    localStorage.removeItem("wise-install-snoozed-until");
    localStorage.removeItem("wise-install-dismissed");
    flash("Install banner reset — visit the app again to re-trigger");
  };

  const forceChangelog = () => {
    localStorage.removeItem("wise-last-seen-version");
    flash("Changelog reset — open the main app tab to see the modal");
  };

  const clearCaches = async () => {
    if (!confirm("Clear all Cache API caches? The PWA will re-fetch assets on next visit.")) return;
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      flash(`Cleared ${keys.length} cache(s): ${keys.join(", ")}`);
    } else {
      flash("Cache API not supported in this browser");
    }
  };

  const clearReading = () => {
    if (!confirm("Reset all reading progress (history, logs, streak, daily reading)?")) return;
    [
      "wise-reading-history",
      "wise-reading-logs",
      "wise-daily-reading",
      "wise-reading-stats",
      "wise-streak",
    ].forEach((k) => localStorage.removeItem(k));
    flash("Reading progress cleared");
  };

  const clearHifz = () => {
    if (!confirm("Reset all Hifz data?")) return;
    [
      "wise-hifz",
      "wise-hifz-review",
      "wise-hifz-goal",
      "wise-hifz-streak",
    ].forEach((k) => localStorage.removeItem(k));
    flash("Hifz data cleared");
  };

  return (
    <div className="space-y-5">
      {msg && (
        <div className={`rounded p-3 bg-[#238636]/20 border border-[#238636] font-mono text-xs ${DK.green}`}>
          ✓ {msg}
        </div>
      )}

      <div className={`rounded-lg p-4 ${DK.card}`}>
        <h3 className={`font-mono text-xs uppercase tracking-widest ${DK.muted} mb-3`}>Theme</h3>
        <div className="flex gap-2 flex-wrap">
          {THEMES.map((t) => (
            <button
              key={t}
              onClick={() => applyTheme(t)}
              className={`${DK.btnBase} ${theme === t ? DK.btnGreen : DK.btnGray}`}
            >
              {t}
            </button>
          ))}
        </div>
        <p className={`font-mono text-xs ${DK.muted} mt-2`}>
          Current: <span className={DK.blue}>{theme}</span>
        </p>
      </div>

      <div className={`rounded-lg p-4 ${DK.card}`}>
        <h3 className={`font-mono text-xs uppercase tracking-widest ${DK.muted} mb-3`}>Language</h3>
        <div className="flex gap-2">
          {LANGS.map((l) => (
            <button
              key={l}
              onClick={() => applyLang(l)}
              className={`${DK.btnBase} ${lang === l ? DK.btnGreen : DK.btnGray}`}
            >
              {l === "ar" ? "العربية (ar)" : "English (en)"}
            </button>
          ))}
        </div>
        <p className={`font-mono text-xs ${DK.muted} mt-2`}>
          Current: <span className={DK.blue}>{lang}</span> · reload main app after change
        </p>
      </div>

      <div className={`rounded-lg p-4 ${DK.card}`}>
        <h3 className={`font-mono text-xs uppercase tracking-widest ${DK.muted} mb-4`}>Reset controls</h3>
        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center justify-between">
            <div>
              <p className={`font-mono text-xs ${DK.text}`}>Install banner</p>
              <p className={`font-mono text-xs ${DK.muted}`}>Clears session count + snooze so banner shows again</p>
            </div>
            <button onClick={resetInstallBanner} className={`${DK.btnBase} ${DK.btnGray} shrink-0`}>
              Reset
            </button>
          </div>
          <div className={`border-t ${DK.border} pt-3 flex items-center justify-between`}>
            <div>
              <p className={`font-mono text-xs ${DK.text}`}>Changelog modal</p>
              <p className={`font-mono text-xs ${DK.muted}`}>Clears seen-version so modal shows on next app open</p>
            </div>
            <button onClick={forceChangelog} className={`${DK.btnBase} ${DK.btnGray} shrink-0`}>
              Reset
            </button>
          </div>
          <div className={`border-t ${DK.border} pt-3 flex items-center justify-between`}>
            <div>
              <p className={`font-mono text-xs ${DK.text}`}>Reading progress</p>
              <p className={`font-mono text-xs ${DK.muted}`}>history, logs, streak, daily reading</p>
            </div>
            <button onClick={clearReading} className={`${DK.btnBase} ${DK.btnRed} shrink-0`}>
              Clear
            </button>
          </div>
          <div className={`border-t ${DK.border} pt-3 flex items-center justify-between`}>
            <div>
              <p className={`font-mono text-xs ${DK.text}`}>Hifz data</p>
              <p className={`font-mono text-xs ${DK.muted}`}>memorization status, SRS data, goals, streaks</p>
            </div>
            <button onClick={clearHifz} className={`${DK.btnBase} ${DK.btnRed} shrink-0`}>
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className={`rounded-lg p-4 ${DK.card}`}>
        <h3 className={`font-mono text-xs uppercase tracking-widest ${DK.muted} mb-3`}>Caches</h3>
        <div className="flex items-center justify-between">
          <p className={`font-mono text-xs ${DK.muted}`}>
            Wipes all Cache API entries (PWA assets). App will refetch on next load.
          </p>
          <button
            onClick={() => void clearCaches()}
            className={`${DK.btnBase} ${DK.btnRed} shrink-0 ml-4`}
          >
            Clear all caches
          </button>
        </div>
      </div>
    </div>
  );
}
