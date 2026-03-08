

# Fix: Countdown timer RTL order

The issue: `dir="ltr"` on the countdown container forces hours to the left. In an RTL app, we should remove `dir="ltr"` and keep the JSX order as `h, m, s` — RTL flex will render hours on the right, seconds on the left.

## Change in `src/pages/PrayerPage.tsx` (line 134)

Remove `dir="ltr"` from the countdown flex container:

```tsx
// Before
<div className="flex items-center justify-center gap-1 font-mono" dir="ltr">

// After
<div className="flex items-center justify-center gap-1 font-mono">
```

JSX order stays: `h → : → m → : → s`
RTL renders as: ساعة (right) → دقيقة (middle) → ثانية (left) ✓

One line change.

