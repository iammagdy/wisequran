

# Plan: Fix Weekly View — Full Day Names, Scrollable, Highlight Today + Dates

## Problem
The "آخر 7 أيام" weekly chart uses abbreviated day names that get cramped. User wants:
1. Full Arabic day names (e.g. "الأحد" not "أحد")
2. Horizontally scrollable container so names don't get cut off
3. Highlight today's column
4. Show both Hijri and Gregorian date for each day

## Changes

### `src/pages/PrayerPage.tsx` — Weekly View section (lines 177–200)

- Switch from `getArabicDayShort` to `getArabicDayName` for full day names
- Wrap the 7-day chart in a horizontal `ScrollArea` (using existing `@radix-ui/react-scroll-area`)
- Each column gets a fixed min-width (~60px) so they don't squish — scroll kicks in on small screens
- Highlight today's column with a subtle `bg-primary/5 rounded-lg` background
- Under each day name, show:
  - Gregorian day number (e.g. "8")
  - Hijri date using `Intl.DateTimeFormat` with `{ calendar: "islamic" }` — no external library needed

### Hijri date approach
Use the browser's built-in `Intl.DateTimeFormat("ar-SA-u-ca-islamic", { day: "numeric", month: "long" })` to get the Hijri date string. This works in all modern browsers. Add a small helper in `src/lib/utils.ts`:

```ts
export function getHijriDate(date: Date): string {
  return new Intl.DateTimeFormat("ar-SA-u-ca-islamic", { day: "numeric", month: "short" }).format(date);
}
```

### Also add today's date header
Above the "آخر 7 أيام" title, show today's full date in both calendars (e.g. "٨ مارس ٢٠٢٦ — ٩ شعبان ١٤٤٧") in the page header area.

## Files Modified
- `src/lib/utils.ts` — add `getHijriDate` helper
- `src/pages/PrayerPage.tsx` — weekly view: full names, scroll, today highlight, dates; header: dual calendar date

