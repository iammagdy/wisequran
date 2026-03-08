

# Plan: Show Reciter Name + Persistent Player + Fix Islam Sobhi Audio

Three issues to address:

## 1. Islam Sobhi audio not working
The CDN at `cdn.islamic.network` does **not** have Islam Sobhi (`ar.islamsobhi` returns AccessDenied). His audio is hosted on mp3quran.net with a different URL pattern:
- `https://server14.mp3quran.net/islam/Rewayat-Hafs-A-n-Assem/001.mp3`
- Surah number is zero-padded to 3 digits (e.g. `001`, `002`, `114`)

**Fix in `src/lib/reciters.ts`**: Change the URL-building logic to support per-reciter URL patterns. Islam Sobhi gets a custom URL builder, while others keep the existing CDN pattern.

```text
reciters.ts changes:
- Add a `getUrl` function or `urlPattern` field per reciter
- Islam Sobhi: https://server14.mp3quran.net/islam/Rewayat-Hafs-A-n-Assem/{NNN}.mp3
- Others: https://cdn.islamic.network/quran/audio-surah/128/{folder}/{N}.mp3
```

## 2. Show reciter name in the bottom bar
In `SurahBottomBar.tsx`, add the reciter name next to the surah name in Row 2. Simple text addition using `getReciterById(reciterId).name`.

## 3. Persistent player across pages
Currently `SurahBottomBar` is only rendered inside `SurahReaderPage`. When navigating away, the component unmounts and audio stops.

**Approach**: Lift the audio player state into a React context at the `App` level. The bottom bar renders globally (inside `AppShell`) when audio is active, not just on the surah page.

Architecture:
```text
New: src/contexts/AudioPlayerContext.tsx
  - Holds: audioRef, playing, currentTime, duration, surahNumber, surahName, reciterId
  - Exposes: play(surahNumber, surahName), pause, seek, stop
  - Audio element lives here (never unmounts)

Modified: src/components/layout/AppShell.tsx
  - Render <GlobalAudioBar /> when player has active surah

New: src/components/quran/GlobalAudioBar.tsx
  - Compact version of SurahBottomBar that shows on non-surah pages
  - Shows: play/pause, surah name, reciter name, progress, close button

Modified: src/components/quran/SurahBottomBar.tsx
  - Uses AudioPlayerContext instead of local state for audio
  - Keeps full UI (timer, download) only on surah page

Modified: src/components/layout/BottomNav.tsx
  - Add bottom padding when audio player is visible

Modified: src/pages/SurahReaderPage.tsx
  - Pass context-based play to SurahBottomBar
```

### Background audio on mobile
The MediaSession API is already set up, which is the correct approach for keeping audio playing when the user switches apps. The `Audio` element will now live in context (never unmounts), so it will naturally keep playing across page navigation and when the app is backgrounded. Actual background behavior depends on browser/OS, which we already acknowledge with the disclaimer text.

## Files changed
- **Edit**: `src/lib/reciters.ts` — custom URL per reciter
- **New**: `src/contexts/AudioPlayerContext.tsx` — global audio state
- **New**: `src/components/quran/GlobalAudioBar.tsx` — compact persistent player
- **Edit**: `src/components/quran/SurahBottomBar.tsx` — use context, show reciter name
- **Edit**: `src/components/layout/AppShell.tsx` — render global bar
- **Edit**: `src/components/layout/BottomNav.tsx` — adjust spacing
- **Edit**: `src/App.tsx` — wrap with AudioPlayerProvider

