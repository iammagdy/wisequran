

# Fix Bismillah, Page Range, Audio Bar Direction & Duration Display

## Issues & Fixes

### 1. Bismillah still stuck to ayah text
The `stripBismillah` regex may not match all API variants. The API can return text with different Unicode forms (e.g. `ٱ` vs `ا`, different diacritics). **Fix**: Make the regex more flexible — strip any leading text that contains "بسم الله الرحمن الرحيم" pattern with optional diacritics, or match the first few words loosely. Also ensure the Mushaf view applies highlighting for the playing ayah.

### 2. Two Bismillahs — remove duplicate
The decorative Bismillah divider renders above the text (line 346-355 of SurahReaderPage), AND `stripBismillah` should remove it from the ayah text. If strip isn't matching, we get duplicates. Fix #1 above resolves this.

### 3. Page range in header
Currently shows `صفحة ٣٠٨`. Should show the surah's full page range like `صفحة ٣٠٨ — من ٢٠٨ إلى ٢٢١`. **Fix**: Compute `minPage` and `maxPage` from ayahs data and display in the page button and in the Mushaf page counter.

### 4. Audio highlighting not syncing in Mushaf view
The Mushaf view doesn't apply the playing ayah highlight. **Fix**: Pass `playingAyahInSurah` to `MushafPageView` and highlight it, plus auto-navigate to its page.

### 5. Audio bar shows per-ayah duration (8 seconds)
In per-ayah mode, `duration` and `currentTime` reflect single ayah files. User wants to see overall progress (ayah X of Y), not individual file timing. **Fix**: In `GlobalAudioBar` and `SurahBottomBar`, when in ayah-mode, show `آية X من Y` instead of time. Or show cumulative ayah index progress.

### 6. Progress bar goes LTR — should be RTL
The progress bar fills from left using `left-0` + `width`. For RTL, it should fill from right. **Fix**: Change to `right-0` in both `GlobalAudioBar` and `SurahBottomBar`.

## Files to Edit

| File | Change |
|------|--------|
| `src/lib/utils.ts` | Make `stripBismillah` regex more robust to handle all API diacritic variants |
| `src/pages/SurahReaderPage.tsx` | Compute & show page range (min–max) in header; pass `playingAyahInSurah` to MushafPageView |
| `src/components/quran/MushafPageView.tsx` | Accept `playingAyah` prop, highlight playing ayah, auto-scroll to its page |
| `src/components/quran/GlobalAudioBar.tsx` | Fix progress bar to RTL (`right-0`); show ayah progress (آية X من Y) instead of per-ayah seconds |
| `src/components/quran/SurahBottomBar.tsx` | Fix progress bar to RTL; show ayah progress instead of per-ayah seconds |
| `src/contexts/AudioPlayerContext.tsx` | Expose `totalAyahs` and `currentAyahIndex` in state for progress display |

