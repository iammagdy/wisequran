

## UI/UX Analysis for Mobile (iPhone 13 and similar)

### Issues Found

**1. SurahBottomBar overlaps BottomNav (MAIN BUG)**
- `SurahBottomBar` uses `fixed bottom-14` (56px) but BottomNav is taller than 56px, especially on iPhones with safe-area-inset-bottom (~34px on iPhone 13).
- Result: the audio player bar slides under the bottom navigation.

**2. GlobalAudioBar also partially hidden**
- Uses `bottom-[calc(4rem+env(safe-area-inset-bottom))]` (64px + safe area) — this is better but may still clip because BottomNav's total height is `py-2` (8px×2) + icon (20px) + gap (4px) + label (12px) + safe-area ≈ 52px + safe-area. The 4rem assumption is too tight.

**3. AppShell main content padding doesn't account for safe area**
- `pb-20` (80px) doesn't include safe-area-inset-bottom, so content can be hidden behind BottomNav on notched iPhones.

**4. SurahReaderPage uses `pb-72` hardcoded**
- Doesn't adapt to safe area, so on iPhones the bottom of the SurahBottomBar may be cut off.

### Fix Plan

**File: `src/components/layout/BottomNav.tsx`**
- Add a CSS custom property or use a consistent height value. The nav's inner content is ~52px; with safe area it varies. Keep as-is but ensure other components reference the right offset.

**File: `src/components/quran/SurahBottomBar.tsx`** (line 119)
- Change `bottom-14` → `bottom-[calc(3.25rem+env(safe-area-inset-bottom))]` to properly sit above BottomNav on all devices.
- Add `safe-bottom` padding or margin consideration.

**File: `src/components/quran/GlobalAudioBar.tsx`** (line 31)
- Adjust bottom offset to match: `bottom-[calc(3.25rem+env(safe-area-inset-bottom))]` — consistent with SurahBottomBar.

**File: `src/components/layout/AppShell.tsx`** (line 24)
- Change `pb-20` → include safe area: use a class that adds `calc(5rem + env(safe-area-inset-bottom))` as bottom padding.
- Change `pb-36` → similar adjustment for when global bar is showing.

**File: `src/pages/SurahReaderPage.tsx`** (line 201)
- Change `pb-72` to a value that accounts for safe area: `pb-[calc(18rem+env(safe-area-inset-bottom))]` or use a utility class.

**File: `src/index.css`**
- Add utility classes for consistent bottom spacing that includes safe area inset, to avoid repeating `calc()` expressions everywhere.

### Summary of Changes
- 6 files modified
- All bottom-positioned fixed elements will properly account for iPhone safe area
- Main content padding will prevent content from hiding behind nav bars
- Consistent spacing system via CSS utilities

