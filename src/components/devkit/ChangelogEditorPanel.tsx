import { useState, useEffect } from "react";
import { DK } from "./devkit-utils";
import { changelog as staticChangelog, type ChangelogEntry, type ChangelogCategory } from "@/data/changelog";
import {
  getDevkitChangelog,
  setDevkitChangelog,
  DEVKIT_CHANGELOG_KEY,
  getEffectiveVersion,
  setEffectiveVersion,
  clearEffectiveVersionOverride,
  DEVKIT_CURRENT_VERSION_KEY,
} from "@/lib/changelog-overrides";
import { APP_VERSION } from "@/data/changelog";

type CatKey = keyof ChangelogCategory;
const CAT_KEYS: CatKey[] = ["features", "improvements", "fixes"];
const CAT_LABELS: Record<CatKey, { en: string; ar: string }> = {
  features:     { en: "Features",     ar: "مميزات" },
  improvements: { en: "Improvements", ar: "تحسينات" },
  fixes:        { en: "Fixes",        ar: "إصلاحات" },
};

interface FormState {
  version: string;
  date: string;
  en: Record<CatKey, string>;
  ar: Record<CatKey, string>;
}

function blankForm(): FormState {
  return {
    version: "",
    date: new Date().toISOString().slice(0, 10),
    en: { features: "", improvements: "", fixes: "" },
    ar: { features: "", improvements: "", fixes: "" },
  };
}

function entryToForm(e: ChangelogEntry): FormState {
  const lines = (items?: string[]) => (items ?? []).join("\n");
  return {
    version: e.version,
    date: e.date,
    en: { features: lines(e.en.features), improvements: lines(e.en.improvements), fixes: lines(e.en.fixes) },
    ar: { features: lines(e.ar.features), improvements: lines(e.ar.improvements), fixes: lines(e.ar.fixes) },
  };
}

function formToEntry(f: FormState): ChangelogEntry {
  const parseLines = (text: string) =>
    text.split("\n").map((s) => s.trim()).filter(Boolean);
  const buildCat = (lang: Record<CatKey, string>): ChangelogCategory => {
    const cat: ChangelogCategory = {};
    for (const k of CAT_KEYS) {
      const items = parseLines(lang[k]);
      if (items.length) cat[k] = items;
    }
    return cat;
  };
  return {
    version: f.version.trim(),
    date: f.date,
    en: buildCat(f.en),
    ar: buildCat(f.ar),
  };
}

function EntryForm({
  form,
  setForm,
  onSave,
  onCancel,
  isEditing,
}: {
  form: FormState;
  setForm: (f: FormState) => void;
  onSave: () => void;
  onCancel: () => void;
  isEditing: boolean;
}) {
  return (
    <div className={`rounded-lg ${DK.card} p-4 space-y-4`}>
      <p className={`font-mono text-xs font-semibold ${DK.text}`}>
        {isEditing ? `Editing v${form.version}` : "New Changelog Entry"}
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={`font-mono text-[11px] ${DK.muted} block mb-1`}>Version</label>
          <input
            value={form.version}
            onChange={(e) => setForm({ ...form, version: e.target.value })}
            placeholder="e.g. 3.6.0"
            className={`w-full font-mono text-xs px-3 py-2 rounded bg-[#0d1117] ${DK.text} border ${DK.border} outline-none focus:border-[#388bfd]`}
          />
        </div>
        <div>
          <label className={`font-mono text-[11px] ${DK.muted} block mb-1`}>Date</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className={`w-full font-mono text-xs px-3 py-2 rounded bg-[#0d1117] ${DK.text} border ${DK.border} outline-none focus:border-[#388bfd]`}
          />
        </div>
      </div>

      {(["en", "ar"] as const).map((lang) => (
        <div key={lang}>
          <p className={`font-mono text-xs font-semibold ${DK.blue} mb-2`}>
            {lang === "en" ? "English" : "Arabic (العربية)"}
          </p>
          <div className="space-y-2">
            {CAT_KEYS.map((cat) => (
              <div key={cat}>
                <label className={`font-mono text-[11px] ${DK.muted} block mb-1`}>
                  {lang === "en" ? CAT_LABELS[cat].en : CAT_LABELS[cat].ar} — one line per item
                </label>
                <textarea
                  value={form[lang][cat]}
                  onChange={(e) =>
                    setForm({ ...form, [lang]: { ...form[lang], [cat]: e.target.value } })
                  }
                  rows={2}
                  dir={lang === "ar" ? "rtl" : "ltr"}
                  placeholder={`Each line = one item`}
                  className={`w-full font-mono text-xs px-3 py-2 rounded bg-[#0d1117] ${DK.text} border ${DK.border} outline-none focus:border-[#388bfd] resize-y`}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-2 pt-1">
        <button onClick={onSave} className={`${DK.btnBase} ${DK.btnGreen}`}>
          {isEditing ? "Update Entry" : "Save Entry"}
        </button>
        <button onClick={onCancel} className={`${DK.btnBase} ${DK.btnGray}`}>
          Cancel
        </button>
        <p className={`font-mono text-[11px] ${DK.muted} ml-auto`}>
          Appears in-app after next reload
        </p>
      </div>
    </div>
  );
}

function EntryRow({
  entry,
  isDevKit,
  isCurrent,
  onEdit,
  onDelete,
  onSetCurrent,
}: {
  entry: ChangelogEntry;
  isDevKit: boolean;
  isCurrent: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onSetCurrent?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const total =
    (entry.en.features?.length ?? 0) +
    (entry.en.improvements?.length ?? 0) +
    (entry.en.fixes?.length ?? 0);

  return (
    <div>
      <div
        className="flex items-center gap-3 px-4 py-2.5 cursor-pointer group hover:bg-[#21262d] transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <span className={`font-mono text-xs font-semibold ${DK.blue} w-16 shrink-0`}>
          v{entry.version}
        </span>
        <span className={`font-mono text-[11px] ${DK.muted} w-24 shrink-0`}>{entry.date}</span>
        <span className={`font-mono text-[11px] ${DK.muted} flex-1`}>{total} items</span>
        {isCurrent && (
          <span className={`font-mono text-[10px] ${DK.yellow} shrink-0 mr-1`} title="This is the effective current version">
            ★ current
          </span>
        )}
        <div
          className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          {onSetCurrent && !isCurrent && (
            <button
              onClick={onSetCurrent}
              className={`${DK.btnBase} ${DK.btnGray} px-2 py-0.5 text-[11px]`}
              title="Mark as the current version shown in the app"
            >
              ★ Set current
            </button>
          )}
          {isDevKit ? (
            <>
              {onEdit && (
                <button
                  onClick={onEdit}
                  className={`${DK.btnBase} ${DK.btnGray} px-2 py-0.5 text-[11px]`}
                >
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  onClick={onDelete}
                  className={`${DK.btnBase} ${DK.btnRed} px-2 py-0.5 text-[11px]`}
                >
                  ×
                </button>
              )}
            </>
          ) : (
            <span className={`font-mono text-[10px] ${DK.subtle} shrink-0`}>built-in</span>
          )}
        </div>
        <span className={`font-mono text-[10px] ${DK.muted} ml-1`}>{expanded ? "▲" : "▼"}</span>
      </div>

      {expanded && (
        <div className="px-4 pb-3 pt-1 bg-[#0d1117] space-y-2">
          {CAT_KEYS.map((cat) => {
            const items = entry.en[cat];
            if (!items || items.length === 0) return null;
            return (
              <div key={cat}>
                <p className={`font-mono text-[10px] uppercase tracking-widest ${DK.muted} mb-1`}>
                  {CAT_LABELS[cat].en}
                </p>
                <ul className="space-y-0.5">
                  {items.map((item, i) => (
                    <li
                      key={i}
                      className={`font-mono text-xs ${DK.text} pl-2 border-l-2 border-[#388bfd]/40`}
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ChangelogEditorPanel() {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [effectiveVer, setEffectiveVer] = useState(() => getEffectiveVersion());
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<FormState>(blankForm());
  const [toast, setToast] = useState("");

  const load = () => {
    setEntries(getDevkitChangelog());
    setEffectiveVer(getEffectiveVersion());
  };

  useEffect(() => {
    load();
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ key?: string }>;
      if (
        !ce.detail?.key ||
        ce.detail.key === DEVKIT_CHANGELOG_KEY ||
        ce.detail.key === DEVKIT_CURRENT_VERSION_KEY
      ) {
        load();
      }
    };
    window.addEventListener("local-storage-sync", handler);
    return () => window.removeEventListener("local-storage-sync", handler);
  }, []);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const save = () => {
    const entry = formToEntry(form);
    if (!entry.version) return flash("❌ Version string is required");
    const others = entries.filter((e) => e.version !== editing);
    setDevkitChangelog([entry, ...others]);
    setEditing(null);
    setAdding(false);
    setForm(blankForm());
    flash(`✓ Saved v${entry.version}`);
    load();
  };

  const del = (version: string) => {
    if (!confirm(`Delete changelog entry v${version}?`)) return;
    setDevkitChangelog(entries.filter((e) => e.version !== version));
    flash(`✓ Deleted v${version}`);
    load();
  };

  const startEdit = (entry: ChangelogEntry) => {
    setEditing(entry.version);
    setAdding(false);
    setForm(entryToForm(entry));
  };

  const cancel = () => {
    setEditing(null);
    setAdding(false);
    setForm(blankForm());
  };

  const setCurrent = (version: string) => {
    setEffectiveVersion(version);
    setEffectiveVer(version);
    flash(`✓ Current version set to v${version}`);
  };

  const resetCurrentVersion = () => {
    clearEffectiveVersionOverride();
    setEffectiveVer(APP_VERSION);
    flash(`✓ Reset to static v${APP_VERSION}`);
  };

  const isFormOpen = adding || editing !== null;
  const devkitVersions = new Set(entries.map((e) => e.version));
  const staticEntries = staticChangelog.filter((e) => !devkitVersions.has(e.version));
  const isVersionOverridden = effectiveVer !== APP_VERSION;

  return (
    <div className="space-y-4">
      {/* Current version status bar */}
      <div className={`rounded-lg ${DK.card} px-4 py-3 flex items-center gap-3`}>
        <div className="flex-1">
          <p className={`font-mono text-[11px] uppercase tracking-widest ${DK.muted} mb-0.5`}>
            Effective current version
          </p>
          <p className={`font-mono text-sm font-bold ${isVersionOverridden ? DK.yellow : DK.text}`}>
            v{effectiveVer}
            {isVersionOverridden && (
              <span className={`ml-2 font-mono text-[10px] ${DK.muted}`}>
                (static: v{APP_VERSION})
              </span>
            )}
          </p>
        </div>
        {isVersionOverridden && (
          <button
            onClick={resetCurrentVersion}
            className={`${DK.btnBase} ${DK.btnGray} text-[11px]`}
          >
            Reset to v{APP_VERSION}
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
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
            DevKit entries layer on top of static ones. Reload the app to see changes.
          </p>
        )}
        <button
          onClick={() => { setAdding(true); setEditing(null); setForm(blankForm()); }}
          disabled={isFormOpen}
          className={`${DK.btnBase} ${DK.btnGreen} shrink-0`}
        >
          + New Entry
        </button>
      </div>

      {/* Add / Edit form */}
      {isFormOpen && (
        <EntryForm
          form={form}
          setForm={setForm}
          onSave={save}
          onCancel={cancel}
          isEditing={editing !== null}
        />
      )}

      {/* DevKit-authored entries */}
      {entries.length > 0 && (
        <div className={`rounded-lg ${DK.card} overflow-hidden`}>
          <div className={`px-4 py-2.5 border-b ${DK.border} flex items-center gap-2`}>
            <span className={`font-mono text-[11px] uppercase tracking-widest ${DK.muted}`}>
              DevKit entries
            </span>
            <span className={`font-mono text-xs ${DK.green} ml-auto`}>
              {entries.length} custom
            </span>
          </div>
          <div className="divide-y divide-[#30363d]">
            {entries.map((e) => (
              <EntryRow
                key={e.version}
                entry={e}
                isDevKit
                isCurrent={e.version === effectiveVer}
                onSetCurrent={!isFormOpen ? () => setCurrent(e.version) : undefined}
                onEdit={!isFormOpen ? () => startEdit(e) : undefined}
                onDelete={!isFormOpen ? () => del(e.version) : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {/* Static / built-in entries (read-only) */}
      <div className={`rounded-lg ${DK.card} overflow-hidden`}>
        <div className={`px-4 py-2.5 border-b ${DK.border} flex items-center gap-2`}>
          <span className={`font-mono text-[11px] uppercase tracking-widest ${DK.muted}`}>
            Built-in entries
          </span>
          <span className={`font-mono text-xs ${DK.subtle} ml-auto`}>
            {staticEntries.length} read-only
          </span>
        </div>
        <div className="divide-y divide-[#30363d]">
          {staticEntries.map((e) => (
            <EntryRow
              key={e.version}
              entry={e}
              isDevKit={false}
              isCurrent={e.version === effectiveVer}
              onSetCurrent={!isFormOpen ? () => setCurrent(e.version) : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
