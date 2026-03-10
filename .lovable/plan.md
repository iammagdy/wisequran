

## Analysis

**Storage permission is NOT the issue.** IndexedDB doesn't require explicit user permission on any browser — it's available by default. The real problem is:

1. **Downloaded data is not actual audio** — CORS proxies and some CDNs return HTML error pages (e.g., 403 pages, redirect pages) that are >1KB, so they pass the current `MIN_AUDIO_SIZE` check. The app saves this garbage to IndexedDB, shows "success", but the data is useless.

2. **No MP3 validation** — The code never checks if the downloaded bytes are actually an MP3 file before saving.

3. **Content-Type not checked** — `fetchAudioFromUrl` doesn't reject `text/html` responses.

Evidence: The download completes "instantly" (a real 5-50MB MP3 would take seconds/minutes), which confirms a small error page is being saved instead.

## Plan

### 1. Add MP3 validation in `src/lib/quran-audio.ts`

- Add `isValidMp3(buffer)` — checks first bytes for `ID3` tag (0x49 0x44 0x33) or MPEG sync word (0xFF 0xE0+)
- In `fetchAudioFromUrl`: reject responses with `Content-Type: text/html`
- In `downloadSurahAudio`: validate with `isValidMp3(buf)` before saving — skip to next source if invalid
- Increase `MIN_AUDIO_SIZE` to 10KB (no valid surah audio is <10KB)

### 2. Add storage stats functions in `src/lib/db.ts`

- `getStorageStats()` — returns breakdown: { quranText, audio, tafsir, total } in bytes
- `getDownloadedAudioDetails(reciterId)` — returns list with sizes

### 3. Add Storage Management section in `src/pages/SettingsPage.tsx`

- New "إدارة التخزين" section showing:
  - Total storage used with visual progress bar
  - Breakdown by type (text / audio / tafsir)
  - Clear buttons per category
  - Individual audio delete per surah

### Files to modify
- `src/lib/quran-audio.ts` — MP3 validation + Content-Type check
- `src/lib/db.ts` — storage stats functions
- `src/pages/SettingsPage.tsx` — storage management UI section

