export interface Reciter {
  id: string;
  name: string;
  folder: string;
  /** Whether per-ayah audio is available on cdn.islamic.network */
  hasAyahAudio: boolean;
}

export const RECITERS: Reciter[] = [
  { id: "alafasy", name: "مشاري العفاسي", folder: "ar.alafasy", hasAyahAudio: true },
  { id: "husary", name: "محمود خليل الحصري", folder: "ar.husary", hasAyahAudio: true },
  { id: "minshawi", name: "محمد صديق المنشاوي", folder: "ar.minshawi", hasAyahAudio: true },
  { id: "abdulbasit", name: "عبد الباسط عبد الصمد", folder: "ar.abdulbasitmurattal", hasAyahAudio: true },
  { id: "sudais", name: "عبد الرحمن السديس", folder: "ar.abdurrahmaansudais", hasAyahAudio: true },
  { id: "shuraym", name: "سعود الشريم", folder: "ar.saoodshuraym", hasAyahAudio: true },
  { id: "rifai", name: "هاني الرفاعي", folder: "ar.hanirifai", hasAyahAudio: true },
  { id: "ajamy", name: "أحمد العجمي", folder: "ar.ahmedajamy", hasAyahAudio: true },
  { id: "mahermuaiqly", name: "ماهر المعيقلي", folder: "ar.mahermuaiqly", hasAyahAudio: true },
  // Reciters without per-ayah CDN audio (full-surah only via mp3quran.net)
  { id: "islamsobhi", name: "إسلام صبحي", folder: "ar.alafasy", hasAyahAudio: false },
  { id: "yasser", name: "ياسر الدوسري", folder: "ar.alafasy", hasAyahAudio: false },
  { id: "baleela", name: "بندر بليلة", folder: "ar.alafasy", hasAyahAudio: false },
  { id: "khalilaljalil", name: "خالد الجليل", folder: "ar.alafasy", hasAyahAudio: false },
  { id: "qatami", name: "ناصر القطامي", folder: "ar.alafasy", hasAyahAudio: false },
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
