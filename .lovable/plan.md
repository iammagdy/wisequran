

# Focus Mode for Surah Reader

## Overview
Add a full-screen, distraction-free reading mode to the Surah Reader that hides all UI chrome (header, tabs, bottom bar, navigation) and shows only the ayah text with a calm background gradient and an integrated reading timer.

## Implementation

### New Component: `src/components/quran/FocusMode.tsx`
A full-screen overlay component that:
- Renders as a fixed overlay covering the entire viewport (z-50)
- Shows ayah text in a scrollable area with generous padding and large font
- Calm gradient background (subtle spiritual tones matching the theme)
- Integrated reading timer at the top (elapsed time counting up)
- Minimal controls: exit button (X) in corner, font size adjustment (optional)
- Auto-hides the bottom nav and any audio bars
- Smooth enter/exit animations via framer-motion
- Strips bismillah as normal, renders ayahs inline or as cards
- Highlights currently playing ayah if audio is active
- Tap ayah number to seek audio (same as normal mode)

### UI Layout
```text
┌──────────────────────────────────┐
│  [X]              ٥:٣٢  ⏱      │  ← minimal header: close + timer
│                                  │
│                                  │
│     بِسْمِ اللَّهِ الرَّحْمَٰنِ    │
│                                  │
│   ﴿١﴾ الْحَمْدُ لِلَّهِ رَبِّ     │
│   الْعَالَمِينَ                   │
│                                  │
│   ﴿٢﴾ الرَّحْمَٰنِ الرَّحِيمِ     │
│                                  │
│        ... scrollable ...        │
│                                  │
└──────────────────────────────────┘
```

### Modify: `src/pages/SurahReaderPage.tsx`
- Add a `focusModeActive` state toggle
- Add a focus mode button in the header (e.g. `Maximize2` icon)
- Render `<FocusMode>` overlay when active, passing ayahs, fontSize, surahNumber, surahInfo, playingAyah, seekToAyah
- When focus mode is active, prevent body scroll behind overlay

### Component Props
```ts
interface FocusModeProps {
  ayahs: Ayah[];
  fontSize: number;
  surahNumber: number;
  surahName: string;
  playingAyah: number | null;
  onSeekToAyah: (n: number) => void;
  onClose: () => void;
}
```

### Timer Behavior
- Starts automatically when focus mode opens (counts up, not down)
- Shows elapsed reading time in `MM:SS` format with Arabic numerals
- Pauses if user exits focus mode, resets on re-entry

### Files to Create
- `src/components/quran/FocusMode.tsx`

### Files to Modify
- `src/pages/SurahReaderPage.tsx` — add toggle state + button + render overlay

