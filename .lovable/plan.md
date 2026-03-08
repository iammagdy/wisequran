

# Plan: More Reciters, Reading History & Reset Progress

## 1. Add More Reciters

**File: `src/lib/reciters.ts`**

Add ~10 more popular reciters using the `cdn.islamic.network` API (same pattern as existing). Some reciters that use `mp3quran.net` will get custom URL handling like Islam Sobhi.

New reciters to add:
- عبد الباسط عبد الصمد (abdulbasit)
- سعود الشريم (shuraym)  
- عبد الرحمن السديس (sudais)
- ماهر المعيقلي (mahermuaiqly)
- ياسر الدوسري (yasser)
- هاني الرفاعي (rifai)
- أحمد العجمي (ajamy)
- بندر بليلة (baleela)
- خالد الجليل (khalilaljalil)
- ناصر القطامي (qatami)

Update `getReciterAudioUrl` to handle any reciters with non-standard CDN paths.

## 2. Reading History

**New file: `src/hooks/useReadingHistory.ts`**

- Store a `wise-reading-history` array in localStorage
- Each entry: `{ surah: number, surahName: string, timestamp: number, ayahReached: number }`
- On opening a surah, push/update an entry (deduplicate by surah, keep latest timestamp)
- Cap at ~50 entries, sorted by most recent
- Export `history`, `addToHistory`, `clearHistory`

**File: `src/pages/SurahReaderPage.tsx`**
- Call `addToHistory(surahNumber, surahName)` when surah loads successfully

**File: `src/pages/QuranPage.tsx`**
- Add a "سجل القراءة" (Reading History) tab/section showing recently read surahs with timestamps, tappable to navigate back

## 3. Reset Progress Button

**File: `src/pages/SettingsPage.tsx`**

Add a new "إعادة تعيين التقدم" section with an AlertDialog confirmation that clears:
- `wise-last-read` (last read position)
- `wise-bookmarks` (bookmarks)
- `wise-favorite-surahs` (favorites)
- `wise-daily-reading` (daily reading count)
- `wise-streak` (streak data)
- `wise-reading-history` (new history)

This resets all progress while keeping preferences (theme, font size, reciter, tafsir edition) intact. Uses a destructive-styled button with confirmation dialog.

## Files to Create/Edit

| File | Action |
|------|--------|
| `src/lib/reciters.ts` | Add ~10 more reciters |
| `src/hooks/useReadingHistory.ts` | **New** — reading history hook |
| `src/pages/SurahReaderPage.tsx` | Record history on surah load |
| `src/pages/QuranPage.tsx` | Display reading history section |
| `src/pages/SettingsPage.tsx` | Add reset progress button with confirmation |

All data stays in localStorage — no auth, no backend. The device fingerprint is localStorage itself (same browser on same device = same progress).

