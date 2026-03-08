

# Plan: Redesign Weekly Prayer View — RTL, Premium, No Thumbnails

## Problem

The "آخر 7 أيام" section has:
1. LTR layout (days ordered left-to-right despite `dir="rtl"` on ScrollArea)
2. Empty bar chart "thumbnails" that look broken
3. Today not visually prominent enough

## Solution

Replace the current bar-chart weekly view with a clean, premium horizontal row of day circles:

- **RTL order**: Reverse the `last7` array so the rightmost day is the earliest and today appears on the left (natural RTL reading)
- **Remove bar charts entirely** — replace with circular progress indicators showing `count/5` as a ring
- **Today highlight**: Larger ring, primary color fill, "اليوم" label below
- **Layout**: Use `flex-row-reverse` to enforce RTL without ScrollArea (7 items fit on any phone)

### Visual concept:
```text
   سبت   جمع   خمي   أرب   ثلا   إثن   اليوم
   ○2    ○4    ○3    ○5    ○1    ○0    ●4
```

Each circle shows the prayer count inside. The ring stroke fills proportionally (count/5). Today gets `ring-2 ring-primary bg-primary/10` and the label "اليوم" instead of the day name.

### Changes in `src/pages/PrayerPage.tsx` (lines 184-220):

- Remove `ScrollArea` and `ScrollBar` imports if no longer used
- Remove the bar chart `div` with `h-20` height
- Remove the hijri date line per day
- Replace with a simple `flex flex-row-reverse` grid of 7 equal columns
- Each column: circular div with SVG ring progress, count number inside, day name below
- Today column: highlighted with primary colors, label "اليوم"
- Use `getArabicDayShort()` for compact day names

## Files

| File | Action |
|------|--------|
| `src/pages/PrayerPage.tsx` | **Update** — replace weekly view section (lines 184-220) |

One file, layout change only. No logic changes to prayer tracking.

