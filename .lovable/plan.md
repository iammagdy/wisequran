

# تبويب رمضان — أنشطة وأجواء رمضانية

## Overview
Create a seasonal Ramadan tab that **only appears during Ramadan** (detected via Hijri date). It provides curated activities, a Quran completion plan for the month, daily Ramadan checklist, and a warm Ramadan-themed UI.

## Ramadan Detection
- Use `Intl.DateTimeFormat("en-u-ca-islamic")` to get the current Hijri month
- Tab appears only when Hijri month = 9 (Ramadan)
- For testing: add a localStorage override `wise-ramadan-preview` to force-show the tab

## Features Inside the Tab

### 1. Ramadan Khatmah Plan
- Auto-generate a 30-day plan to complete the Quran (1 juz/day)
- Show today's juz with direct link to start reading
- Track completed days with checkmarks
- Progress bar showing overall completion

### 2. Daily Ramadan Checklist
- Pre-defined activities: صلاة التراويح، قراءة الجزء اليومي، صدقة، دعاء الإفطار، قيام الليل، إطعام صائم
- Check/uncheck with daily reset
- Progress indicator

### 3. Ramadan Vibes Header
- Crescent moon and lantern decorations (emoji/CSS-based, no images)
- "رمضان كريم" greeting with day counter (e.g. "اليوم ١٥ من رمضان")
- Warm golden/amber gradient theme for the page

### 4. Suggested Activities Cards
- Scrollable cards with daily suggestions: أدعية مأثورة، أذكار الصيام، فضائل رمضان
- Static curated content, no API needed

## Files to Create
- `src/pages/RamadanPage.tsx` — Full page with all sections above
- `src/hooks/useRamadan.ts` — Hijri month detection, khatmah plan state, daily checklist state (all localStorage)
- `src/lib/ramadan-data.ts` — Static data: activities, daily duas, checklist items

## Files to Modify
- `src/components/layout/BottomNav.tsx` — Conditionally add Ramadan tab (🌙 icon) only during Ramadan
- `src/App.tsx` — Add `/ramadan` route

## Design
- Warm amber/gold gradient header
- Lantern emoji decorations (🏮🌙✨)
- Cards with soft golden borders
- Consistent with existing app design system

