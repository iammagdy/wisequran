

# Add Tafsir (Quran Explanation) Feature

## Context
The `quran-database` repo contains a MySQL dump with surahs, ayahs, editions, and ayah_edition tables. We can't use SQL directly in a frontend-only PWA, but the **same data is available** via the `api.alquran.cloud` API we already use. The API provides 6 Arabic tafsir editions:

- **ar.muyassar** — تفسير الميسر (simplest, best default)
- **ar.jalalayn** — تفسير الجلالين
- **ar.qurtubi** — تفسير القرطبي
- **ar.baghawi** — تفسير البغوي
- **ar.waseet** — التفسير الوسيط
- **ar.miqbas** — تنوير المقباس من تفسير بن عباس

## Features to Add

### 1. Tafsir panel on ayah tap
When a user taps an ayah in `SurahReaderPage`, show a bottom sheet/expandable panel with the tafsir text for that ayah. The user can close it or tap another ayah.

### 2. Tafsir edition selector in Settings
Add a "التفسير" section in `SettingsPage` with a list of the 6 tafsir editions. Store the selected edition ID in localStorage (`wise-tafsir`, default `ar.muyassar`).

### 3. Tafsir API + caching
Fetch tafsir per-surah from `api.alquran.cloud/v1/surah/{number}/{editionId}`. Cache in a new IndexedDB store (`tafsir`) keyed by `"{editionId}-{surahNumber}"`.

## Changes

### New: `src/data/tafsir-editions.ts`
```ts
export const TAFSIR_EDITIONS = [
  { id: "ar.muyassar", name: "تفسير الميسر" },
  { id: "ar.jalalayn", name: "تفسير الجلالين" },
  { id: "ar.qurtubi", name: "تفسير القرطبي" },
  { id: "ar.baghawi", name: "تفسير البغوي" },
  { id: "ar.waseet", name: "التفسير الوسيط" },
  { id: "ar.miqbas", name: "تنوير المقباس" },
];
export const DEFAULT_TAFSIR = "ar.muyassar";
```

### Edit: `src/lib/db.ts`
- Add a `tafsir` object store keyed by string (e.g. `"ar.muyassar-1"`)
- Bump DB version to 4
- Add `saveTafsir`, `getTafsir` helper functions

### New: `src/lib/tafsir-api.ts`
- `fetchTafsir(surahNumber, editionId)`: check IndexedDB cache first, then fetch from API, cache result
- Returns `TafsirAyah[]` with `{ numberInSurah, text }`

### Edit: `src/pages/SurahReaderPage.tsx`
- Add state for selected ayah and tafsir text
- On ayah tap, fetch tafsir for that ayah and show it in a collapsible panel below the ayah text (or a bottom sheet via Vaul drawer)
- Show a small "تفسير" button on each ayah card

### New: `src/components/quran/TafsirPanel.tsx`
- A Vaul Drawer component showing the tafsir text for the selected ayah
- Shows edition name, ayah number, and tafsir content
- Calm styling with good Arabic typography

### Edit: `src/pages/SettingsPage.tsx`
- Add "التفسير" section with edition selector (same pattern as reciter selector)
- Helper text: "اختر التفسير المفضل لعرضه عند الضغط على الآية"

## Files
- **New**: `src/data/tafsir-editions.ts`, `src/lib/tafsir-api.ts`, `src/components/quran/TafsirPanel.tsx`
- **Edit**: `src/lib/db.ts`, `src/pages/SurahReaderPage.tsx`, `src/pages/SettingsPage.tsx`

