import { useState, useRef } from "react";
import AppStatusPanel from "@/components/devkit/AppStatusPanel";
import LocalStoragePanel from "@/components/devkit/LocalStoragePanel";
import IndexedDBPanel from "@/components/devkit/IndexedDBPanel";
import SyncQueuePanel from "@/components/devkit/SyncQueuePanel";
import AppControlsPanel from "@/components/devkit/AppControlsPanel";
import UserDataPanel from "@/components/devkit/UserDataPanel";
import AudioPanel from "@/components/devkit/AudioPanel";
import NotificationsPanel from "@/components/devkit/NotificationsPanel";
import { DK } from "@/components/devkit/devkit-utils";

const DEVKIT_PIN = "devkit";
const SESSION_KEY = "wise-devkit-unlocked";

type PanelKey =
  | "status"
  | "localstorage"
  | "indexeddb"
  | "syncqueue"
  | "controls"
  | "userdata"
  | "audio"
  | "notifications";

const NAV: { key: PanelKey; label: string; icon: string }[] = [
  { key: "status", label: "App Status", icon: "◉" },
  { key: "localstorage", label: "LocalStorage", icon: "🗄" },
  { key: "indexeddb", label: "IndexedDB", icon: "💾" },
  { key: "syncqueue", label: "Sync Queue", icon: "⇅" },
  { key: "controls", label: "App Controls", icon: "⚙" },
  { key: "userdata", label: "User Data", icon: "👤" },
  { key: "audio", label: "Audio Player", icon: "♫" },
  { key: "notifications", label: "Notifications", icon: "🔔" },
];

function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const attempt = () => {
    if (value === DEVKIT_PIN) {
      sessionStorage.setItem(SESSION_KEY, "1");
      onUnlock();
    } else {
      setError(true);
      setValue("");
      setTimeout(() => setError(false), 1500);
      inputRef.current?.focus();
    }
  };

  return (
    <div className={`min-h-screen ${DK.bg} flex items-center justify-center p-4`}>
      <div className={`w-full max-w-sm rounded-xl p-8 ${DK.card} space-y-6`}>
        <div className="text-center">
          <div className={`text-4xl mb-3`}>⚙</div>
          <h1 className={`font-mono text-lg font-bold ${DK.text}`}>DevKit</h1>
          <p className={`font-mono text-xs ${DK.muted} mt-1`}>Developer Control Panel</p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); attempt(); }} className="space-y-3">
          <label className={`font-mono text-xs ${DK.muted} block`}>Enter PIN to continue</label>
          <input
            ref={inputRef}
            type="password"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="PIN"
            className={`w-full font-mono text-sm px-4 py-3 rounded-lg bg-[#0d1117] ${DK.text} border ${
              error ? "border-[#f85149]" : DK.border
            } outline-none focus:border-[#388bfd] transition-colors text-center tracking-widest`}
          />
          {error && (
            <p className={`font-mono text-xs ${DK.red} text-center`}>Incorrect PIN</p>
          )}
          <button
            type="submit"
            className={`w-full ${DK.btnBase} ${DK.btnGreen} py-2.5 text-sm`}
          >
            Unlock Dashboard
          </button>
        </form>

        <p className={`font-mono text-xs ${DK.muted} text-center`}>
          Session-locked · closes on tab close
        </p>
      </div>
    </div>
  );
}

function Sidebar({
  active,
  onSelect,
}: {
  active: PanelKey;
  onSelect: (k: PanelKey) => void;
}) {
  return (
    <aside
      className={`w-52 shrink-0 h-screen sticky top-0 flex flex-col ${DK.sidebar} border-r ${DK.border} overflow-y-auto`}
    >
      <div className={`p-4 border-b ${DK.border}`}>
        <div className="flex items-center gap-2">
          <span className="text-lg">⚙</span>
          <div>
            <h1 className={`font-mono text-sm font-bold ${DK.text}`}>DevKit</h1>
            <p className={`font-mono text-xs ${DK.muted}`}>wise-quran</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-2">
        {NAV.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-left transition-colors font-mono text-xs ${
              active === key
                ? `bg-[#388bfd]/20 text-[#79c0ff] border border-[#388bfd]/30`
                : `${DK.muted} hover:bg-[#21262d] hover:${DK.text}`
            }`}
          >
            <span className="text-sm shrink-0">{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className={`p-3 border-t ${DK.border}`}>
        <button
          onClick={() => {
            sessionStorage.removeItem(SESSION_KEY);
            window.location.reload();
          }}
          className={`w-full ${DK.btnBase} ${DK.btnGray} text-xs`}
        >
          Lock
        </button>
      </div>
    </aside>
  );
}

function Panel({ id }: { id: PanelKey }) {
  switch (id) {
    case "status":        return <AppStatusPanel />;
    case "localstorage":  return <LocalStoragePanel />;
    case "indexeddb":     return <IndexedDBPanel />;
    case "syncqueue":     return <SyncQueuePanel />;
    case "controls":      return <AppControlsPanel />;
    case "userdata":      return <UserDataPanel />;
    case "audio":         return <AudioPanel />;
    case "notifications": return <NotificationsPanel />;
  }
}

export default function DevKitPage() {
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === "1"
  );
  const [active, setActive] = useState<PanelKey>("status");

  if (!unlocked) {
    return <PinGate onUnlock={() => setUnlocked(true)} />;
  }

  const nav = NAV.find((n) => n.key === active)!;

  return (
    <div className={`min-h-screen ${DK.bg} flex`}>
      <Sidebar active={active} onSelect={setActive} />

      <main className="flex-1 min-w-0 overflow-auto">
        <div className={`sticky top-0 z-10 flex items-center gap-3 px-6 py-4 border-b ${DK.border} ${DK.bg}`}>
          <span className="text-lg">{nav.icon}</span>
          <h2 className={`font-mono text-sm font-semibold ${DK.text}`}>{nav.label}</h2>
          <span className={`font-mono text-xs ${DK.muted} ml-auto`}>
            auto-refresh every 5s
          </span>
        </div>

        <div className="p-6 max-w-4xl">
          <Panel id={active} />
        </div>
      </main>
    </div>
  );
}
