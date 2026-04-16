import { useState, useEffect } from "react";
import { DK } from "./devkit-utils";
import { getFeatureFlags, setFeatureFlags, DEFAULT_FLAGS, type FeatureFlags } from "@/lib/feature-flags";

interface FlagDef {
  key: keyof Pick<FeatureFlags, "ramadanTab" | "maintenanceMode" | "installPromptEnabled">;
  label: string;
  description: string;
  icon: string;
}

const FLAG_DEFS: FlagDef[] = [
  {
    key: "ramadanTab",
    label: "Ramadan Tab",
    description: "Show the Ramadan page as a tab in the bottom navigation bar",
    icon: "🌙",
  },
  {
    key: "installPromptEnabled",
    label: "Install Prompt",
    description: "Show the 'Add to Home Screen' install banner to eligible users",
    icon: "📲",
  },
  {
    key: "maintenanceMode",
    label: "Maintenance Mode",
    description: "Display a dismissible maintenance banner at the top of the app",
    icon: "🚧",
  },
];

export default function FeatureFlagsPanel() {
  const [flags, setFlags] = useState<FeatureFlags>(() => getFeatureFlags());
  const [toast, setToast] = useState("");

  useEffect(() => {
    const handler = () => setFlags(getFeatureFlags());
    window.addEventListener("local-storage-sync", handler);
    return () => window.removeEventListener("local-storage-sync", handler);
  }, []);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

  const toggle = (key: keyof FeatureFlags) => {
    const next = !flags[key as keyof typeof flags];
    setFeatureFlags({ [key]: next });
    setFlags(getFeatureFlags());
    flash(`✓ ${key}: ${next ? "ON" : "OFF"}`);
  };

  const updateMessage = (msg: string) => {
    setFeatureFlags({ maintenanceMessage: msg });
    setFlags(getFeatureFlags());
  };

  const resetAll = () => {
    if (!confirm("Reset all feature flags to their defaults?")) return;
    setFeatureFlags({ ...DEFAULT_FLAGS });
    setFlags(getFeatureFlags());
    flash("✓ Flags reset to defaults");
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        {toast ? (
          <div className={`flex-1 rounded px-3 py-1.5 bg-[#238636]/20 border border-[#238636] font-mono text-xs ${DK.green}`}>
            {toast}
          </div>
        ) : (
          <p className={`flex-1 font-mono text-xs ${DK.muted}`}>
            Changes apply immediately. Stored in{" "}
            <span className={DK.blue}>wise-feature-flags</span> (localStorage).
          </p>
        )}
        <button onClick={resetAll} className={`${DK.btnBase} ${DK.btnGray} shrink-0`}>
          Reset defaults
        </button>
      </div>

      {/* Toggle rows */}
      <div className={`rounded-lg ${DK.card} overflow-hidden divide-y divide-[#30363d]`}>
        {FLAG_DEFS.map(({ key, label, description, icon }) => {
          const on = !!flags[key as keyof FeatureFlags];
          return (
            <div key={key} className="flex items-center gap-4 px-4 py-3.5">
              <span className="text-lg shrink-0" aria-hidden="true">
                {icon}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`font-mono text-xs font-semibold ${DK.text}`}>{label}</p>
                <p className={`font-mono text-[11px] ${DK.muted} mt-0.5`}>{description}</p>
              </div>
              <button
                onClick={() => toggle(key)}
                aria-pressed={on}
                aria-label={`${label}: ${on ? "on" : "off"}`}
                className={`shrink-0 w-11 h-6 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-[#388bfd]/50 ${
                  on ? "bg-[#238636]" : "bg-[#30363d]"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-150 ${
                    on ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>

      {/* Maintenance message (shown only when mode is on) */}
      {flags.maintenanceMode && (
        <div className={`rounded-lg ${DK.card} p-4 space-y-2`}>
          <label className={`font-mono text-xs font-semibold ${DK.text} block`}>
            Maintenance Banner Message
          </label>
          <textarea
            value={flags.maintenanceMessage ?? ""}
            onChange={(e) => updateMessage(e.target.value)}
            rows={3}
            placeholder="Enter the message to show users…"
            className={`w-full font-mono text-xs px-3 py-2 rounded bg-[#0d1117] ${DK.text} border ${DK.border} outline-none focus:border-[#388bfd] resize-y`}
          />
          <p className={`font-mono text-[11px] ${DK.muted}`}>
            Appears as a yellow banner at the top of the app. Users can dismiss it per session.
          </p>
        </div>
      )}

      {/* Current values (debug view) */}
      <div className={`rounded-lg ${DK.card} p-4`}>
        <p className={`font-mono text-[11px] uppercase tracking-widest ${DK.muted} mb-2`}>
          Raw stored values
        </p>
        <pre className={`font-mono text-xs ${DK.text} whitespace-pre-wrap break-all`}>
          {JSON.stringify(flags, null, 2)}
        </pre>
      </div>
    </div>
  );
}
