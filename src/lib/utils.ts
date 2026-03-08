import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** JS getDay(): 0=Sunday … 6=Saturday → full Arabic name */
export function getArabicDayName(dayIndex: number): string {
  const names = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  return names[dayIndex];
}

/** Short Arabic day name for compact views */
export function getArabicDayShort(dayIndex: number): string {
  const names = ["أحد", "إثن", "ثلا", "أرب", "خمي", "جمع", "سبت"];
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
