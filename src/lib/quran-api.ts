import { getSurah, saveSurah } from "./db";

const API_BASE = "https://api.alquran.cloud/v1";

export interface Ayah {
  number: number;
  text: string;
  numberInSurah: number;
}

export interface SurahMeta {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

// Bundled surah metadata so we don't need an API call for the list
export const SURAHS: SurahMeta[] = Array.from({ length: 114 }, (_, i) => ({
  number: i + 1,
  name: "",
  englishName: "",
  englishNameTranslation: "",
  numberOfAyahs: 0,
  revelationType: "",
}));

let surahListCache: SurahMeta[] | null = null;

export async function fetchSurahList(): Promise<SurahMeta[]> {
  if (surahListCache) return surahListCache;
  try {
    const res = await fetch(`${API_BASE}/surah`);
    const data = await res.json();
    surahListCache = data.data as SurahMeta[];
    return surahListCache;
  } catch {
    return SURAHS;
  }
}

export async function fetchSurahAyahs(surahNumber: number): Promise<Ayah[]> {
  // Check local cache first
  const cached = await getSurah(surahNumber);
  if (cached) return cached.ayahs;

  const res = await fetch(`${API_BASE}/surah/${surahNumber}/quran-uthmani`);
  const data = await res.json();
  const ayahs: Ayah[] = data.data.ayahs.map((a: any) => ({
    number: a.number,
    text: a.text,
    numberInSurah: a.numberInSurah,
  }));
  // Cache for offline use
  await saveSurah(surahNumber, ayahs);
  return ayahs;
}

export async function downloadSurah(surahNumber: number): Promise<void> {
  const res = await fetch(`${API_BASE}/surah/${surahNumber}/quran-uthmani`);
  const data = await res.json();
  const ayahs = data.data.ayahs.map((a: any) => ({
    number: a.number,
    text: a.text,
    numberInSurah: a.numberInSurah,
  }));
  await saveSurah(surahNumber, ayahs);
}
