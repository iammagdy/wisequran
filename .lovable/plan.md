

# Feature Enhancement Plan

## Overview
Add several meaningful new features that deepen the spiritual utility of the app while staying within the offline-first PWA architecture.

## New Features

### 1. Qibla Compass (`src/pages/QiblaPage.tsx`)
- Full-page compass using the Device Orientation API (`DeviceOrientationEvent`)
- Calculate Qibla direction from user's geolocation using the great-circle formula
- Animated compass needle (framer-motion rotation) pointing to Kaaba
- Fallback: show Qibla bearing in degrees if device orientation unavailable
- Glass-card design with decorative Kaaba icon at center
- Add to BottomNav or as a button on PrayerPage

### 2. Hifz (Memorization) Tracker (`src/pages/HifzPage.tsx`)
- Grid view of all 114 surahs showing memorization status per surah
- Three states per surah: not started, in progress, memorized (color-coded)
- Tap surah to toggle status; stored in localStorage
- Progress summary: total memorized surahs, total ayahs memorized, percentage of Quran
- Filter by status (all / memorized / in progress)
- Accessible from QuranPage header or BottomNav

### 3. Share Ayah as Image (`src/pages/SurahReaderPage.tsx`)
- Add a "share" button on each ayah card
- Generate a styled card (canvas or DOM-to-image approach using built-in Canvas API)
- Card includes: ayah text, surah name, ayah number, decorative border, app branding
- Use `navigator.share()` for native sharing on mobile, fallback to download
- Spiritual design: gradient background, ornamental frame

### 4. Daily Wird / Reading Portion (`src/components/quran/DailyWird.tsx`)
- Auto-calculate a daily reading portion based on user's goal (e.g., finish Quran in 30 days = 1 juz/day)
- Show today's portion on QuranPage: "اليوم: الجزء X — من سورة Y آية Z إلى سورة W آية V"
- Tap to jump directly to the starting ayah
- Track completion per day in localStorage
- Settings: choose plan duration (30, 60, 90, 180 days)

### 5. Azkar Completion Tracker
- Track daily azkar completion (morning done, evening done, sleep done)
- Show completion badges on AzkarPage category cards
- Daily reset like prayer checklist
- Mini summary widget on home page showing azkar status

---

## Files to Create
- `src/pages/QiblaPage.tsx` — Qibla compass page
- `src/pages/HifzPage.tsx` — Memorization tracker
- `src/hooks/useHifz.ts` — Hifz state management
- `src/hooks/useDailyWird.ts` — Daily reading portion logic
- `src/components/quran/DailyWird.tsx` — Wird widget for QuranPage
- `src/components/quran/ShareAyahCard.tsx` — Share card generator
- `src/hooks/useAzkarCompletion.ts` — Azkar daily completion tracking

## Files to Modify
- `src/App.tsx` — Add routes for `/qibla` and `/hifz`
- `src/components/layout/BottomNav.tsx` — Add Qibla tab (replace or add)
- `src/pages/QuranPage.tsx` — Add Hifz button, Daily Wird widget
- `src/pages/SurahReaderPage.tsx` — Add share button per ayah
- `src/pages/AzkarPage.tsx` — Add completion badges and tracking
- `src/pages/PrayerPage.tsx` — Add Qibla quick-access button

## Priority Order
1. **Hifz Tracker** — Highly requested Islamic app feature, simple to implement
2. **Share Ayah** — Social engagement, straightforward Canvas API usage
3. **Daily Wird** — Guides consistent reading habit
4. **Qibla Compass** — Practical utility, uses device APIs
5. **Azkar Completion** — Extends existing azkar with progress tracking

