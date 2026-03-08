

# Fix Reciter Audio, Dark Mode Persistence, Bottom Nav Visibility & Expand Azkar

## 4 Issues to Fix

### 1. Wrong reciter audio files
**Root cause**: The `folder` values in `src/lib/reciters.ts` don't match the actual CDN identifiers. The API at `api.alquran.cloud/v1/edition/format/audio` lists these correct identifiers:

| Reciter | Current (wrong) | Correct |
|---------|-----------------|---------|
| abdulbasit | `ar.abdulbasitmujawwad` | `ar.abdulbasitmurattal` |
| sudais | `ar.abdurrahmansudais` | `ar.abdurrahmaansudais` |
| shuraym | `ar.saaborshuraym` | `ar.saoodshuraym` |
| rifai | `ar.haborifai` | `ar.hanirifai` |
| mahermuaiqly | `ar.maabormuaiqly` | `ar.mahermuaiqly` |

Some reciters (islamsobhi, yasser, khalilaljalil, qatami, baleela) do NOT exist on cdn.islamic.network for per-ayah audio. For these, we need a fallback — either use the `CUSTOM_CDN_RECITERS` (mp3quran.net) for full-surah mode, or remove them from per-ayah mode. Best approach: for reciters without CDN ayah audio, fall back to full-surah playback (no per-ayah highlighting).

**Files**: `src/lib/reciters.ts`, `src/contexts/AudioPlayerContext.tsx`

### 2. Dark mode resets on navigation
**Root cause**: `useTheme()` is only called inside `SettingsPage`. The `useEffect` that applies `document.documentElement.classList.toggle("dark")` only runs when that page mounts. When the user navigates away, no component maintains the dark class.

**Fix**: Call `useTheme()` at the app level — in `App.tsx` or `AppShell.tsx` — so the theme class is applied on every page load/navigation.

**Files**: `src/components/layout/AppShell.tsx` (add `useTheme()` call)

### 3. Bottom nav hidden on surah reader page
**Root cause**: Line 17 of `BottomNav.tsx`: `if (location.pathname.startsWith("/surah/")) return null;`

**Fix**: Remove that early return. The nav should always be visible. Adjust `SurahReaderPage` bottom padding to account for the nav bar.

**Files**: `src/components/layout/BottomNav.tsx`, `src/pages/SurahReaderPage.tsx`

### 4. More azkar content
**Fix**: Significantly expand `src/data/azkar-data.ts` with additional categories and more items per category:

- **أذكار الرقية الشرعية** (Ruqyah / protection from evil eye & envy) — آية الكرسي, المعوذتين, أدعية الحسد
- **دعاء السفر** (Travel)
- **دعاء دخول المسجد والخروج منه** (Entering/leaving mosque)
- **دعاء الطعام** (Before/after eating)
- **أدعية متنوعة** (Miscellaneous duas)
- Expand existing categories (morning/evening) with more authentic azkar from حصن المسلم

**Files**: `src/data/azkar-data.ts`

## Files to Edit

| File | Change |
|------|--------|
| `src/lib/reciters.ts` | Fix folder identifiers; add `hasAyahAudio` flag for reciters without CDN per-ayah audio |
| `src/contexts/AudioPlayerContext.tsx` | Fall back to full-surah mode for reciters without per-ayah audio |
| `src/components/layout/AppShell.tsx` | Add `useTheme()` call for persistent dark mode |
| `src/components/layout/BottomNav.tsx` | Remove the `/surah/` hide condition |
| `src/pages/SurahReaderPage.tsx` | Add bottom padding for nav bar |
| `src/data/azkar-data.ts` | Add many more azkar categories and items |

