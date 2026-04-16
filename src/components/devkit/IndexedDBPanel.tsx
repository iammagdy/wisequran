import { useEffect, useState } from "react";
import { getDB, clearAllData, clearAllTafsir, clearAllAudio, getAllSyncQueueEntries } from "@/lib/db";
import { DK, formatBytes } from "./devkit-utils";

interface StoreStats {
  surahs: number;
  azkar: number;
  audio: number;
  tafsir: number;
  syncQueue: number;
  audioBytes: number;
  surahBytes: number;
}

interface AudioEntry {
  id: string;
  reciterId: string;
  surahNumber: number;
  bytes: number;
}

export default function IndexedDBPanel() {
  const [stats, setStats] = useState<StoreStats | null>(null);
  const [audioEntries, setAudioEntries] = useState<AudioEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const db = await getDB();
      const [surahs, azkar, audio, tafsir] = await Promise.all([
        db.getAll("surahs"),
        db.getAll("azkar"),
        db.getAll("audio"),
        db.getAll("tafsir"),
      ]);
      const syncQueue = await getAllSyncQueueEntries();

      let surahBytes = 0;
      for (const s of surahs) surahBytes += new Blob([JSON.stringify(s)]).size;

      let audioBytes = 0;
      const ae: AudioEntry[] = [];
      for (const a of audio) {
        audioBytes += a.data.byteLength;
        ae.push({ id: a.id, reciterId: a.reciterId, surahNumber: a.surahNumber, bytes: a.data.byteLength });
      }
      ae.sort((a, b) => a.surahNumber - b.surahNumber);

      setStats({
        surahs: surahs.length,
        azkar: azkar.length,
        audio: audio.length,
        tafsir: tafsir.length,
        syncQueue: syncQueue.length,
        audioBytes,
        surahBytes,
      });
      setAudioEntries(ae);
    } catch (err) {
      console.error("[DevKit] IDB load error:", err);
    }
  };

  useEffect(() => {
    void load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  const act = async (fn: () => Promise<void>, label: string) => {
    if (!confirm(`${label}?`)) return;
    setLoading(true);
    try {
      await fn();
      await load();
    } finally {
      setLoading(false);
    }
  };

  const clearSyncQueue = async () => {
    if (!confirm("Clear all sync queue entries?")) return;
    setLoading(true);
    try {
      const db = await getDB();
      await db.clear("syncQueue");
      await load();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className={`rounded-lg p-4 ${DK.card}`}>
        <div className="flex items-center justify-between mb-4">
          <span className={`font-mono text-xs uppercase tracking-widest ${DK.muted}`}>Stores</span>
          <div className="flex gap-2">
            <button onClick={() => void load()} className={`${DK.btnBase} ${DK.btnGray}`}>↻</button>
            <button
              onClick={() => act(async () => { await clearAllData(); await clearAllTafsir(); await clearAllAudio(); }, "Clear ALL IndexedDB data")}
              disabled={loading}
              className={`${DK.btnBase} ${DK.btnRed}`}
            >
              Clear all IDB
            </button>
          </div>
        </div>

        {[
          { name: "surahs", count: stats?.surahs, bytes: stats?.surahBytes, clear: () => act(clearAllData, "Clear surahs + azkar + audio store") },
          { name: "azkar", count: stats?.azkar, bytes: null, clear: undefined },
          { name: "audio", count: stats?.audio, bytes: stats?.audioBytes, clear: () => act(clearAllAudio, "Clear all audio") },
          { name: "tafsir", count: stats?.tafsir, bytes: null, clear: () => act(clearAllTafsir, "Clear tafsir") },
          { name: "syncQueue", count: stats?.syncQueue, bytes: null, clear: clearSyncQueue },
        ].map(({ name, count, bytes, clear }) => (
          <div key={name} className={`flex items-center gap-4 py-2 border-b ${DK.border} last:border-0`}>
            <span className={`w-28 font-mono text-xs ${DK.blue}`}>{name}</span>
            <span className={`font-mono text-xs ${DK.text} flex-1`}>
              {count ?? "—"} records
              {bytes != null && count ? ` · ${formatBytes(bytes)}` : ""}
            </span>
            {clear && (
              <button
                onClick={clear}
                disabled={loading || !count}
                className={`${DK.btnBase} ${DK.btnRed}`}
              >
                Clear
              </button>
            )}
          </div>
        ))}
      </div>

      {audioEntries.length > 0 && (
        <div className={`rounded-lg p-4 ${DK.card}`}>
          <h3 className={`font-mono text-xs uppercase tracking-widest ${DK.muted} mb-3`}>
            Cached audio ({audioEntries.length} files · {formatBytes(audioEntries.reduce((s, a) => s + a.bytes, 0))})
          </h3>
          <div className="max-h-72 overflow-y-auto">
            {audioEntries.map((a) => (
              <div key={a.id} className={`flex items-center gap-3 py-1.5 border-b ${DK.border} last:border-0`}>
                <span className={`font-mono text-xs ${DK.muted} w-8`}>#{a.surahNumber}</span>
                <span className={`font-mono text-xs ${DK.text} flex-1 truncate`}>{a.reciterId}</span>
                <span className={`font-mono text-xs ${DK.green}`}>{formatBytes(a.bytes)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
