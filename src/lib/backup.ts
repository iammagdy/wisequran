import { getDB, addToSyncQueue, recalculateAudioBytes } from "@/lib/db";
import type { SyncQueueEntry } from "@/lib/db";

const WISE_LS_PREFIX = "wise-";
const BACKUP_VERSION = 2;
const SUPPORTED_VERSIONS = [1, 2] as const;

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

interface SurahEntry {
  number: number;
  ayahs: { number: number; text: string; numberInSurah: number }[];
}

interface TafsirEntry {
  id: string;
  editionId: string;
  surahNumber: number;
  ayahs: { numberInSurah: number; text: string }[];
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
    // v2+ optional offline text content. Audio is intentionally
    // excluded: ArrayBuffers can run into hundreds of MB and do not
    // round-trip through JSON without ballooning.
    surahs?: SurahEntry[];
    tafsir?: TafsirEntry[];
  };
}

export interface ExportOptions {
  includeOfflineContent?: boolean;
}

export async function exportBackup(options: ExportOptions = {}): Promise<BackupData> {
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

  const idb: BackupData["idb"] = {
    azkar,
    syncQueue,
    surahCount,
    audioCount,
    tafsirCount,
  };

  if (options.includeOfflineContent) {
    idb.surahs = await db.getAll("surahs");
    idb.tafsir = await db.getAll("tafsir");
  }

  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    localStorage: lsData,
    idb,
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
  surahsRestored: number;
  tafsirRestored: number;
}

function isAzkarEntry(value: unknown): value is AzkarEntry {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.category === "string" && Array.isArray(v.items);
}

function isSurahEntry(value: unknown): value is SurahEntry {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.number === "number" && Array.isArray(v.ayahs);
}

function isTafsirEntry(value: unknown): value is TafsirEntry {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.editionId === "string" &&
    typeof v.surahNumber === "number" &&
    Array.isArray(v.ayahs)
  );
}

export async function restoreBackup(data: BackupData): Promise<RestoreResult> {
  if (!SUPPORTED_VERSIONS.includes(data.version as (typeof SUPPORTED_VERSIONS)[number])) {
    throw new Error(`Unsupported backup version: ${data.version}`);
  }

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

  let syncQueueRestored = 0;
  if (Array.isArray(data.idb?.syncQueue)) {
    await db.clear("syncQueue");
    for (const entry of data.idb.syncQueue) {
      await addToSyncQueue(entry);
      syncQueueRestored++;
    }
  }

  let surahsRestored = 0;
  if (Array.isArray(data.idb?.surahs)) {
    await db.clear("surahs");
    for (const entry of data.idb.surahs) {
      if (isSurahEntry(entry)) {
        await db.put("surahs", entry);
        surahsRestored++;
      }
    }
  }

  let tafsirRestored = 0;
  if (Array.isArray(data.idb?.tafsir)) {
    await db.clear("tafsir");
    for (const entry of data.idb.tafsir) {
      if (isTafsirEntry(entry)) {
        await db.put("tafsir", entry);
        tafsirRestored++;
      }
    }
  }

  // The audio byte tracker lives in LS and may have been overwritten
  // by the restored snapshot. Recompute from the actual audio store
  // so storage stats stay accurate.
  await recalculateAudioBytes();

  return { lsKeysRestored, azkarRestored, syncQueueRestored, surahsRestored, tafsirRestored };
}

function validateBackupData(raw: unknown): raw is BackupData {
  if (!raw || typeof raw !== "object") return false;
  const r = raw as Record<string, unknown>;
  if (typeof r.version !== "number") return false;
  if (!SUPPORTED_VERSIONS.includes(r.version as (typeof SUPPORTED_VERSIONS)[number])) return false;
  if (typeof r.exportedAt !== "string") return false;
  if (!r.localStorage || typeof r.localStorage !== "object" || Array.isArray(r.localStorage)) return false;
  if (!r.idb || typeof r.idb !== "object" || Array.isArray(r.idb)) return false;
  const idb = r.idb as Record<string, unknown>;
  if (!Array.isArray(idb.azkar)) return false;
  if (!Array.isArray(idb.syncQueue)) return false;
  if (typeof idb.surahCount !== "number") return false;
  if (typeof idb.audioCount !== "number") return false;
  if (typeof idb.tafsirCount !== "number") return false;
  if (idb.surahs !== undefined && !Array.isArray(idb.surahs)) return false;
  if (idb.tafsir !== undefined && !Array.isArray(idb.tafsir)) return false;
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
