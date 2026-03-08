

# Add Juz & Hizb Navigation to QuranPage

## What
Add tabs at the top of the surah list area to let users browse the Quran by **Juz (جزء)** or **Hizb (حزب)** in addition to the current surah list. Each Juz/Hizb entry shows which surahs it contains, and tapping expands or navigates to the relevant surah.

## Approach

### New data file: `src/data/juz-hizb-data.ts`
- Static array of 30 Juz entries, each with: `juzNumber`, `name` (الجزء الأول, etc.), `startSurah`, `startAyah`, `endSurah`, `endAyah`
- Static array of 60 Hizb entries with same structure
- This is well-known fixed Quran data — bundle it statically for offline use

### Edit: `src/pages/QuranPage.tsx`
- Add a `viewMode` state: `"surahs" | "juz" | "hizb"` (default `"surahs"`)
- Add a tab bar (3 pill buttons) below the search input: **السور** | **الأجزاء** | **الأحزاب**
- When `viewMode === "juz"`: render a list of 30 Juz cards, each showing the Juz number (Arabic), name, and the range of surahs it covers (e.g. "البقرة ١٤٢ — آل عمران ٩٢"). Tapping navigates to `/surah/{startSurah}`
- When `viewMode === "hizb"`: same pattern with 60 Hizb entries
- When `viewMode === "surahs"`: current behavior unchanged
- Hide ayah search results and bookmarks/favorites views when in juz/hizb mode

### UI Layout
```
[Header: القرآن الكريم  ⭐ 🔖]
[Daily goal bar]
[Last read card]
[Search input]
[السور | الأجزاء | الأحزاب]   ← new tab bar
[List content based on selected tab]
```

### Files
- **New**: `src/data/juz-hizb-data.ts`
- **Edit**: `src/pages/QuranPage.tsx`

