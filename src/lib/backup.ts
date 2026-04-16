import { getDB, addToSyncQueue, recalculateAudioBytes, saveAudio } from "@/lib/db";
import type { SyncQueueEntry } from "@/lib/db";

const WISE_LS_PREFIX = "wise-";
const BACKUP_VERSION = 2;
const SUPPORTED_VERSIONS = [1, 2] as const;
// base64 inflates bytes by ~4/3; applied to audio size estimates.
const BASE64_OVERHEAD = 4 / 3;

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, Math.min(i + chunk, bytes.length))),
    );
  }
  return btoa(binary);
}

function base64ToBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

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

interface AudioEntry {
  id: string;
  reciterId: string;
  surahNumber: number;
  // base64-encoded ArrayBuffer; decoded by restoreBackup.
  data: string;
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
    // v2+ optional offline content. Audio blobs are base64-encoded
    // inline; large, but the only format that round-trips through
    // JSON without adding a ZIP dependency. Users can choose to
    // exclude audio via the export options.
    surahs?: SurahEntry[];
    tafsir?: TafsirEntry[];
    audio?: AudioEntry[];
  };
}

export interface ExportOptions {
  includeOfflineContent?: boolean;
  includeAudio?: boolean;
}

export interface BackupSizeEstimate {
  totalBytes: number;
  localStorageBytes: number;
  surahsBytes: number;
  tafsirBytes: number;
  audioBytes: number;
  azkarBytes: number;
}

/**
 * Estimates the on-disk size of a backup before export so the UI can
 * warn the user about large archives (especially when audio is
 * included). Does not serialize; counts bytes using IDB metadata and
 * LS string lengths.
 */
export async function estimateBackupSize(options: ExportOptions = {}): Promise<BackupSizeEstimate> {
  let lsBytes = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(WISE_LS_PREFIX)) continue;
    const value = localStorage.getItem(key) ?? "";
    lsBytes += key.length + value.length;
  }

  const db = await getDB();
  const azkar = await db.getAll("azkar");
  const azkarBytes = new Blob([JSON.stringify(azkar)]).size;

  let surahsBytes = 0;
  let tafsirBytes = 0;
  let audioBytes = 0;

  if (options.includeOfflineContent) {
    const surahs = await db.getAll("surahs");
    surahsBytes = new Blob([JSON.stringify(surahs)]).size;
    const tafsir = await db.getAll("tafsir");
    tafsirBytes = new Blob([JSON.stringify(tafsir)]).size;
  }

  if (options.includeAudio) {
    const audioKeys = (await db.getAllKeys("audio")) as string[];
    // Pull each row lazily — byteLength is on the wrapped object, but
    // getAllKeys doesn't give us sizes. Fall back to the LS tracker
    // for an O(1) estimate when available.
    const tracked = parseInt(localStorage.getItem("wise-audio-bytes-total") ?? "0", 10) || 0;
    if (tracked > 0) {
      audioBytes = Math.round(tracked * BASE64_OVERHEAD);
    } else {
      for (const key of audioKeys) {
        const row = await db.get("audio", key);
        if (row?.data) audioBytes += Math.round(row.data.byteLength * BASE64_OVERHEAD);
      }
    }
  }

  return {
    totalBytes: lsBytes + azkarBytes + surahsBytes + tafsirBytes + audioBytes,
    localStorageBytes: lsBytes,
    surahsBytes,
    tafsirBytes,
    audioBytes,
    azkarBytes,
  };
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

  if (options.includeAudio) {
    const rows = await db.getAll("audio");
    idb.audio = rows.map((r) => ({
      id: r.id,
      reciterId: r.reciterId,
      surahNumber: r.surahNumber,
      data: bufferToBase64(r.data),
    }));
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
  audioRestored: number;
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

function isAudioEntry(value: unknown): value is AudioEntry {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.reciterId === "string" &&
    typeof v.surahNumber === "number" &&
    typeof v.data === "string"
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

  let audioRestored = 0;
  if (Array.isArray(data.idb?.audio)) {
    await db.clear("audio");
    for (const entry of data.idb.audio) {
      if (!isAudioEntry(entry)) continue;
      try {
        const buffer = base64ToBuffer(entry.data);
        await saveAudio(entry.reciterId, entry.surahNumber, buffer);
        audioRestored++;
      } catch {
        // Skip malformed audio entries; keep restoring the rest.
      }
    }
  }

  // The audio byte tracker lives in LS and may have been overwritten
  // by the restored snapshot. Recompute from the actual audio store
  // so storage stats stay accurate.
  await recalculateAudioBytes();

  return {
    lsKeysRestored,
    azkarRestored,
    syncQueueRestored,
    surahsRestored,
    tafsirRestored,
    audioRestored,
  };
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
