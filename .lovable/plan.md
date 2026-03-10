

## Plan: Prayer Page Layout + Global Font Scaling

### 1. Prayer Page — Move Qibla Card Up & Compact Cards

**File: `src/pages/PrayerPage.tsx`**

- Move the Qibla banner from after the prayer list (line 249-266) to right after the Date card (after line 138)
- Make it compact: reduce padding from `p-5` to `p-3`, icon from `h-7 w-7` to `h-5 w-5`, text from `text-lg` to `text-sm`
- Compact the Date card: reduce padding from `p-5` to `p-3.5`
- Compact the Progress card: reduce padding from `p-5` to `p-3.5`
- Compact the Hero countdown: reduce padding from `p-6` to `p-4`, countdown units slightly smaller
- Compact prayer list items: reduce padding from `p-4` to `p-3`

### 2. Global UI Scale for Accessibility

**New setting: `wise-ui-scale`** stored in localStorage with values: `"normal"` | `"large"` | `"xlarge"`

**File: `src/hooks/useTheme.ts`** (or new `src/hooks/useUIScale.ts`)
- Read `wise-ui-scale` from localStorage
- Apply a CSS class on `<html>`: `ui-scale-normal`, `ui-scale-large`, `ui-scale-xlarge`

**File: `src/index.css`**
- Add scaling rules using `font-size` on `:root`:
  - `.ui-scale-normal` — `font-size: 16px` (default)
  - `.ui-scale-large` — `font-size: 18px` 
  - `.ui-scale-xlarge` — `font-size: 20px`
- Since Tailwind uses `rem` units, increasing the root font-size will scale the entire UI proportionally (text, spacing, padding all grow together)

**File: `src/pages/SettingsPage.tsx`**
- Add a "حجم الواجهة" (UI Size) selector in the Appearance section with 3 options: عادي / كبير / كبير جداً
- Keep the existing Quran font-size slider separate (it uses `px` so it's independent)

**File: `src/components/layout/AppShell.tsx`**
- Call the `useUIScale()` hook to apply the class on mount

### Files to Modify
1. `src/pages/PrayerPage.tsx` — move Qibla up, compact all cards
2. `src/index.css` — add `ui-scale-*` root font-size rules
3. `src/hooks/useTheme.ts` — add UI scale logic (keep in same hook)
4. `src/pages/SettingsPage.tsx` — add UI scale selector
5. `src/components/layout/AppShell.tsx` — ensure scale hook runs

