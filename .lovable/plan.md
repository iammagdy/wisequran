
# Show Current Ayah Number in Audio Bar

## Current State
- `GlobalAudioBar.tsx` already has ayah display logic (lines 64-66), but it's gated by `isAyahMode` which is always `false` in full-surah playback
- The context exposes `currentAyahInSurah` (1-indexed ayah number) which updates during playback via timestamp lookup
- Need to also expose the total ayah count from timestamps

## Changes

### 1. `src/contexts/AudioPlayerContext.tsx`
- Update `totalAyahs` when timestamps are fetched (currently stays at 0)
- Set `totalAyahs = timestamps.length` after successful QF API fetch

### 2. `src/components/quran/GlobalAudioBar.tsx`
- Remove `isAyahMode` dependency from the ayah display condition
- Show "آية X من Y" when `currentAyahInSurah !== null && totalAyahs > 0`
- Use `currentAyahInSurah` directly (already 1-indexed from timestamp lookup)

## Result
During full-surah playback with timestamp-enabled reciters, the audio bar will show:
```
سورة الفاتحة
مشاري العفاسي · آية ٣ من ٧
```
