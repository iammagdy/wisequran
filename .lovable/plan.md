
# Add Digital Tasbeeh Counter

## Overview
Create a dedicated tasbeeh (سبحة) page with a large tappable counter, haptic feedback, customizable targets, and preset dhikr phrases.

## Changes

### 1. New Page: `src/pages/TasbeehPage.tsx`
- Large circular tap area for counting
- Haptic feedback using `navigator.vibrate(10)` on each tap
- Preset dhikr options: سبحان الله، الحمد لله، الله أكبر، لا إله إلا الله، أستغفر الله
- Customizable target count (33, 99, 100, or custom)
- Progress ring around counter
- Reset button and total session count
- Persist current count and target in localStorage

### 2. Update Navigation: `src/components/layout/BottomNav.tsx`
- Add Tasbeeh tab with a suitable icon (Circle or similar)
- Route: `/tasbeeh`

### 3. Update Routes: `src/App.tsx`
- Add route for `/tasbeeh` → `TasbeehPage`

## UI Design
```
┌─────────────────────────┐
│  التسبيح                │
│  سبحان الله ▼           │  ← Dropdown to select dhikr
├─────────────────────────┤
│                         │
│     ╭───────────╮       │
│     │    ٣٣    │       │  ← Large tappable circle
│     │   / ٩٩   │       │     with progress ring
│     ╰───────────╯       │
│                         │
│   [↺ Reset]  [⚙ Target] │
│                         │
│   Total today: ٢٩٧      │
└─────────────────────────┘
```

## Technical Details
- Use `navigator.vibrate(10)` for subtle haptic (gracefully degrades on unsupported devices)
- Store in localStorage: `wise-tasbeeh-target`, `wise-tasbeeh-count`, `wise-tasbeeh-total-{date}`
- Use framer-motion for tap animation on the counter
- Progress ring via SVG circle with stroke-dasharray
