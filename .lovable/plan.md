

# Convert All English Numbers to Arabic Numerals Across the App

## Problem
Multiple pages still display English/Western numerals (0-9) instead of Arabic-Indic numerals (٠-٩).

## Approach
1. **Move `toArabicNumerals` to `src/lib/utils.ts`** as a shared utility (currently duplicated in `PrayerPage.tsx` and `prayer-times.ts`).
2. **Apply it across all files** that render numbers to users.

## All locations with English numbers

### `src/pages/QuranPage.tsx`
- **Line 80**: `اليوم: {todayCount} / {goal} آية` — daily goal counter
- **Line 83**: `🔥 {streak} أيام` — streak count
- **Line 101**: `آية {lastRead.ayah}` — last read ayah number
- **Line 136**: `آية {b.ayah}` — bookmark ayah number
- **Line 138**: surah number fallback `b.surah`
- **Line 169**: `{surah.number}` — surah list number badge
- **Line 174**: `{surah.numberOfAyahs} آيات` — ayah count per surah

### `src/pages/SurahReaderPage.tsx`
- **Line 90**: `{surahInfo.numberOfAyahs} آية` — header ayah count
- **Line 164**: `{ayah.numberInSurah}` — ayah number diamond badge

### `src/pages/AzkarPage.tsx`
- **Line 73**: `{remaining}` — dhikr counter circle
- **Line 161**: `{cat.items.length} أذكار` — category item count
- **Line 183**: `{selectedCategory.items.length} أذكار` — selected category count

### `src/pages/SettingsPage.tsx`
- **Line 148**: `{fontSize}px` — font size display
- **Line 232**: `{goal} آية` — daily goal label
- **Line 245**: `{v}` — goal preset buttons (10, 20, 50)
- **Line 276**: `{downloadedSurahs.length}/114` — text download counter
- **Line 290**: `{downloadProgress}%` — download progress
- **Line 335**: `{downloadedAudio.length}/114` — audio download counter
- **Line 349**: `{audioDownloadProgress}%` — audio download progress
- **Line 418**: `{s.number}` — surah number in audio list

### `src/components/quran/SurahBottomBar.tsx`
- **Line 17**: `formatTime()` returns English digits (e.g. `3:05`)
- **Line 232-233**: audio current time / duration display
- **Line 277**: `{dlProgress}%` — download progress
- **Line 307**: `{m} د` — timer preset buttons (5, 10, 15, 20)
- **Line 316**: `{formatTime(timerRemaining)}` — active timer display

### `src/components/quran/ReadingTimer.tsx`
- **Line 54**: `formatRemaining()` returns English digits
- **Line 73**: `{m} د` — timer preset buttons
- **Line 87**: `{formatRemaining()}` — active timer display

### `src/pages/PrayerPage.tsx`
- Already mostly converted — remove the local duplicate `toArabicNumerals`.

### `src/lib/prayer-times.ts`
- Already has its own `toArabicNumerals` — remove the local copy and import from utils.

## Implementation steps

1. **Add `toArabicNumerals` to `src/lib/utils.ts`** and export it.
2. **Update `src/pages/QuranPage.tsx`** — import and wrap all 7 locations.
3. **Update `src/pages/SurahReaderPage.tsx`** — wrap 2 locations.
4. **Update `src/pages/AzkarPage.tsx`** — wrap 3 locations.
5. **Update `src/pages/SettingsPage.tsx`** — wrap 8 locations.
6. **Update `src/components/quran/SurahBottomBar.tsx`** — wrap `formatTime` output and 2 other locations.
7. **Update `src/components/quran/ReadingTimer.tsx`** — wrap `formatRemaining` output and preset buttons.
8. **Clean up duplicates** in `PrayerPage.tsx` and `prayer-times.ts` to import from utils instead.

