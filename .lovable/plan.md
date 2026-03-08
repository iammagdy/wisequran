

# Add Global Quran Verse Search

## What
Enhance the existing search in `QuranPage.tsx` so that when the user types Arabic text (not just surah names/numbers), it searches **within ayah text** across all cached surahs in IndexedDB and shows matching verses as results the user can tap to navigate directly to that surah.

## Approach
- When the search query is 3+ characters and doesn't match a surah name/number pattern, search ayah text from IndexedDB
- Use `getDB().getAll("surahs")` to scan all cached surahs for matching ayahs
- Show results as a separate section below the surah list filter, displaying: surah name, ayah number, and a snippet of the matching text
- Tapping a result navigates to `/surah/{number}`
- If no surahs are cached, show a hint to download the Quran first for verse search
- Debounce the search (300ms) to avoid scanning IndexedDB on every keystroke

## Changes

### New: `src/lib/quran-search.ts`
- `searchAyahs(query: string): Promise<SearchResult[]>` — scans all cached surahs in IndexedDB, returns matches with `{ surahNumber, surahName, ayahNumber, text }` (limit 50 results)
- Uses `getDB().getAll("surahs")` and filters ayah text with `.includes(query)`

### Edit: `src/pages/QuranPage.tsx`
- Import `searchAyahs` and add state for `ayahResults` and `searchLoading`
- Add a `useEffect` with debounce: when `search` is 3+ chars and not a pure number, call `searchAyahs(search)`
- Below the surah list/filter, render a "نتائج البحث في الآيات" section showing matching ayahs as cards (surah name + ayah number + text snippet)
- Each result navigates to `/surah/{surahNumber}`
- Show "لا توجد نتائج" if no matches, and a note about downloading surahs for offline search if few results

### Edit: `src/lib/db.ts`
- Add `getAllSurahs()` helper that returns all entries from the `surahs` store

## Files
- **New**: `src/lib/quran-search.ts`
- **Edit**: `src/pages/QuranPage.tsx`, `src/lib/db.ts`

