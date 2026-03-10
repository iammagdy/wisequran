import { openDB, type DBSchema } from "idb";

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
}

const DB_NAME = "wise-quran-db";
const DB_VERSION = 4;

function audioKey(reciterId: string, surahNumber: number): string {
  return `${reciterId}-${surahNumber}`;
}

function tafsirKey(editionId: string, surahNumber: number): string {
  return `${editionId}-${surahNumber}`;
}

export async function getDB() {
  return openDB<WiseQuranDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (!db.objectStoreNames.contains("surahs")) {
        db.createObjectStore("surahs", { keyPath: "number" });
      }
      if (!db.objectStoreNames.contains("azkar")) {
        db.createObjectStore("azkar", { keyPath: "category" });
      }
      // v2->v3: recreate audio store with string key
      if (db.objectStoreNames.contains("audio") && oldVersion < 3) {
        db.deleteObjectStore("audio");
      }
      if (!db.objectStoreNames.contains("audio")) {
        db.createObjectStore("audio", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("tafsir")) {
        db.createObjectStore("tafsir", { keyPath: "id" });
      }
    },
  });
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

export async function saveAudio(reciterId: string, surahNumber: number, data: ArrayBuffer) {
  const db = await getDB();
  await db.put("audio", { id: audioKey(reciterId, surahNumber), reciterId, surahNumber, data });
}

export async function getAudio(reciterId: string, surahNumber: number) {
  const db = await getDB();
  return db.get("audio", audioKey(reciterId, surahNumber));
}

export async function deleteAudio(reciterId: string, surahNumber: number) {
  const db = await getDB();
  await db.delete("audio", audioKey(reciterId, surahNumber));
}

export async function getAllDownloadedAudio(reciterId: string): Promise<number[]> {
  const db = await getDB();
  const all = await db.getAll("audio");
  return all.filter((a) => a.reciterId === reciterId).map((a) => a.surahNumber);
}

export async function clearAllAudio() {
  const db = await getDB();
  await db.clear("audio");
}

export async function clearAllData() {
  const db = await getDB();
  await db.clear("surahs");
  await db.clear("azkar");
  await db.clear("audio");
}

export async function clearAllTafsir() {
  const db = await getDB();
  await db.clear("tafsir");
}

export async function saveTafsir(editionId: string, surahNumber: number, ayahs: { numberInSurah: number; text: string }[]) {
  const db = await getDB();
  await db.put("tafsir", { id: tafsirKey(editionId, surahNumber), editionId, surahNumber, ayahs });
}

export async function getTafsir(editionId: string, surahNumber: number) {
  const db = await getDB();
  return db.get("tafsir", tafsirKey(editionId, surahNumber));
}

/** Calculate storage usage breakdown in bytes */
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

  // Quran text
  const allSurahs = await db.getAll("surahs");
  let quranText = 0;
  for (const s of allSurahs) {
    quranText += new Blob([JSON.stringify(s)]).size;
  }

  // Audio
  const allAudio = await db.getAll("audio");
  let audio = 0;
  for (const a of allAudio) {
    audio += a.data.byteLength;
  }

  // Tafsir
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
    audioCount: allAudio.length,
    surahCount: allSurahs.length,
    tafsirCount: allTafsir.length,
  };
}
