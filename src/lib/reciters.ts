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
  { id: "abdulbasit", name: "عبد الباسط عبد الصمد", folder: "ar.abdulbasitmujawwad" },
  { id: "sudais", name: "عبد الرحمن السديس", folder: "ar.abdurrahmansudais" },
  { id: "shuraym", name: "سعود الشريم", folder: "ar.saaborshuraym" },
  { id: "mahermuaiqly", name: "ماهر المعيقلي", folder: "ar.maabormuaiqly" },
  { id: "yasser", name: "ياسر الدوسري", folder: "ar.yasserdossari" },
  { id: "rifai", name: "هاني الرفاعي", folder: "ar.haborifai" },
  { id: "ajamy", name: "أحمد العجمي", folder: "ar.ahmedajamy" },
  { id: "baleela", name: "بندر بليلة", folder: "ar.bandarbalila" },
  { id: "khalilaljalil", name: "خالد الجليل", folder: "ar.khalilaljalil" },
  { id: "qatami", name: "ناصر القطامي", folder: "ar.nasserqatami" },
];

export const DEFAULT_RECITER = "alafasy";

export function getReciterById(id: string): Reciter {
  return RECITERS.find((r) => r.id === id) ?? RECITERS[0];
}

// Reciters with custom CDN URLs (mp3quran.net)
const CUSTOM_CDN_RECITERS: Record<string, string> = {
  islamsobhi: "https://server14.mp3quran.net/islam/Rewayat-Hafs-A-n-Assem",
  mahermuaiqly: "https://server12.mp3quran.net/maher/Rewayat-Hafs-A-n-Assem",
  yasser: "https://server11.mp3quran.net/yasser/Rewayat-Hafs-A-n-Assem",
  khalilaljalil: "https://server6.mp3quran.net/jalil/Rewayat-Hafs-A-n-Assem",
  qatami: "https://server6.mp3quran.net/qtm/Rewayat-Hafs-A-n-Assem",
  baleela: "https://server8.mp3quran.net/bndrlh",
};

export function getReciterAyahAudioUrl(reciterId: string, globalAyahNumber: number): string {
  const reciter = getReciterById(reciterId);
  return `https://cdn.islamic.network/quran/audio/128/${reciter.folder}/${globalAyahNumber}.mp3`;
}

export function getReciterAudioUrl(reciterId: string, surahNumber: number): string {
  const customBase = CUSTOM_CDN_RECITERS[reciterId];
  if (customBase) {
    const padded = surahNumber.toString().padStart(3, "0");
    return `${customBase}/${padded}.mp3`;
  }
  const reciter = getReciterById(reciterId);
  return `https://cdn.islamic.network/quran/audio-surah/128/${reciter.folder}/${surahNumber}.mp3`;
}
