
# Add Daily Ayah Feature

## Overview
Display a "Verse of the Day" card on the Quran home screen that shows a different ayah each day, selected deterministically based on the date.

## Changes

### 1. New Component: `src/components/quran/DailyAyah.tsx`
- Card component displaying the daily verse with:
  - Ayah text in Arabic with proper typography
  - Surah name and ayah number
  - Subtle decorative styling (gradient/icon)
  - Tap to navigate to the full surah at that ayah
- Uses date-based seed to pick a consistent ayah for the day (changes at midnight)
- Fetches from cache first, falls back to API
- Shows skeleton while loading

### 2. New Utility: `src/lib/daily-ayah.ts`
- `getDailyAyahReference(date: Date)` - Returns `{surah, ayah}` based on date seed
- Uses a simple hash of the date to deterministically select from ~6,236 total ayahs
- Cycles through notable ayahs from popular surahs for variety

### 3. Update: `src/pages/QuranPage.tsx`
- Add `<DailyAyah />` component between Daily Goal card and Last Read button
- Only show when not in bookmarks/favorites/history view

## Technical Details
- Date seed formula: `(year * 1000 + dayOfYear) % TOTAL_AYAHS` for consistency
- Predefine a curated list of ~100 impactful ayahs for better selection
- Cache fetched ayah in localStorage with date key to avoid re-fetching
- RTL text with `font-arabic` class for proper rendering
