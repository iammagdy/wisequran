
# Add Tap-to-Seek During Audio Playback

## Current State
- `AudioPlayerContext` stores timestamps in `timestampsRef` (private ref)
- Has `seek(time)` function but no way to seek by ayah number
- Ayah cards in `SurahReaderPage` and `MushafPageView` highlight during playback but aren't tappable for seeking

## Changes

### 1. `src/contexts/AudioPlayerContext.tsx`
Add `seekToAyah(ayahNumber: number)` function:
- Look up the ayah's `from` timestamp in `timestampsRef`
- Convert ms to seconds and call `seek()`
- Only works when audio is playing for the current surah

```typescript
// Add to context interface
seekToAyah: (ayahNumber: number) => void;

// Implementation
const seekToAyah = useCallback((ayahNumber: number) => {
  const ts = timestampsRef.current.find(t => t.numberInSurah === ayahNumber);
  if (ts && audioRef.current) {
    audioRef.current.currentTime = ts.from / 1000;
    setState(s => ({ ...s, currentTime: ts.from / 1000 }));
  }
}, []);
```

### 2. `src/pages/SurahReaderPage.tsx`
Make ayah text tappable when audio is playing for this surah:
- Wrap ayah text in a clickable element
- On tap, call `audioPlayer.seekToAyah(ayah.numberInSurah)`
- Show visual feedback (cursor pointer) when seekable

### 3. `src/components/quran/MushafPageView.tsx`
Same behavior for mushaf mode:
- Make ayah number badge (`﴿١﴾`) seekable during playback
- Call `seekToAyah` on tap

## UX
- Tapping an ayah during playback immediately jumps audio to that verse
- Works in both ayah-by-ayah and mushaf reading modes
- No effect when audio isn't playing (normal tap behavior preserved)
