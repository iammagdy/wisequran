

# Plan: Audio Download Manager in Settings

## What to Build

Add a new "Audio Downloads" section to the Settings page that shows per-surah audio download status and provides bulk download/delete controls.

## Changes

### 1. Add `getAllDownloadedAudio()` to `src/lib/db.ts`
- New function that returns all audio keys (surah numbers) from the `audio` store, similar to `getAllDownloadedSurahs()`.
- Add `clearAllAudio()` to clear only the audio store.

### 2. Expand `src/pages/SettingsPage.tsx`
Add a new card section "الصوت المحمّل" (Downloaded Audio) after the existing Quran text download manager:

- **Header**: Shows count like `12/114 سورة` for audio.
- **Bulk actions**: "تحميل الكل" (Download All Audio) and "مسح الكل" (Delete All Audio) buttons with progress bar during download.
- **Expandable surah list** (collapsible via a "عرض التفاصيل" toggle): Shows each surah name with a green checkmark if audio is downloaded, or a small download/delete icon button per surah. Uses `fetchSurahList()` (already loaded) for names.
- Download uses `downloadSurahAudio()` from `quran-audio.ts`; delete uses `deleteAudio()` from `db.ts`.
- Confirmation dialog (using existing AlertDialog) before bulk delete.

### 3. Existing "مسح الكل" button in the text download section
- Keep as-is (clears text + azkar + audio). Add the new audio section separately so users can manage audio independently.

### UI Layout (in Settings, after existing download manager card)
```
┌─────────────────────────────────┐
│  الصوت المحمّل          12/114  │
│  [مسح الصوت] [تحميل كل الصوت]  │
│  ▼ عرض التفاصيل                │
│  ┌─ الفاتحة         ✓ [🗑]  ─┐ │
│  │  البقرة           ✓ [🗑]   │ │
│  │  آل عمران         [⬇]     │ │
│  └────────────────────────────┘ │
└─────────────────────────────────┘
```

### Files Modified
- `src/lib/db.ts` — add `getAllDownloadedAudio()`, `clearAllAudio()`
- `src/pages/SettingsPage.tsx` — add audio download manager section with per-surah list

### No new files or dependencies needed.

