import { useState, useRef, useEffect } from "react";
import AppStatusPanel from "@/components/devkit/AppStatusPanel";
import LocalStoragePanel from "@/components/devkit/LocalStoragePanel";
import IndexedDBPanel from "@/components/devkit/IndexedDBPanel";
import SyncQueuePanel from "@/components/devkit/SyncQueuePanel";
import AppControlsPanel from "@/components/devkit/AppControlsPanel";
import UserDataPanel from "@/components/devkit/UserDataPanel";
import AudioPanel from "@/components/devkit/AudioPanel";
import NotificationsPanel from "@/components/devkit/NotificationsPanel";
import { DK } from "@/components/devkit/devkit-utils";
import { getSyncQueueCount } from "@/lib/db";

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
            autoComplete="new-password"
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
  collapsed,
  onToggleCollapse,
  syncQueueCount,
}: {
  active: PanelKey;
  onSelect: (k: PanelKey) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  syncQueueCount: number;
}) {
  return (
    <aside
      className={`${collapsed ? "w-14" : "w-52"} shrink-0 h-screen sticky top-0 flex flex-col ${DK.sidebar} border-r ${DK.border} overflow-y-auto transition-all duration-200`}
    >
      <div className={`p-3 border-b ${DK.border} flex items-center ${collapsed ? "justify-center" : "gap-2"}`}>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <h1 className={`font-mono text-sm font-bold ${DK.text}`}>DevKit</h1>
            <p className={`font-mono text-xs ${DK.muted}`}>wise-quran</p>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`${DK.btnBase} ${DK.btnGray} text-xs px-2`}
        >
          {collapsed ? "»" : "«"}
        </button>
      </div>

      <nav className="flex-1 p-2">
        {NAV.map(({ key, label, icon }) => {
          const badge = key === "syncqueue" && syncQueueCount > 0 ? syncQueueCount : 0;
          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              title={collapsed ? label : undefined}
              className={`w-full flex items-center gap-3 px-2 py-2.5 rounded-lg mb-0.5 text-left transition-colors font-mono text-xs ${
                active === key
                  ? `bg-[#388bfd]/20 text-[#79c0ff] border border-[#388bfd]/30`
                  : `${DK.muted} hover:bg-[#21262d] hover:${DK.text}`
              } ${collapsed ? "justify-center" : ""}`}
            >
              <span className="text-sm shrink-0 relative">
                {icon}
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#f85149] text-white font-mono text-[9px] leading-none rounded-full px-1 py-0.5 min-w-[14px] text-center">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </span>
              {!collapsed && <span className="flex-1 truncate">{label}</span>}
              {!collapsed && badge > 0 && (
                <span className="shrink-0 bg-[#f85149] text-white font-mono text-[10px] leading-none rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className={`p-2 border-t ${DK.border}`}>
        <button
          onClick={() => {
            sessionStorage.removeItem(SESSION_KEY);
            window.location.reload();
          }}
          title="Lock"
          className={`w-full ${DK.btnBase} ${DK.btnGray} text-xs ${collapsed ? "px-2" : ""}`}
        >
          {collapsed ? "🔒" : "Lock"}
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
  const [collapsed, setCollapsed] = useState(false);
  const [syncQueueCount, setSyncQueueCount] = useState(0);

  useEffect(() => {
    const poll = async () => {
      try {
        const count = await getSyncQueueCount();
        setSyncQueueCount(count);
      } catch {
        // ignore
      }
    };
    if (unlocked) {
      void poll();
      const id = setInterval(poll, 5000);
      return () => clearInterval(id);
    }
  }, [unlocked]);

  if (!unlocked) {
    return <PinGate onUnlock={() => setUnlocked(true)} />;
  }

  const nav = NAV.find((n) => n.key === active)!;

  return (
    <div className={`min-h-screen ${DK.bg} flex`}>
      <Sidebar
        active={active}
        onSelect={setActive}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        syncQueueCount={syncQueueCount}
      />

      <main className="flex-1 min-w-0 overflow-auto">
        <div className={`sticky top-0 z-10 flex items-center gap-3 px-6 py-4 border-b ${DK.border} ${DK.bg}`}>
          <span className="text-lg">{nav.icon}</span>
          <h2 className={`font-mono text-sm font-semibold ${DK.text}`}>{nav.label}</h2>
          {active === "syncqueue" && syncQueueCount > 0 && (
            <span className="bg-[#f85149] text-white font-mono text-xs rounded-full px-2 py-0.5">
              {syncQueueCount} pending
            </span>
          )}
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
