

# Plan: Prayer Times, Weekday Fix & Arabic-Only Header

## 1. Prayer Times for Egypt — `src/lib/prayer-times.ts` (new)

Create a lightweight, zero-dependency prayer time calculator using standard astronomical formulas (Egyptian General Authority method: Fajr 19.5°, Isha 17.5°).

- Function `calculatePrayerTimes(date: Date): Record<string, string>` returns times for Fajr, Dhuhr, Asr, Maghrib, Isha in `HH:MM` format.
- Hardcode Cairo coordinates (30.0444°N, 31.2357°E) and timezone `Africa/Cairo`.
- Uses the sun position equations (declination, equation of time, hour angle) — about 80-100 lines of pure math, no external library needed.
- Export a helper `getNextPrayer(times, now)` that returns the next prayer ID and minutes remaining.

### Prayer Page Update (`src/pages/PrayerPage.tsx`)

- Import and call `calculatePrayerTimes` with today's date.
- Add prayer times to each prayer card (show time like `٤:٥٢ ص` next to the prayer name).
- Highlight the next upcoming prayer card with a subtle accent border.
- Show a countdown badge on the next prayer: `متبقي ١٢ دقيقة`.
- Use `useEffect` with a 1-minute interval to update the countdown and detect day changes.

## 2. Fix Weekday Names — `src/lib/utils.ts`

Add a centralized helper:

```ts
// JS getDay(): 0=Sunday, 1=Monday, ...
export function getArabicDayName(dayIndex: number): string {
  const names = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  return names[dayIndex];
}
// Short versions for charts
export function getArabicDayShort(dayIndex: number): string {
  const names = ["أحد", "إثن", "ثلا", "أرب", "خمي", "جمع", "سبت"];
  return names[dayIndex];
}
```

Current `PrayerPage.tsx` line 71 has the array `["أحد", "إثن", "ثلا", "أرب", "خمي", "جمع", "سبت"]` — JS `getDay()` returns 0=Sunday, so index 0 should be "أحد" (Sunday). The current mapping is actually correct for short names, but the full names are missing. Replace the inline array with the centralized helper and use correct full names where appropriate.

## 3. Quran Header — Arabic Only (`src/pages/QuranPage.tsx`)

Remove line 53: `<p className="text-sm text-muted-foreground">The Noble Quran</p>`

No other layout changes needed — the header `<div>` will just contain the Arabic title.

## Files

| File | Action |
|------|--------|
| `src/lib/prayer-times.ts` | Create — prayer time calculation + next-prayer helper |
| `src/lib/utils.ts` | Add `getArabicDayName` and `getArabicDayShort` helpers |
| `src/pages/PrayerPage.tsx` | Add prayer times display, next-prayer highlight + countdown, use centralized day names |
| `src/pages/QuranPage.tsx` | Remove English subtitle from header |

No new dependencies. All calculation is pure client-side math.

