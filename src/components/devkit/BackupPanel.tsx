import { useState, useRef } from "react";
import { DK, downloadJson, exportFilename } from "./devkit-utils";
import { getFeatureFlags, DEFAULT_FLAGS, FEATURE_FLAGS_KEY, type FeatureFlags } from "@/lib/feature-flags";
import {
  getDevkitChangelog,
  setDevkitChangelog,
} from "@/lib/changelog-overrides";
import { type ChangelogEntry } from "@/data/changelog";

interface DevKitBackup {
  _type: "devkit-backup";
  exportedAt: string;
  featureFlags: FeatureFlags;
  changelogEntries: ChangelogEntry[];
}

interface PendingBackupImport {
  featureFlags: FeatureFlags;
  changelogEntries: ChangelogEntry[];
}

export default function BackupPanel() {
  const [toast, setToast] = useState("");
  const [pendingImport, setPendingImport] = useState<PendingBackupImport | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const handleExport = () => {
    const backup: DevKitBackup = {
      _type: "devkit-backup",
      exportedAt: new Date().toISOString(),
      featureFlags: getFeatureFlags(),
      changelogEntries: getDevkitChangelog(),
    };
    downloadJson(backup, exportFilename("devkit-backup"));
    flash(`✓ Backup exported (flags + ${backup.changelogEntries.length} changelog entr${backup.changelogEntries.length === 1 ? "y" : "ies"})`);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string) as Record<string, unknown>;
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
          flash("❌ Invalid file: expected a JSON object");
          return;
        }
        if (parsed._type !== "devkit-backup") {
          flash("❌ Not a DevKit backup file (missing _type: devkit-backup)");
          return;
        }
        if (typeof parsed.featureFlags !== "object" || parsed.featureFlags === null || Array.isArray(parsed.featureFlags)) {
          flash("❌ Invalid file: featureFlags must be an object");
          return;
        }
        if (!Array.isArray(parsed.changelogEntries)) {
          flash("❌ Invalid file: changelogEntries must be an array");
          return;
        }
        const validEntries = (parsed.changelogEntries as unknown[])
          .filter(
            (item): item is ChangelogEntry =>
              typeof item === "object" &&
              item !== null &&
              typeof (item as Record<string, unknown>).version === "string" &&
              typeof (item as Record<string, unknown>).date === "string"
          )
          .map((item) => ({
            ...item,
            en: {
              features: [],
              improvements: [],
              fixes: [],
              ...((item.en && typeof item.en === "object" ? item.en : {}) as object),
            },
            ar: {
              features: [],
              improvements: [],
              fixes: [],
              ...((item.ar && typeof item.ar === "object" ? item.ar : {}) as object),
            },
          })) as ChangelogEntry[];
        const mergedFlags: FeatureFlags = { ...DEFAULT_FLAGS, ...(parsed.featureFlags as object) };
        setPendingImport({ featureFlags: mergedFlags, changelogEntries: validEntries });
      } catch {
        flash("❌ Failed to parse JSON file");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const confirmImport = () => {
    if (!pendingImport) return;
    const { featureFlags, changelogEntries } = pendingImport;
    localStorage.setItem(FEATURE_FLAGS_KEY, JSON.stringify(featureFlags));
    window.dispatchEvent(new CustomEvent("local-storage-sync", { detail: { key: FEATURE_FLAGS_KEY } }));
    setDevkitChangelog(changelogEntries);
    setPendingImport(null);
    flash(`✓ Backup applied — flags + ${changelogEntries.length} changelog entr${changelogEntries.length === 1 ? "y" : "ies"} restored`);
  };

  const cancelImport = () => {
    setPendingImport(null);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        {toast ? (
          <div
            className={`flex-1 rounded px-3 py-1.5 font-mono text-xs ${
              toast.startsWith("❌")
                ? `bg-[#6e1c1c]/30 border border-[#f85149] ${DK.red}`
                : `bg-[#238636]/20 border border-[#238636] ${DK.green}`
            }`}
          >
            {toast}
          </div>
        ) : (
          <p className={`flex-1 font-mono text-xs ${DK.muted}`}>
            One file containing both feature flags and custom changelog entries.
          </p>
        )}
        <div className="flex gap-2 shrink-0">
          <button onClick={handleExport} className={`${DK.btnBase} ${DK.btnGreen}`}>
            Export backup
          </button>
          <button onClick={() => importRef.current?.click()} className={`${DK.btnBase} ${DK.btnGray}`}>
            Import backup
          </button>
        </div>
        <input
          ref={importRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={handleImportFile}
        />
      </div>

      {/* Import preview */}
      {pendingImport && (
        <div className={`rounded-lg ${DK.card} p-4 space-y-4`}>
          <p className={`font-mono text-xs font-semibold ${DK.yellow}`}>
            Import Preview — review before applying
          </p>

          {/* Flags preview */}
          <div className="space-y-1">
            <p className={`font-mono text-[11px] uppercase tracking-widest ${DK.muted}`}>
              Feature Flags
            </p>
            <pre className={`font-mono text-xs ${DK.text} whitespace-pre-wrap break-all bg-[#0d1117] rounded p-3`}>
              {JSON.stringify(pendingImport.featureFlags, null, 2)}
            </pre>
          </div>

          {/* Changelog entries preview */}
          <div className="space-y-1">
            <p className={`font-mono text-[11px] uppercase tracking-widest ${DK.muted}`}>
              Changelog Entries ({pendingImport.changelogEntries.length})
            </p>
            {pendingImport.changelogEntries.length === 0 ? (
              <p className={`font-mono text-xs ${DK.muted} px-3 py-2 bg-[#0d1117] rounded`}>
                No custom entries in this backup.
              </p>
            ) : (
              <div className="rounded bg-[#0d1117] divide-y divide-[#30363d]">
                {pendingImport.changelogEntries.map((e) => {
                  const total =
                    (e.en.features?.length ?? 0) +
                    (e.en.improvements?.length ?? 0) +
                    (e.en.fixes?.length ?? 0);
                  return (
                    <div key={e.version} className="flex items-center gap-3 px-3 py-2">
                      <span className={`font-mono text-xs font-semibold ${DK.blue} w-16 shrink-0`}>
                        v{e.version}
                      </span>
                      <span className={`font-mono text-[11px] ${DK.muted} w-24 shrink-0`}>
                        {e.date}
                      </span>
                      <span className={`font-mono text-[11px] ${DK.muted}`}>{total} items</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <p className={`font-mono text-[11px] ${DK.muted}`}>
            Applying will overwrite your current feature flags and replace all custom changelog entries.
          </p>
          <div className="flex gap-2">
            <button onClick={confirmImport} className={`${DK.btnBase} ${DK.btnGreen}`}>
              Apply backup
            </button>
            <button onClick={cancelImport} className={`${DK.btnBase} ${DK.btnGray}`}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Current snapshot */}
      <div className={`rounded-lg ${DK.card} p-4 space-y-4`}>
        <p className={`font-mono text-[11px] uppercase tracking-widest ${DK.muted}`}>
          Current snapshot (what will be exported)
        </p>

        <div className="space-y-1">
          <p className={`font-mono text-[11px] ${DK.muted} mb-1`}>Feature Flags</p>
          <pre className={`font-mono text-xs ${DK.text} whitespace-pre-wrap break-all bg-[#0d1117] rounded p-3`}>
            {JSON.stringify(getFeatureFlags(), null, 2)}
          </pre>
        </div>

        <div className="space-y-1">
          <p className={`font-mono text-[11px] ${DK.muted} mb-1`}>
            Custom Changelog Entries ({getDevkitChangelog().length})
          </p>
          {getDevkitChangelog().length === 0 ? (
            <p className={`font-mono text-xs ${DK.muted} px-3 py-2 bg-[#0d1117] rounded`}>
              No custom entries.
            </p>
          ) : (
            <div className="rounded bg-[#0d1117] divide-y divide-[#30363d]">
              {getDevkitChangelog().map((e) => {
                const total =
                  (e.en.features?.length ?? 0) +
                  (e.en.improvements?.length ?? 0) +
                  (e.en.fixes?.length ?? 0);
                return (
                  <div key={e.version} className="flex items-center gap-3 px-3 py-2">
                    <span className={`font-mono text-xs font-semibold ${DK.blue} w-16 shrink-0`}>
                      v{e.version}
                    </span>
                    <span className={`font-mono text-[11px] ${DK.muted} w-24 shrink-0`}>
                      {e.date}
                    </span>
                    <span className={`font-mono text-[11px] ${DK.muted}`}>{total} items</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
