export interface Reciter {
  id: string;
  name: string;
  folder: string;
}

export const RECITERS: Reciter[] = [
  { id: "alafasy", name: "مشاري العفاسي", folder: "ar.alafasy" },
  { id: "husary", name: "محمود خليل الحصري", folder: "ar.husary" },
  { id: "minshawi", name: "محمد صديق المنشاوي", folder: "ar.minshawi" },
  { id: "islamsobhi", name: "إسلام صبحي", folder: "ar.islamsobhi" },
];

export const DEFAULT_RECITER = "alafasy";

export function getReciterById(id: string): Reciter {
  return RECITERS.find((r) => r.id === id) ?? RECITERS[0];
}

export function getReciterAudioUrl(reciterId: string, surahNumber: number): string {
  const reciter = getReciterById(reciterId);
  return `https://cdn.islamic.network/quran/audio-surah/128/${reciter.folder}/${surahNumber}.mp3`;
}
