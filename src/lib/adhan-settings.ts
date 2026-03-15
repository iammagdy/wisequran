export interface PerPrayerConfig {
  adhanEnabled: boolean;
  reminderEnabled: boolean;
}

export interface AdhanSettings {
  adhanEnabled: boolean;
  voiceId: string;
  adhanVolume: number;
  reminderVolume: number;
  fajrSpecialAdhan: boolean;
  takbirOnlyMode: boolean;
  preReminderMinutes: number;
  postReminderMinutes: number;
  postReminderContent: "simple" | "dhikr" | "quran";
  perPrayer: Record<string, PerPrayerConfig>;
}

export const DEFAULT_ADHAN_SETTINGS: AdhanSettings = {
  adhanEnabled: false,
  voiceId: "makkah",
  adhanVolume: 80,
  reminderVolume: 60,
  fajrSpecialAdhan: true,
  takbirOnlyMode: false,
  preReminderMinutes: 15,
  postReminderMinutes: 0,
  postReminderContent: "simple",
  perPrayer: {
    fajr: { adhanEnabled: true, reminderEnabled: true },
    dhuhr: { adhanEnabled: true, reminderEnabled: true },
    asr: { adhanEnabled: true, reminderEnabled: true },
    maghrib: { adhanEnabled: true, reminderEnabled: true },
    isha: { adhanEnabled: true, reminderEnabled: true },
  },
};

export interface AdhanVoice {
  id: string;
  nameAr: string;
  nameEn: string;
  file: string;
  fajrFile: string;
}

export const ADHAN_VOICES: AdhanVoice[] = [
  {
    id: "makkah",
    nameAr: "المسجد الحرام",
    nameEn: "Makkah Grand Mosque",
    file: "/adhan/makkah.mp3",
    fajrFile: "/adhan/fajr/makkah.mp3",
  },
  {
    id: "madinah",
    nameAr: "المسجد النبوي",
    nameEn: "Madinah Grand Mosque",
    file: "/adhan/madinah.mp3",
    fajrFile: "/adhan/fajr/madinah.mp3",
  },
  {
    id: "mishary",
    nameAr: "مشاري راشد العفاسي",
    nameEn: "Mishary Rashid Al-Afasy",
    file: "/adhan/mishary.mp3",
    fajrFile: "/adhan/fajr/mishary.mp3",
  },
  {
    id: "abdulbasit",
    nameAr: "عبد الباسط عبد الصمد",
    nameEn: "Abdul Basit Abdus-Samad",
    file: "/adhan/abdulbasit.mp3",
    fajrFile: "/adhan/fajr/abdulbasit.mp3",
  },
  {
    id: "minshawi",
    nameAr: "محمد صديق المنشاوي",
    nameEn: "Mohamed Siddiq Al-Minshawi",
    file: "/adhan/minshawi.mp3",
    fajrFile: "/adhan/fajr/minshawi.mp3",
  },
];

export const ADHAN_STORAGE_KEY = "wise-adhan-settings";
