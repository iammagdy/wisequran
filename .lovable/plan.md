

# Plan: Sticky Bottom Player Bar + Background Playback

## Approach

**Simplest reliable behavior chosen**: Audio pauses when leaving the Surah reader page. This avoids complexity of a global audio context that persists across routes. The bottom bar is only visible on the Surah reader page.

## Changes

### 1. New Component: `src/components/quran/SurahBottomBar.tsx`

A sticky bottom bar that combines audio + timer in one compact strip:

```text
┌─────────────────────────────────────────────────┐
│  [▶]  ━━━━━━━━━●━━━━━━  0:42/3:15   ⏱ 12:30  │
│  سورة البقرة · تلاوة جارية          [5][10][15]│
└─────────────────────────────────────────────────┘
```

- **Layout**: `fixed bottom-0` with `rounded-t-2xl`, shadow, `bg-card/95 backdrop-blur-md`, `safe-bottom` padding
- **Top row**: Play/Pause button, progress bar with seek, time labels, timer section (countdown or preset buttons)
- **Bottom row**: Surah name + status label ("تلاوة جارية" when playing), download badge
- **Browser note**: Small text below the bar: `"قد يتوقف الصوت تلقائياً حسب إعدادات الجهاز والمتصفح."`
- Receives all audio state as props (lifted from SurahReaderPage)

### 2. Lift Audio State to `SurahReaderPage.tsx`

Move the audio `useRef`, play/pause, seek, download logic out of `SurahAudioPlayer` and into `SurahReaderPage` so the bottom bar can access it. The old `SurahAudioPlayer` component and inline toolbar are removed entirely.

Timer state also lives in SurahReaderPage (or we keep `ReadingTimer` as a self-contained component embedded in the bottom bar).

### 3. Update `SurahReaderPage.tsx`

- Remove the toolbar toggle buttons (Volume2, Timer) from the header — the bottom bar is always visible
- Remove the `showToolbar` / `toolbarTab` state and the `AnimatePresence` toolbar section
- Add `pb-32` to the content area so text doesn't hide behind the bottom bar
- Keep the Star/Favorite button in the header
- Render `<SurahBottomBar>` at the bottom

### 4. Background Playback

- The `new Audio()` element already works in background by default — no `visibilitychange` pause handlers exist in the current code, so it already continues playing when screen locks (within browser limits)
- **Add Media Session API** metadata (`navigator.mediaSession`) so the lock screen shows the surah name and play/pause controls — this is the key thing that keeps browsers from killing the audio tab
- On unmount (navigating away from surah page): pause and cleanup audio — this is the existing behavior in the `useEffect` cleanup

### 5. No changes needed to `BottomNav.tsx`

The BottomNav already hides on `/surah/` routes (line 17), so no conflict with the new bottom bar.

## Files

| File | Action |
|------|--------|
| `src/components/quran/SurahBottomBar.tsx` | **Create** — sticky bottom bar with audio + timer |
| `src/pages/SurahReaderPage.tsx` | **Update** — remove toolbar, lift audio state, add bottom bar, add `pb-32` |
| `src/components/quran/SurahAudioPlayer.tsx` | **Delete** — functionality moved to bottom bar |

`ReadingTimer.tsx` stays as-is and is embedded inside the bottom bar.

