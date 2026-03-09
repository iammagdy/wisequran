export interface RamadanChecklistItem {
  id: string;
  label: string;
  emoji: string;
}

export const DAILY_CHECKLIST: RamadanChecklistItem[] = [
  { id: "quran-juz", label: "قراءة الجزء اليومي", emoji: "📖" },
  { id: "taraweeh", label: "صلاة التراويح", emoji: "🕌" },
  { id: "qiyam", label: "قيام الليل", emoji: "🌙" },
  { id: "sadaqah", label: "صدقة", emoji: "💝" },
  { id: "iftar-dua", label: "دعاء الإفطار", emoji: "🤲" },
  { id: "feed-fasting", label: "إطعام صائم", emoji: "🍽️" },
  { id: "dhikr", label: "أذكار الصباح والمساء", emoji: "📿" },
  { id: "istighfar", label: "الاستغفار ١٠٠ مرة", emoji: "🙏" },
];

export interface RamadanActivity {
  title: string;
  description: string;
  emoji: string;
  category: "dua" | "dhikr" | "fadail" | "tip";
}

export const RAMADAN_ACTIVITIES: RamadanActivity[] = [
  {
    title: "دعاء الإفطار",
    description: "ذهب الظمأ وابتلت العروق وثبت الأجر إن شاء الله",
    emoji: "🤲",
    category: "dua",
  },
  {
    title: "دعاء ليلة القدر",
    description: "اللهم إنك عفو تحب العفو فاعف عني",
    emoji: "✨",
    category: "dua",
  },
  {
    title: "فضل الصيام",
    description: "من صام رمضان إيماناً واحتساباً غُفر له ما تقدم من ذنبه",
    emoji: "🌟",
    category: "fadail",
  },
  {
    title: "فضل القيام",
    description: "من قام رمضان إيماناً واحتساباً غُفر له ما تقدم من ذنبه",
    emoji: "🕌",
    category: "fadail",
  },
  {
    title: "أذكار الصيام",
    description: "إذا شتمه أحد أو قاتله فليقل: إني صائم",
    emoji: "📿",
    category: "dhikr",
  },
  {
    title: "العشر الأواخر",
    description: "كان النبي ﷺ إذا دخل العشر الأواخر أحيا الليل وأيقظ أهله وشدّ المئزر",
    emoji: "🌙",
    category: "fadail",
  },
  {
    title: "تعجيل الفطور",
    description: "لا يزال الناس بخير ما عجّلوا الفطر",
    emoji: "🍽️",
    category: "tip",
  },
  {
    title: "السحور بركة",
    description: "تسحّروا فإنّ في السحور بركة",
    emoji: "🌅",
    category: "tip",
  },
];
