

# Fix Audio Gaps, Audio Bar Position, Play Button & Reciter Verification

## Issues Identified

### 1. Audio cuts/gaps between ayahs
**Root cause**: Each ayah is loaded as a separate `Audio` element. When one ends, the next is created and loaded from scratch — causing a noticeable pause.
**Fix**: Pre-load the next ayah while the current one plays. When `timeupdate` fires and we're near the end, create and `preload` the next Audio element. On `ended`, immediately switch to the pre-loaded audio for near-seamless transitions.

### 2. Audio bar hidden behind BottomNav on surah page
**Root cause**: `SurahBottomBar` uses `fixed bottom-0 z-50` and `BottomNav` also uses `fixed bottom-0 z-50` — they overlap. The image confirms the audio bar is behind the nav.
**Fix**: Change `SurahBottomBar` from `bottom-0` to `bottom-14` (3.5rem) to sit above the bottom nav. Adjust safe-area padding accordingly.

### 3. Total audio time not shown
**Root cause**: In per-ayah mode, `duration` reflects only the current ayah file (e.g. 8 seconds).
**Fix**: Already showing "آية X من Y" — keep that. But also show the current ayah's time progress (formatTime) alongside for context.

### 4. Play button unresponsive on surah page
**Root cause**: The `handlePlayPause` calls `player.play(surahNumber, surahName, ayahs)` but `ayahs` might be empty if the data hasn't loaded yet, or the `useCallback` dependencies might be stale.
**Fix**: Add a guard — if `ayahs` is empty or loading, disable the button or show a loading state. Also fix the useCallback dependency to ensure fresh `ayahs` reference.

### 5. Reciter audio verification
The CDN folder values look correct now. For reciters with `hasAyahAudio: false`, they use `mp3quran.net` for full-surah playback (no highlighting). This is correct behavior — just need to make sure errors are handled gracefully.

## Files to Edit

| File | Change |
|------|--------|
| `src/contexts/AudioPlayerContext.tsx` | Add pre-loading logic: when playing ayah N, pre-create Audio for ayah N+1 and call `.load()`. On `ended`, swap immediately. |
| `src/components/quran/SurahBottomBar.tsx` | Change `fixed bottom-0` → `fixed bottom-14` to sit above BottomNav. Show time alongside ayah count. |
| `src/pages/SurahReaderPage.tsx` | Adjust bottom padding from `pb-44` to account for new positioning. Fix `ayahs` dependency in play handler. |

