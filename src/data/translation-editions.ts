export interface TranslationEdition {
  id: string;
  name: string;
  language: string;
  dir: "ltr" | "rtl";
}

export const TRANSLATION_EDITIONS: TranslationEdition[] = [
  { id: "en.sahih", name: "Sahih International", language: "English", dir: "ltr" },
  { id: "en.pickthall", name: "Pickthall", language: "English", dir: "ltr" },
  { id: "en.yusufali", name: "Yusuf Ali", language: "English", dir: "ltr" },
  { id: "en.asad", name: "Muhammad Asad", language: "English", dir: "ltr" },
  { id: "fr.hamidullah", name: "Hamidullah (Français)", language: "Français", dir: "ltr" },
  { id: "de.bubenheim", name: "Bubenheim (Deutsch)", language: "Deutsch", dir: "ltr" },
  { id: "ur.jalandhry", name: "جالندری (اردو)", language: "Urdu", dir: "rtl" },
  { id: "ur.ahmedali", name: "احمد علی (اردو)", language: "Urdu", dir: "rtl" },
  { id: "tr.diyanet", name: "Diyanet (Türkçe)", language: "Türkçe", dir: "ltr" },
  { id: "id.indonesian", name: "Bahasa Indonesia", language: "Indonesian", dir: "ltr" },
  { id: "ru.kuliev", name: "Кулиев (Русский)", language: "Русский", dir: "ltr" },
  { id: "zh.majian", name: "马坚 (中文)", language: "中文", dir: "ltr" },
];

export const DEFAULT_TRANSLATION = "en.sahih";
