/**
 * Prayer time calculator for Egypt (Cairo)
 * Egyptian General Authority of Survey method: Fajr 19.5°, Isha 17.5°
 * Zero dependencies — pure astronomical math.
 */

const CAIRO_LAT = 30.0444;
const CAIRO_LNG = 31.2357;
const CAIRO_TZ = 2; // UTC+2 (EET); note: Egypt no longer observes DST

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

function julianDate(year: number, month: number, day: number): number {
  if (month <= 2) { year--; month += 12; }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
}

function sunPosition(jd: number) {
  const D = jd - 2451545.0;
  const g = (357.529 + 0.98560028 * D) % 360;
  const q = (280.459 + 0.98564736 * D) % 360;
  const L = (q + 1.915 * Math.sin(g * DEG) + 0.020 * Math.sin(2 * g * DEG)) % 360;
  const e = 23.439 - 0.00000036 * D;
  const RA = Math.atan2(Math.cos(e * DEG) * Math.sin(L * DEG), Math.cos(L * DEG)) * RAD;
  const decl = Math.asin(Math.sin(e * DEG) * Math.sin(L * DEG)) * RAD;
  // Equation of time in minutes
  let EqT = (q - RA) % 360;
  if (EqT > 180) EqT -= 360;
  if (EqT < -180) EqT += 360;
  return { decl, EqT: EqT * 4 }; // *4 to convert degrees to minutes
}

function hourAngle(lat: number, decl: number, angle: number): number {
  const cosHA = (Math.sin(angle * DEG) - Math.sin(lat * DEG) * Math.sin(decl * DEG)) /
    (Math.cos(lat * DEG) * Math.cos(decl * DEG));
  if (cosHA > 1 || cosHA < -1) return 0;
  return Math.acos(cosHA) * RAD;
}

function asrHourAngle(lat: number, decl: number): number {
  // Shafi'i: shadow = object length + noon shadow
  const a = Math.atan(1 / (1 + Math.tan(Math.abs(lat - decl) * DEG)));
  return Math.acos(
    (Math.sin(a) - Math.sin(lat * DEG) * Math.sin(decl * DEG)) /
    (Math.cos(lat * DEG) * Math.cos(decl * DEG))
  ) * RAD;
}

function toTimeString(hours: number): string {
  // Clamp to 0-24 range
  hours = ((hours % 24) + 24) % 24;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

function toArabicTime(time24: string): string {
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr);
  const period = h >= 12 ? "م" : "ص";
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${h}:${mStr} ${period}`;
}

export interface PrayerTimes {
  fajr: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

export interface NextPrayerInfo {
  id: string;
  name: string;
  minutesLeft: number;
  secondsLeft: number;
}

/** Get seconds remaining until a specific prayer time. Negative if passed. */
export function getSecondsUntilPrayer(prayerTime: string, now: Date): number {
  const cairoNow = new Date(now.toLocaleString("en-US", { timeZone: "Africa/Cairo" }));
  const nowSeconds = cairoNow.getHours() * 3600 + cairoNow.getMinutes() * 60 + cairoNow.getSeconds();
  const [h, m] = prayerTime.split(":").map(Number);
  const prayerSeconds = h * 3600 + m * 60;
  return prayerSeconds - nowSeconds;
}

const PRAYER_ORDER = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;
const PRAYER_NAMES: Record<string, string> = {
  fajr: "الفجر",
  dhuhr: "الظهر",
  asr: "العصر",
  maghrib: "المغرب",
  isha: "العشاء",
};

/**
 * Calculate prayer times for a given date using Cairo coordinates
 * and the Egyptian General Authority method.
 */
export function calculatePrayerTimes(date: Date): PrayerTimes {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const jd = julianDate(year, month, day);
  const { decl, EqT } = sunPosition(jd);

  const transit = 12 + (CAIRO_LNG * -1) / 15 - EqT / 60 + CAIRO_TZ;

  const fajrHA = hourAngle(CAIRO_LAT, decl, -19.5);
  const sunriseHA = hourAngle(CAIRO_LAT, decl, -0.833);
  const asrHA = asrHourAngle(CAIRO_LAT, decl);
  const sunsetHA = hourAngle(CAIRO_LAT, decl, -0.833);
  const ishaHA = hourAngle(CAIRO_LAT, decl, -17.5);

  return {
    fajr: toTimeString(transit - fajrHA / 15),
    dhuhr: toTimeString(transit + 2 / 60), // 2 min after solar noon
    asr: toTimeString(transit + asrHA / 15),
    maghrib: toTimeString(transit + sunsetHA / 15),
    isha: toTimeString(transit + ishaHA / 15),
  };
}

/** Format a 24h time string to Arabic 12h format */
export function formatArabicTime(time24: string): string {
  return toArabicTime(time24);
}

/** Get the next upcoming prayer and minutes remaining */
export function getNextPrayer(times: PrayerTimes, now: Date): NextPrayerInfo | null {
  // Get current time in Cairo
  const cairoNow = new Date(now.toLocaleString("en-US", { timeZone: "Africa/Cairo" }));
  const nowMinutes = cairoNow.getHours() * 60 + cairoNow.getMinutes();

  const nowSeconds = cairoNow.getHours() * 3600 + cairoNow.getMinutes() * 60 + cairoNow.getSeconds();

  for (const id of PRAYER_ORDER) {
    const [h, m] = times[id].split(":").map(Number);
    const prayerSeconds = h * 3600 + m * 60;
    if (prayerSeconds > nowSeconds) {
      const secondsLeft = prayerSeconds - nowSeconds;
      return { id, name: PRAYER_NAMES[id], minutesLeft: Math.ceil(secondsLeft / 60), secondsLeft };
    }
  }
  // All prayers passed — next is tomorrow's Fajr (approximate)
  const [fH, fM] = times.fajr.split(":").map(Number);
  const fajrSeconds = fH * 3600 + fM * 60;
  const secondsLeft = (24 * 3600 - nowSeconds) + fajrSeconds;
  return { id: "fajr", name: PRAYER_NAMES.fajr, minutesLeft: Math.ceil(secondsLeft / 60), secondsLeft };
}
