

# Deep Link to Specific Ayah from Search Results

## What
When clicking a search result (ayah search, bookmarks), navigate to the surah AND auto-scroll to the specific ayah instead of just opening the surah from the top.

## Changes

### 1. Navigation with query param
In `QuranPage.tsx`, change all navigation calls that reference a specific ayah to include a query parameter:
- Ayah search results (line ~236): `navigate(/surah/${r.surahNumber}?ayah=${r.ayahNumber})`
- Bookmarks (line ~198): `navigate(/surah/${b.surah}?ayah=${b.ayah})`

### 2. SurahReaderPage: read query param and scroll to ayah
In `SurahReaderPage.tsx`:
- Read `ayah` from `useSearchParams`
- Add `id` attributes to each ayah card: `id={`ayah-${ayah.numberInSurah}`}`
- After ayahs load, if `ayah` param exists, use `scrollIntoView` with a short delay to scroll to the target ayah and briefly highlight it (e.g. ring or pulse animation)

### Files
- **Edit**: `src/pages/QuranPage.tsx` — update navigate calls
- **Edit**: `src/pages/SurahReaderPage.tsx` — add scroll-to-ayah logic + ayah element IDs

