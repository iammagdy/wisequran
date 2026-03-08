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
    key: string; // composite key: "reciterId-surahNumber"
    value: {
      id: string;
      reciterId: string;
      surahNumber: number;
      data: ArrayBuffer;
    };
  };
}

const DB_NAME = "wise-quran-db";
const DB_VERSION = 3;

function audioKey(reciterId: string, surahNumber: number): string {
  return `${reciterId}-${surahNumber}`;
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
