import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Convert Western digits 0-9 to Arabic-Indic ٠-٩ */
export function toArabicNumerals(str: string | number): string {
  return String(str).replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[parseInt(d)]);
}

/** JS getDay(): 0=Sunday … 6=Saturday → full Arabic name */
export function getArabicDayName(dayIndex: number): string {
  const names = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  return names[dayIndex] ?? "";
}

/** Short Arabic day name for compact views */
export function getArabicDayShort(dayIndex: number): string {
  const names = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
  return names[dayIndex];
}

/** Hijri date string for a given Date */
export function getHijriDate(date: Date): string {
  return new Intl.DateTimeFormat("ar-SA-u-ca-islamic", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

/** Full Gregorian date in Arabic */
export function getGregorianDateArabic(date: Date): string {
  return new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "long", year: "numeric" }).format(date);
}
