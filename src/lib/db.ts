import { openDB, type DBSchema } from "idb";

export interface SyncQueueEntry {
  id?: number;
  table: string;
  operation: "upsert" | "insert";
  payload: Record<string, unknown>;
  onConflict?: string;
  timestamp: number;
  retryCount?: number;
}

export interface BookmarkRecord {
  id: string; // `${ownerKey}|${surah}:${ayah}` — owner-scoped so local records cannot leak across accounts on shared devices
  ownerKey: string; // `"u:"+userId` for signed-in users, `"d:"+deviceId` for anonymous
  surah: number;
  ayah: number;
  ayahText: string;
  surahName: string;
  note: string; // empty string when no note
  bookmarked: boolean; // true when the ayah is explicitly bookmarked
  createdAt: number;
  updatedAt: number;
}

interface WiseQuranDB extends DBSchema {
  surahs: {
    key: number;
    value: {
      number: number;
      ayahs: { number: number; text: string; numberInSurah: number }[];
    };
  };
  azkar: {
    key: string;
    value: {
      category: string;
      items: { id: string; text: string; translation: string; count: number }[];
    };
  };
  audio: {
    key: string;
    value: {
      id: string;
      reciterId: string;
      surahNumber: number;
      data: ArrayBuffer;
    };
  };
  tafsir: {
    key: string; // "editionId-surahNumber"
    value: {
      id: string;
      editionId: string;
      surahNumber: number;
      ayahs: { numberInSurah: number; text: string }[];
    };
  };
  syncQueue: {
    key: number;
    value: SyncQueueEntry;
  };
  bookmarks: {
    key: string;
    value: BookmarkRecord;
    indexes: { "by-updated": number; "by-owner": string };
  };
}

const DB_NAME = "wise-quran-db";
const DB_VERSION = 7;

function audioKey(reciterId: string, surahNumber: number): string {
  return `${reciterId}-${surahNumber}`;
}

function tafsirKey(editionId: string, surahNumber: number): string {
  return `${editionId}-${surahNumber}`;
}

let dbPromise: ReturnType<typeof openDB<WiseQuranDB>> | null = null;

export const V6_BOOKMARKS_BACKUP_LS_KEY = "wise-bookmarks-v6-backup";

function openDatabase() {
  return openDB<WiseQuranDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, _newVersion, transaction) {
      if (!db.objectStoreNames.contains("surahs")) {
        db.createObjectStore("surahs", { keyPath: "number" });
      }
      if (!db.objectStoreNames.contains("azkar")) {
        db.createObjectStore("azkar", { keyPath: "category" });
      }
      if (db.objectStoreNames.contains("audio") && oldVersion < 3) {
        db.deleteObjectStore("audio");
      }
      if (!db.objectStoreNames.contains("audio")) {
        db.createObjectStore("audio", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("tafsir")) {
        db.createObjectStore("tafsir", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("syncQueue")) {
        db.createObjectStore("syncQueue", { keyPath: "id", autoIncrement: true });
      }
      // v6 → v7: reshape bookmarks to be owner-scoped. Salvage the
      // (surah, ayah) pairs from any v6 rows into localStorage so the
      // post-boot migration in `bookmarks.ts` can re-import them under
      // the current anonymous owner — no data is silently lost.
      if (db.objectStoreNames.contains("bookmarks") && oldVersion < 7) {
        try {
          const oldStore = transaction.objectStore("bookmarks");
          const req = oldStore.getAll() as unknown as IDBRequest<Array<{ surah?: unknown; ayah?: unknown }>>;
          req.onsuccess = () => {
            try {
              const rows = req.result ?? [];
              const pairs = rows
                .map((r) => ({ surah: Number(r?.surah), ayah: Number(r?.ayah) }))
                .filter((p) => Number.isFinite(p.surah) && Number.isFinite(p.ayah) && p.surah >= 1 && p.ayah >= 1);
              if (pairs.length > 0) {
                localStorage.setItem(V6_BOOKMARKS_BACKUP_LS_KEY, JSON.stringify(pairs));
              }
            } catch {
              /* ignore */
            }
          };
        } catch {
          /* ignore */
        }
        db.deleteObjectStore("bookmarks");
        try {
          localStorage.removeItem("wise-bookmarks-migrated-v1");
        } catch {
          /* ignore */
        }
      }
      if (!db.objectStoreNames.contains("bookmarks")) {
        const bookmarksStore = db.createObjectStore("bookmarks", { keyPath: "id" });
        bookmarksStore.createIndex("by-updated", "updatedAt");
        bookmarksStore.createIndex("by-owner", "ownerKey");
      }
    },
  });
}

export async function getDB() {
  if (!dbPromise) {
    dbPromise = openDatabase().catch((err) => {
      dbPromise = null;
      throw err;
    });
  }
  return dbPromise;
}

export async function saveSurah(number: number, ayahs: any[]) {
  const db = await getDB();
  await db.put("surahs", { number, ayahs });
}

export async function getSurah(number: number) {
  const db = await getDB();
  return db.get("surahs", number);
}

export async function getAllDownloadedSurahs(): Promise<number[]> {
  const db = await getDB();
  const keys = await db.getAllKeys("surahs");
  return keys as number[];
}

export async function deleteSurah(number: number) {
  const db = await getDB();
  await db.delete("surahs", number);
}

// ── Audio byte tracking ────────────────────────────────────────────────────
// Store the running total in localStorage so getStorageStats() never has to
// load audio ArrayBuffers just to count bytes.
const AUDIO_BYTES_LS_KEY = "wise-audio-bytes-total";

function getTrackedAudioBytes(): number {
  return parseInt(localStorage.getItem(AUDIO_BYTES_LS_KEY) ?? "0", 10) || 0;
}
function addTrackedAudioBytes(n: number) {
  localStorage.setItem(AUDIO_BYTES_LS_KEY, String(getTrackedAudioBytes() + n));
}
function subtractTrackedAudioBytes(n: number) {
  localStorage.setItem(AUDIO_BYTES_LS_KEY, String(Math.max(0, getTrackedAudioBytes() - n)));
}
function resetTrackedAudioBytes() {
  localStorage.removeItem(AUDIO_BYTES_LS_KEY);
}

export async function saveAudio(reciterId: string, surahNumber: number, data: ArrayBuffer) {
  const db = await getDB();
  const key = audioKey(reciterId, surahNumber);
  // If overwriting, subtract old size first
  const existing = await db.get("audio", key);
  if (existing) subtractTrackedAudioBytes(existing.data.byteLength);
  await db.put("audio", { id: key, reciterId, surahNumber, data });
  addTrackedAudioBytes(data.byteLength);
}

export async function getAudio(reciterId: string, surahNumber: number) {
  const db = await getDB();
  return db.get("audio", audioKey(reciterId, surahNumber));
}

export async function deleteAudio(reciterId: string, surahNumber: number) {
  const db = await getDB();
  const key = audioKey(reciterId, surahNumber);
  const existing = await db.get("audio", key);
  if (existing) subtractTrackedAudioBytes(existing.data.byteLength);
  await db.delete("audio", key);
}

/**
 * Returns downloaded surah numbers for a given reciter using key-only scan
 * (never loads ArrayBuffer data — fast O(n) over keys, not values).
 */
export async function getAllDownloadedAudio(reciterId: string): Promise<number[]> {
  const db = await getDB();
  const prefix = reciterId + "-";
  const allKeys = (await db.getAllKeys("audio")) as string[];
  return allKeys
    .filter((k) => k.startsWith(prefix))
    .map((k) => parseInt(k.slice(prefix.length), 10))
    .filter((n) => !isNaN(n));
}

export async function getAllAudioEntries() {
  const db = await getDB();
  return db.getAll("audio");
}

export async function clearAllAudio() {
  const db = await getDB();
  await db.clear("audio");
  resetTrackedAudioBytes();
}

/**
 * Scan every audio row and rewrite the LS byte tracker from scratch.
 * Use this when the tracker drifts from reality (e.g. backup restore,
 * crash during save, manual IDB tampering).
 */
export async function recalculateAudioBytes(): Promise<number> {
  const db = await getDB();
  const all = await db.getAll("audio");
  let total = 0;
  for (const row of all) {
    total += row.data?.byteLength ?? 0;
  }
  localStorage.setItem(AUDIO_BYTES_LS_KEY, String(total));
  return total;
}

export async function clearAllData() {
  const db = await getDB();
  await db.clear("surahs");
  await db.clear("azkar");
  await db.clear("audio");
  resetTrackedAudioBytes();
}

export async function clearSurahsStore() {
  const db = await getDB();
  await db.clear("surahs");
}

export async function clearAzkarStore() {
  const db = await getDB();
  await db.clear("azkar");
}

export async function clearAllTafsir() {
  const db = await getDB();
  await db.clear("tafsir");
}

export async function addToSyncQueue(entry: Omit<SyncQueueEntry, "id">): Promise<void> {
  const db = await getDB();
  await db.add("syncQueue", entry as SyncQueueEntry);
}

export async function getAllSyncQueueEntries(): Promise<SyncQueueEntry[]> {
  const db = await getDB();
  return db.getAll("syncQueue");
}

export async function deleteSyncQueueEntry(id: number): Promise<void> {
  const db = await getDB();
  await db.delete("syncQueue", id);
}

export async function getSyncQueueCount(): Promise<number> {
  const db = await getDB();
  return db.count("syncQueue");
}

// ── Bookmarks + Notes ─────────────────────────────────────────────────────
// Bookmarks are owner-scoped: each record carries an `ownerKey`
// (`"u:"+userId` when signed in, `"d:"+deviceId` otherwise) and the IDB
// key is `${ownerKey}|${surah}:${ayah}`. This prevents local records
// from leaking across accounts on shared devices — signing out of one
// account and into another on the same browser only exposes the newly
// signed-in user's records.

export function bookmarkKey(ownerKey: string, surah: number, ayah: number): string {
  return `${ownerKey}|${surah}:${ayah}`;
}

export async function getBookmark(
  ownerKey: string,
  surah: number,
  ayah: number,
): Promise<BookmarkRecord | undefined> {
  const db = await getDB();
  return db.get("bookmarks", bookmarkKey(ownerKey, surah, ayah));
}

export async function putBookmark(record: BookmarkRecord): Promise<void> {
  const db = await getDB();
  await db.put("bookmarks", record);
}

export async function deleteBookmark(
  ownerKey: string,
  surah: number,
  ayah: number,
): Promise<void> {
  const db = await getDB();
  await db.delete("bookmarks", bookmarkKey(ownerKey, surah, ayah));
}

export async function getBookmarksForOwner(ownerKey: string): Promise<BookmarkRecord[]> {
  const db = await getDB();
  return db.getAllFromIndex("bookmarks", "by-owner", ownerKey);
}

export async function getAllBookmarks(): Promise<BookmarkRecord[]> {
  const db = await getDB();
  return db.getAll("bookmarks");
}

export async function clearAllBookmarks(): Promise<void> {
  const db = await getDB();
  await db.clear("bookmarks");
}

export async function clearBookmarksForOwner(ownerKey: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("bookmarks", "readwrite");
  const index = tx.store.index("by-owner");
  for await (const cursor of index.iterate(ownerKey)) {
    await cursor.delete();
  }
  await tx.done;
}

export async function saveTafsir(editionId: string, surahNumber: number, ayahs: { numberInSurah: number; text: string }[]) {
  const db = await getDB();
  await db.put("tafsir", { id: tafsirKey(editionId, surahNumber), editionId, surahNumber, ayahs });
}

export async function getTafsir(editionId: string, surahNumber: number) {
  const db = await getDB();
  return db.get("tafsir", tafsirKey(editionId, surahNumber));
}

/**
 * Check available storage quota and return usage information
 */
export async function checkStorageQuota(): Promise<{
  usage: number;
  quota: number;
  available: number;
  percentUsed: number;
  hasEnoughSpace: (requiredBytes: number) => boolean;
}> {
  if (!navigator.storage || !navigator.storage.estimate) {
    return {
      usage: 0,
      quota: 0,
      available: 0,
      percentUsed: 0,
      hasEnoughSpace: () => true,
    };
  }

  try {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    const available = quota - usage;
    const percentUsed = quota > 0 ? (usage / quota) * 100 : 0;

    return {
      usage,
      quota,
      available,
      percentUsed,
      hasEnoughSpace: (requiredBytes: number) => available > requiredBytes * 1.1,
    };
  } catch {
    return {
      usage: 0,
      quota: 0,
      available: 0,
      percentUsed: 0,
      hasEnoughSpace: () => true,
    };
  }
}

/**
 * Calculate storage usage breakdown.
 *
 * Fast path: audio bytes are read from the localStorage tracker
 * (updated by saveAudio/deleteAudio/clearAllAudio) so we never
 * have to load audio ArrayBuffers just to count bytes.
 * Surah and tafsir text sizes are computed from their (small) JSON.
 */
export async function getStorageStats(): Promise<{
  quranText: number;
  audio: number;
  tafsir: number;
  total: number;
  audioCount: number;
  surahCount: number;
  tafsirCount: number;
}> {
  const db = await getDB();

  // Use key-only queries where possible — no data loaded
  const [surahKeys, audioKeys, tafsirKeys] = await Promise.all([
    db.getAllKeys("surahs"),
    db.getAllKeys("audio"),
    db.getAllKeys("tafsir"),
  ]);

  // Surah text: read data only for text size (small JSON, no ArrayBuffers)
  const allSurahs = await db.getAll("surahs");
  let quranText = 0;
  for (const s of allSurahs) {
    quranText += new Blob([JSON.stringify(s)]).size;
  }

  // Audio: read from localStorage tracker — O(1), no IDB data read
  const audio = getTrackedAudioBytes();

  // Tafsir: small JSON, read for size
  const allTafsir = await db.getAll("tafsir");
  let tafsir = 0;
  for (const t of allTafsir) {
    tafsir += new Blob([JSON.stringify(t)]).size;
  }

  return {
    quranText,
    audio,
    tafsir,
    total: quranText + audio + tafsir,
    audioCount: audioKeys.length,
    surahCount: surahKeys.length,
    tafsirCount: tafsirKeys.length,
  };
}

/**
 * Verify that a specific audio file exists and has valid data in IndexedDB
 */
export async function verifyAudioExists(reciterId: string, surahNumber: number): Promise<boolean> {
  try {
    const db = await getDB();
    const entry = await db.get("audio", audioKey(reciterId, surahNumber));
    return !!(entry && entry.data && entry.data.byteLength > 0);
  } catch {
    return false;
  }
}

/**
 * Verify that a specific surah text exists and has ayahs in IndexedDB
 */
export async function verifySurahExists(surahNumber: number): Promise<boolean> {
  try {
    const db = await getDB();
    const entry = await db.get("surahs", surahNumber);
    return !!(entry && entry.ayahs && entry.ayahs.length > 0);
  } catch {
    return false;
  }
}

/**
 * Bulk verify all downloaded audio files and return list of broken surah numbers
 */
export async function verifyAllAudio(reciterId: string): Promise<{
  valid: number[];
  broken: number[];
}> {
  const db = await getDB();
  const all = await db.getAll("audio");
  const reciterAudio = all.filter((a) => a.reciterId === reciterId);
  
  const valid: number[] = [];
  const broken: number[] = [];
  const deletePromises: Promise<void>[] = [];
  
  for (const entry of reciterAudio) {
    if (entry.data && entry.data.byteLength > 0) {
      valid.push(entry.surahNumber);
    } else {
      broken.push(entry.surahNumber);
      // Clean up broken entry
      deletePromises.push(db.delete("audio", entry.id));
    }
  }

  if (deletePromises.length > 0) {
    await Promise.all(deletePromises);
  }
  
  return { valid, broken };
}

/**
 * Bulk verify all downloaded surah texts and return list of broken surah numbers
 */
export async function verifyAllSurahs(): Promise<{
  valid: number[];
  broken: number[];
}> {
  const db = await getDB();
  const all = await db.getAll("surahs");
  
  const valid: number[] = [];
  const broken: number[] = [];
  const deletePromises: Promise<void>[] = [];
  
  for (const entry of all) {
    if (entry.ayahs && entry.ayahs.length > 0) {
      valid.push(entry.number);
    } else {
      broken.push(entry.number);
      deletePromises.push(db.delete("surahs", entry.number));
    }
  }

  if (deletePromises.length > 0) {
    await Promise.all(deletePromises);
  }
  
  return { valid, broken };
}
