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
    key: number;
    value: {
      surahNumber: number;
      data: ArrayBuffer;
    };
  };
}

const DB_NAME = "wise-quran-db";
const DB_VERSION = 2;

export async function getDB() {
  return openDB<WiseQuranDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("surahs")) {
        db.createObjectStore("surahs", { keyPath: "number" });
      }
      if (!db.objectStoreNames.contains("azkar")) {
        db.createObjectStore("azkar", { keyPath: "category" });
      }
      if (!db.objectStoreNames.contains("audio")) {
        db.createObjectStore("audio", { keyPath: "surahNumber" });
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

export async function clearAllData() {
  const db = await getDB();
  await db.clear("surahs");
  await db.clear("azkar");
}
