

# Fix Reciter Name in Audio Bar + Add Navigation on Click

## Issues

### 1. Wrong reciter name displayed
**Root cause**: `GlobalAudioBar` and the audio context show `getReciterById(reciterId).name` where `reciterId` is the **current** localStorage setting — not the reciter that was used when playback started. So if the user changes the reciter in settings while audio is playing, the displayed name is wrong (and vice versa — starting with one reciter but showing another's name).

**Fix**: Store the `playingReciterId` as part of `AudioPlayerState` in the context. When `play()` is called, save the current `reciterId` into state. The `GlobalAudioBar` and `SurahBottomBar` should read from `state.playingReciterId` instead of the live `reciterId` setting.

### 2. Click audio bar to navigate to surah
**Fix**: Wrap the info section of `GlobalAudioBar` in a clickable area that navigates to `/surah/{surahNumber}` using `react-router-dom`'s `useNavigate`.

### 3. Audio-synced ayah highlighting
This requires switching from full-surah MP3 files to **per-ayah audio playback**. The `api.alquran.cloud` API provides individual ayah audio files. The architecture change:

- Add a new playback mode in `AudioPlayerContext` that plays ayahs one-by-one sequentially
- Track `currentAyahNumber` in state
- Each ayah audio URL: `https://cdn.islamic.network/quran/audio/128/{reciter.folder}/{globalAyahNumber}.mp3`
- When an ayah finishes, auto-advance to the next
- Expose `currentAyahNumber` from context so `SurahReaderPage` can highlight the active ayah
- In `SurahReaderPage`, apply a highlight class to the currently playing ayah and auto-scroll to it

## Files to Edit

| File | Change |
|------|--------|
| `src/contexts/AudioPlayerContext.tsx` | Add `playingReciterId` to state, add per-ayah playback mode with `currentAyahNumber`, expose navigation data |
| `src/components/quran/GlobalAudioBar.tsx` | Use `playingReciterId` for name display, add `useNavigate` click handler to navigate to surah |
| `src/components/quran/SurahBottomBar.tsx` | Use `playingReciterId` for name display |
| `src/lib/reciters.ts` | Add `getReciterAyahAudioUrl` helper for per-ayah audio URLs |
| `src/pages/SurahReaderPage.tsx` | Read `currentAyahNumber` from audio context, highlight and auto-scroll to the playing ayah |

