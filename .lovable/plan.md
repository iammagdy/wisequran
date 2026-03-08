

# Fix Audio Gaps Between Ayahs

## Root Cause
The current pre-loading mechanism loads the next ayah's audio file in advance, but when `ended` fires, it still goes through the full `playAyahAtIndex` flow — setting loading state, adding event listeners, calling `setState` multiple times. These React state updates and listener setup create a noticeable pause between ayahs.

## Fix Strategy
Create a **fast-path transition** that bypasses the full setup when pre-loaded audio is ready:

1. When preloading, attach all event listeners (timeupdate, ended, error, loadedmetadata) to the pre-loaded audio **immediately** during preload — not during the transition.
2. On `ended`, if `nextAudioRef` is ready (`readyState >= 2`), call `.play()` on it directly and update state in a single `setState` call — no loading state, no awaiting.
3. Only fall back to the full `playAyahAtIndex` if the pre-loaded audio isn't ready yet.

## File: `src/contexts/AudioPlayerContext.tsx`

**Changes:**
- Refactor `preloadNextAyah` to also attach `timeupdate`, `ended`, `loadedmetadata`, and `error` listeners to the pre-loaded audio element, so it's fully ready to swap in.
- Add a `advanceToNextAyah` function that does a fast swap: sets `audioRef` to the pre-loaded element, calls `.play()`, updates state atomically (ayah number, index, duration — no `loading: true`), and immediately starts preloading ayah N+2.
- In the `ended` handler, call `advanceToNextAyah` if pre-loaded audio is buffered enough (`readyState >= 2`), otherwise fall back to `playAyahAtIndex`.
- Keep `playAyahAtIndex` as the initial/fallback path (first ayah, or when preload failed).

This eliminates the gap by avoiding the loading state flash and async setup during transitions.

