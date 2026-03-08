

# Three Changes: Mushaf Page Numbers, Fix Juz Navigation, Remove Hizb Tab

## 1. Add Real Mushaf Page Numbers to Surah Reader

The alquran.cloud API returns a `page` field for each ayah (Madina Mushaf standard, 604 pages). We need to:

### Changes:
- **`src/lib/quran-api.ts`**: Extend `Ayah` interface to include `page: number`. Update `fetchSurahAyahs` and `downloadAllSurahs` to extract `a.page` from the API response.
- **`src/lib/db.ts`**: May need to check if the IndexedDB schema handles the new field (it should if we just store the object).
- **`src/pages/SurahReaderPage.tsx`**: 
  - Track current visible page number using an `IntersectionObserver` or by reading the `page` field of the first visible ayah.
  - Show a small floating badge/indicator (e.g. bottom-left or in the header) displaying `صفحة ٣٤٥` that updates as the user scrolls.
  - Insert a visual page separator between ayahs when the page number changes (a subtle divider with the page number).

**Note**: Users who previously downloaded surahs won't have the `page` field cached. We handle this gracefully — if `page` is undefined, we don't show the indicator. Re-downloading will fix it.

## 2. Fix Juz Navigation — Show All Surahs in the Juz

Currently clicking a Juz navigates to `/surah/{startSurah}` which only shows one surah. Instead:

### Changes:
- **`src/pages/QuranPage.tsx`**: When clicking a Juz, instead of navigating away, expand the Juz card to show all surahs within that Juz's range (from `startSurah` to `endSurah`). Each surah is clickable and navigates to `/surah/{number}`.
  - Add an `expandedJuz` state (`number | null`).
  - Filter `surahs` array to those within the Juz range and render them as sub-items under the expanded Juz card.

## 3. Remove Hizb Tab

### Changes:
- **`src/pages/QuranPage.tsx`**: 
  - Change `ViewMode` type to `"surahs" | "juz"`.
  - Remove the Hizb tab button from the tabs array.
  - Remove the entire Hizb list rendering section (lines 318-343).
  - Remove `hizbData` import.

### Files to edit:
- `src/lib/quran-api.ts` — add `page` to Ayah
- `src/pages/SurahReaderPage.tsx` — page number display with scroll tracking
- `src/pages/QuranPage.tsx` — remove hizb tab, fix juz to expand with surahs list

