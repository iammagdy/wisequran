

## Analysis

### Root Cause of Download Failure
From the network logs, I can see:
- **Source 1** (`cdn.islamic.network`): Fails with "Failed to fetch" — **CORS blocked**
- **Source 2** (`download.quranicaudio.com`): Returns **200 with valid MP3 data** (ID3 header visible)

The download from source 2 appears to work at the network level. However, the Lovable preview sandbox has strict CORS restrictions that may prevent `arrayBuffer()` from being read even when the response shows 200. The browser blocks reading the response body cross-origin without proper CORS headers, causing silent failures that get caught and move to CORS proxy sources, which return HTML error pages.

### Three User Requests

1. **Auto-cache played audio (Spotify-like)**: When audio plays successfully via URL, automatically save it to IndexedDB for offline use
2. **PWA offline on first visit**: App shell should be fully cached by service worker
3. **Download still broken**: CORS is the core issue — need to use working sources

## Plan

### 1. Fix Download — Use Quran.com API as Primary Source (`src/lib/quran-audio.ts` + `src/lib/reciters.ts`)

The Quran Foundation API (`api.quran.com`) returns direct audio URLs from `download.quranicaudio.com` with proper CORS headers. The app already uses this API for timestamps in `fetchChapterRecitation`. Strategy:

- In `downloadSurahAudio`, try fetching the QF API audio URL first (same URL the player uses successfully)
- Re-order URL sources: QF API URL → `download.quranicaudio.com` → `mp3quran.net` → remove CORS proxies entirely (they don't work)
- Remove `corsproxy.io` and `allorigins.win` — these return HTML error pages

### 2. Auto-Cache Played Audio (`src/contexts/AudioPlayerContext.tsx`)

After audio starts playing successfully from a remote URL:
- Fetch the same URL in the background using `fetch()` 
- Validate it's a real audio file (using existing `isValidAudioFile`)
- Save to IndexedDB via `saveAudio()`
- This gives Spotify-like behavior: play once → available offline forever

Add a new function `cachePlayingAudio(reciterId, surahNumber, audioUrl)` that runs after successful `audio.play()`.

### 3. PWA Offline Caching (`vite.config.ts`)

Current config caches `**/*.{js,css,html,ico,png,svg,woff2}` but:
- Missing `navigateFallbackDenylist` for OAuth routes
- Missing runtime caching for `api.quran.com` (only has `api.alquran.cloud`)
- Missing runtime caching for audio CDNs

Add:
- Runtime cache rule for `api.quran.com` API calls
- Runtime cache rule for `download.quranicaudio.com` audio (CacheFirst, large max entries)
- Runtime cache rule for `mp3quran.net` audio
- `navigateFallbackDenylist: [/^\/~oauth/]`

### 4. Remove CORS Proxies (`src/lib/reciters.ts`)

Remove `CORS_PROXIES` array and all CORS-proxied URL generation from `getReciterAudioUrls`. These never work and just waste time + return HTML errors. Keep only direct URLs from servers that support CORS.

### Files to Modify
- `src/lib/quran-audio.ts` — add auto-cache function, improve download source order
- `src/lib/reciters.ts` — remove CORS proxies, add QF API URL as source
- `src/contexts/AudioPlayerContext.tsx` — trigger auto-cache after successful playback
- `vite.config.ts` — add audio CDN runtime caching rules + navigateFallbackDenylist

