

# Fix Audio Gaps & Duration Display

## Root Cause

The per-ayah playback mode (loading 286 separate MP3 files for Al-Baqarah, for example) will **always** have gaps between ayahs regardless of pre-loading optimizations. Each file is a separate HTTP resource with its own audio header/silence padding, and the browser's `.play()` call is inherently async. This is a fundamental limitation of per-ayah playback.

The duration issue is also caused by this: in per-ayah mode, `duration` only reflects the current ayah's file length (e.g., 5 seconds), not the entire surah.

## Solution

**Switch to full-surah audio as the default playback mode.** A single audio file plays continuously with zero gaps and shows the correct total duration. Per-ayah highlighting can still work by tracking which ayah corresponds to the current playback position, but that's a future enhancement — for now, the priority is smooth, uninterrupted recitation.

### Changes

**`src/contexts/AudioPlayerContext.tsx`**
- In the `play()` function, always use the full-surah path (the `resolveAudioSource` flow) regardless of whether `ayahs` are passed or `hasAyahAudio` is true.
- Keep ayah data in `ayahsRef` for potential future use (tap-to-play-from-ayah), but don't use per-ayah audio files.
- Remove the per-ayah branching logic from `play()` — all reciters now use the same single-file path.
- Keep `advanceToNextAyah`, `playAyahFallback`, and `preloadNextAyahWithListeners` but they won't be called during normal playback.

**`src/components/quran/SurahBottomBar.tsx`**
- Since we're no longer in ayah mode during playback, the progress bar will use the simple `currentTime / duration` calculation.
- The time display will show correct elapsed / total time for the full surah audio.
- The seek slider will work normally (it was disabled in ayah mode).

This is the simplest, most reliable approach — one audio file, zero gaps, correct duration.

