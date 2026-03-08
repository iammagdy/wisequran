

# Plan: Add Surah Audio Playback & Reading Timer

## What Changes

### 1. IndexedDB Schema Update (`src/lib/db.ts`)
- Bump DB version to 2
- Add new `audio` object store keyed by surah number, storing `ArrayBuffer` blobs
- Add helpers: `saveAudio(surahNumber, blob)`, `getAudio(surahNumber)`, `deleteAudio(surahNumber)`

### 2. Audio API Helper (`src/lib/quran-audio.ts`)
- New file with a function to get the audio URL for a surah using a single stable reciter (Mishary Rashid Alafasy via `cdn.islamic.network`)
- URL pattern: `https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/{surahNumber}.mp3`
- Function to download audio as ArrayBuffer and store in IndexedDB

### 3. Audio Player Component (`src/components/quran/SurahAudioPlayer.tsx`)
- Small, collapsible bar at the bottom of the surah reader (above the bottom nav area)
- Shows: Play/Pause button, progress bar (HTML `<input type="range">`), elapsed/total time
- "Download for offline" button with loading spinner
- Offline logic:
  - Check IndexedDB for cached audio first → create blob URL and play
  - If not cached, check `navigator.onLine` → if online, stream from CDN
  - If offline and not cached → show "صوت غير متاح بدون إنترنت" message
- Uses `HTMLAudioElement` directly (no extra dependencies)

### 4. Reading Timer Component (`src/components/quran/ReadingTimer.tsx`)
- Small UI section (grouped with audio in a toolbar/panel)
- Preset buttons: 5, 10, 15, 20 min
- When active: shows countdown with a circular or linear progress indicator
- When done: fires a `sonner` toast ("انتهى وقت القراءة 📖")
- Uses `setInterval` — purely client-side, no persistence needed

### 5. Updated Surah Reader Page (`src/pages/SurahReaderPage.tsx`)
- Add a small floating toolbar/panel between the header and ayahs content
- Contains two collapsible sections: Audio Player and Reading Timer
- Toggleable via small icons in the header to keep the page clean

### Audio Source
- **Reciter**: Mishary Rashid Alafasy (most popular, stable CDN)
- **CDN**: `cdn.islamic.network` — free, no API key needed
- **Format**: 128kbps MP3, one file per surah

### Offline Audio Flow
```
User taps "Download" → fetch MP3 as ArrayBuffer → store in IndexedDB (audio store)
User taps "Play" → check IndexedDB → found? play from blob URL : online? stream : show offline message
```

### Files Modified
- `src/lib/db.ts` — add audio store
- `src/pages/SurahReaderPage.tsx` — integrate audio player + timer

### Files Created
- `src/lib/quran-audio.ts` — audio URL + download logic
- `src/components/quran/SurahAudioPlayer.tsx` — audio player UI
- `src/components/quran/ReadingTimer.tsx` — timer UI

### No New Dependencies
Uses native `HTMLAudioElement`, existing `sonner` for toasts, existing `idb` for storage.

