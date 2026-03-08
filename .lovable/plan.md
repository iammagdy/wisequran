

# Bundle Full Quran Data for Offline Use

## Problem
Currently the app fetches surah metadata and text one-by-one from `api.alquran.cloud`, requiring 114+ network requests and no offline fallback for the surah list.

## Approach

### 1. Bundle surah metadata as static data (`src/data/surah-meta.ts`)
Create a static file with all 114 surahs' metadata (Arabic name, English name, ayah count, revelation type). This replaces the API call to `/v1/surah` and makes the surah list work offline immediately.

Data source: `api.alquran.cloud/v1/surah` — I'll hardcode the response as a TypeScript constant.

### 2. Use bulk API for "Download All" (`src/lib/quran-api.ts`)
Replace the current loop of 114 individual requests with a single call to `api.alquran.cloud/v1/quran/quran-uthmani` which returns all ayahs in one response (~2.5MB). Parse and store each surah into IndexedDB in one go.

### 3. Update `fetchSurahList()` to use static data
Remove the API call for the surah list entirely — return the bundled metadata directly. This means the Quran page loads instantly even offline.

### 4. Keep individual surah fetch as fallback
`fetchSurahAyahs()` still checks IndexedDB first, then falls back to the per-surah API if not downloaded. No change needed there.

## Files changed
- **New**: `src/data/surah-meta.ts` — static metadata for all 114 surahs
- **Edit**: `src/lib/quran-api.ts` — use static metadata, add bulk download function
- **Edit**: `src/pages/SettingsPage.tsx` — use bulk download in `handleDownloadAll`

## What stays the same
- IndexedDB schema (no change needed)
- Individual surah reading flow
- Audio system
- All other pages

