

# Tafsir Tabs in SurahReaderPage

## Overview
Replace the current drawer-based tafsir with an inline tab system. Two tabs under the header: **النص** (default, current ayah view) and **التفسير** (full surah tafsir). Clicking the BookOpen icon on an ayah switches to the التفسير tab and scrolls to that specific ayah's explanation.

## Changes

### 1. Edit `src/pages/SurahReaderPage.tsx`
- Add tab state: `activeTab: "text" | "tafsir"` and `focusedAyah: number | null`
- Add tafsir data state: `tafsirAyahs: TafsirAyah[]`, `tafsirLoading`, `tafsirError`
- Add a tab switcher bar below the ornamental divider (inside sticky header), two buttons styled like pills: النص / التفسير
- Fetch tafsir data when switching to التفسير tab (or when edition changes), cache result in component state — reuse across ayah-level views
- **النص tab**: Current ayah cards. BookOpen button calls `handleAyahTafsir(ayahNum)` which sets `focusedAyah` and switches to التفسير tab
- **التفسير tab**:
  - Header showing edition name (e.g. تفسير الميسر)
  - If `focusedAyah` is set: show only that ayah's tafsir with header "تفسير الآية ٣" + a link "عرض تفسير السورة بالكامل" that clears focusedAyah
  - If `focusedAyah` is null: show all ayahs' tafsir in order, each with ayah number header and text block
- Remove `TafsirPanel` import and usage (replaced by inline tabs)

### 2. Caching strategy
- `fetchTafsir(surahNumber, editionId)` already checks IndexedDB first, then fetches and caches. No change needed.
- In the component, store the fetched `TafsirAyah[]` array in state so switching between full-surah and single-ayah views doesn't re-fetch.
- When focused on a specific ayah, just filter from the already-fetched array.

### 3. Remove `src/components/quran/TafsirPanel.tsx`
No longer needed — tafsir is shown inline via tabs.

## Files
- **Edit**: `src/pages/SurahReaderPage.tsx` — add tabs, inline tafsir view, remove TafsirPanel
- **Delete**: `src/components/quran/TafsirPanel.tsx` — replaced by inline tabs

