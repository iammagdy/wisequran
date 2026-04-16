import { getDB, addToSyncQueue } from "@/lib/db";
import type { SyncQueueEntry } from "@/lib/db";

const WISE_LS_PREFIX = "wise-";
const BACKUP_VERSION = 1;

interface AzkarItem {
  id: string;
  text: string;
  translation: string;
  count: number;
}

interface AzkarEntry {
  category: string;
  items: AzkarItem[];
}

export interface BackupData {
  version: number;
  exportedAt: string;
  localStorage: Record<string, string>;
  idb: {
    azkar: AzkarEntry[];
    syncQueue: SyncQueueEntry[];
    surahCount: number;
    audioCount: number;
    tafsirCount: number;
  };
}

export async function exportBackup(): Promise<BackupData> {
  const lsData: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(WISE_LS_PREFIX)) {
      lsData[key] = localStorage.getItem(key) ?? "";
    }
  }

  const db = await getDB();

  const azkar = await db.getAll("azkar");
  const syncQueueRaw = await db.getAll("syncQueue");
  const surahCount = await db.count("surahs");
  const audioCount = await db.count("audio");
  const tafsirCount = await db.count("tafsir");

  const syncQueue: SyncQueueEntry[] = syncQueueRaw.map(
    ({ id: _id, ...rest }): SyncQueueEntry => rest as SyncQueueEntry,
  );

  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    localStorage: lsData,
    idb: {
      azkar,
      syncQueue,
      surahCount,
      audioCount,
      tafsirCount,
    },
  };
}

export function downloadBackupFile(data: BackupData): void {
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `wise-quran-backup-${dateStr}.json`;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export interface RestoreResult {
  lsKeysRestored: number;
  azkarRestored: number;
  syncQueueRestored: number;
}

function isAzkarEntry(value: unknown): value is AzkarEntry {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.category === "string" && Array.isArray(v.items);
}

export async function restoreBackup(data: BackupData): Promise<RestoreResult> {
  if (data.version !== BACKUP_VERSION) {
    throw new Error(`Unsupported backup version: ${data.version}`);
  }

  // Clear all existing wise-* keys so restore is a clean snapshot, not a merge
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(WISE_LS_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  for (const key of keysToRemove) {
    localStorage.removeItem(key);
  }

  let lsKeysRestored = 0;
  for (const [key, value] of Object.entries(data.localStorage)) {
    if (key.startsWith(WISE_LS_PREFIX)) {
      localStorage.setItem(key, value);
      lsKeysRestored++;
    }
  }

  const db = await getDB();

  let azkarRestored = 0;
  if (Array.isArray(data.idb?.azkar)) {
    await db.clear("azkar");
    for (const entry of data.idb.azkar) {
      if (isAzkarEntry(entry)) {
        await db.put("azkar", entry);
        azkarRestored++;
      }
    }
  }

  // Always restore the sync queue from backup (even when empty) so no stale
  // writes from the previous state carry forward
  if (Array.isArray(data.idb?.syncQueue)) {
    await db.clear("syncQueue");
    let syncQueueRestored = 0;
    for (const entry of data.idb.syncQueue) {
      await addToSyncQueue(entry);
      syncQueueRestored++;
    }
    return { lsKeysRestored, azkarRestored, syncQueueRestored };
  }

  return { lsKeysRestored, azkarRestored, syncQueueRestored: 0 };
}

function validateBackupData(raw: unknown): raw is BackupData {
  if (!raw || typeof raw !== "object") return false;
  const r = raw as Record<string, unknown>;
  if (r.version !== BACKUP_VERSION) return false;
  if (typeof r.exportedAt !== "string") return false;
  if (!r.localStorage || typeof r.localStorage !== "object" || Array.isArray(r.localStorage)) return false;
  if (!r.idb || typeof r.idb !== "object" || Array.isArray(r.idb)) return false;
  const idb = r.idb as Record<string, unknown>;
  if (!Array.isArray(idb.azkar)) return false;
  if (!Array.isArray(idb.syncQueue)) return false;
  if (typeof idb.surahCount !== "number") return false;
  if (typeof idb.audioCount !== "number") return false;
  if (typeof idb.tafsirCount !== "number") return false;
  return true;
}

export function parseBackupFile(file: File): Promise<BackupData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const raw: unknown = JSON.parse(e.target?.result as string);
        if (!validateBackupData(raw)) {
          reject(new Error("Invalid or incompatible backup file (version mismatch or missing fields)"));
          return;
        }
        resolve(raw);
      } catch {
        reject(new Error("Failed to parse backup file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}
