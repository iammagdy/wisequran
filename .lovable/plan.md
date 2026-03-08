

# Plan: Full RTL Arabic-Only + Improved Prayer Page Header

## Summary

Remove all remaining English text across the app, ensure global RTL, and redesign the Prayer page header with a centered day/date card.

## Changes

### 1. `index.html` — already has `lang="ar" dir="rtl"` ✓

No change needed.

### 2. `src/lib/utils.ts` — Add Hijri date with year

Update `getHijriDate` to include the year:
```ts
export function getHijriDate(date: Date): string {
  return new Intl.DateTimeFormat("ar-SA-u-ca-islamic", {
    day: "numeric", month: "long", year: "numeric"
  }).format(date);
}
```

### 3. `src/pages/PrayerPage.tsx` — Redesign header

Replace the current header (lines 108-125) with:
- Title "صلواتي اليوم" centered
- A centered card below it with 3 lines:
  - **Line 1**: Day name (text-lg font-bold) — `getArabicDayName(new Date().getDay())`
  - **Line 2**: Hijri date with year (text-base font-medium) — `getHijriDate(new Date())`
  - **Line 3**: Gregorian date (text-sm text-muted-foreground) — `getGregorianDateArabic(new Date())`
- Streak badge stays, moved below the card or inline
- Next prayer countdown stays below the date card

### 4. English text removal — all files

| File | English to remove/replace |
|------|--------------------------|
| `src/pages/SettingsPage.tsx` line 112 | `"Settings"` → remove entirely |
| `src/pages/AzkarPage.tsx` line 113 | `"Daily Remembrance"` → remove |
| `src/pages/AzkarPage.tsx` line 183 | `{selectedCategory.name}` (English category name) → remove |
| `src/pages/QuranPage.tsx` line 174 | `{surah.englishName}` → remove from display |
| `src/pages/SurahReaderPage.tsx` lines 88-89 | `{surahInfo?.englishName}` → remove |
| `src/pages/NotFound.tsx` | Replace "Oops! Page not found" → "الصفحة غير موجودة", "Return to Home" → "العودة للرئيسية" |
| `src/pages/SettingsPage.tsx` line 409 | `"Wise QURAN"` → keep as brand name (Latin brand is acceptable) |

### Files Modified

| File | Action |
|------|--------|
| `src/lib/utils.ts` | Update `getHijriDate` to include year |
| `src/pages/PrayerPage.tsx` | Redesign header with centered date card |
| `src/pages/QuranPage.tsx` | Remove English surah name from list |
| `src/pages/SurahReaderPage.tsx` | Remove English surah name from header |
| `src/pages/AzkarPage.tsx` | Remove English subtitles |
| `src/pages/SettingsPage.tsx` | Remove "Settings" subtitle |
| `src/pages/NotFound.tsx` | Arabize all text |

No new dependencies. Layout and text changes only.

