

# Reciter Selection Feature

## Overview
Add a reciter picker so users can choose their preferred Quran audio reciter. The selection persists in localStorage and affects all audio playback.

## Key challenge: Audio caching per reciter
Currently the `audio` IndexedDB store keys by `surahNumber` only. When the user switches reciters, cached audio for surah X from reciter A would be served for reciter B. We need to include the reciter ID in the cache key.

## Changes

### 1. New file: `src/lib/reciters.ts`
Define the reciters list and a helper to build audio URLs:
```ts
export const RECITERS = [
  { id: "alafasy", name: "مشاري العفاسي", folder: "ar.alafasy" },
  { id: "husary", name: "محمود خليل الحصري", folder: "ar.husary" },
  { id: "minshawi", name: "محمد صديق المنشاوي", folder: "ar.minshawi" },
  { id: "islamsobhi", name: "إسلام صبحي", folder: "ar.islamsobhi" },
];
export const DEFAULT_RECITER = "alafasy";
export function getReciterAudioUrl(reciterId: string, surahNumber: number) { ... }
```

### 2. Update `src/lib/quran-audio.ts`
- All functions (`getAudioUrl`, `resolveAudioSource`, `downloadSurahAudio`) gain a `reciterId` parameter.
- Cache key in IndexedDB changes from `surahNumber` to a composite key like `"alafasy-1"` (string).

### 3. Update `src/lib/db.ts`
- Change the `audio` store key from `number` (surahNumber) to `string` (e.g. `"alafasy-1"`).
- Update `saveAudio`, `getAudio`, `deleteAudio`, `getAllDownloadedAudio` to use the composite key.
- Bump DB version to 3 to handle the schema migration (recreate the audio store).

### 4. Update `src/pages/SettingsPage.tsx`
- Add a new section "صوت القارئ" with helper text "اختر صوت القارئ المفضل لتلاوة القرآن".
- Show a radio-style list of reciters using `useLocalStorage("wise-reciter", "alafasy")`.
- Place it after the "Prayer Notifications" section, before "Daily Goal".
- Audio download section: pass selected reciter to download functions. Downloaded audio list is now reciter-specific.

### 5. Update `src/components/quran/SurahBottomBar.tsx`
- Read selected reciter from localStorage via `useLocalStorage`.
- Pass reciterId to `resolveAudioSource` and `downloadSurahAudio`.
- Show reciter name in MediaSession metadata instead of hardcoded "مشاري العفاسي".

### 6. Migration note
Changing the audio store key format means previously downloaded audio will be lost (DB version upgrade recreates the store). This is acceptable since the user can re-download.

## Files touched
- **New**: `src/lib/reciters.ts`
- **Edit**: `src/lib/db.ts`, `src/lib/quran-audio.ts`, `src/pages/SettingsPage.tsx`, `src/components/quran/SurahBottomBar.tsx`

