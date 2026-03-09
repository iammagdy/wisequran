
# Enhanced Features & Improved Qibla Compass

## Overview
Add powerful new features and significantly enhance the Qibla compass with better accuracy, calibration, and visual feedback.

---

## 1. Enhanced Qibla Compass (`src/pages/QiblaPage.tsx`)

### Accuracy Improvements
- **Magnetic Declination Correction**: Calculate and apply local magnetic declination for true north accuracy
- **Compass Calibration UI**: Add calibration instructions + "figure-8" prompt when accuracy is low
- **Accuracy Indicator**: Show compass accuracy level (low/medium/high) from `DeviceOrientationEvent.webkitCompassAccuracy`
- **GPS Precision Display**: Show location accuracy in meters from `coords.accuracy`

### Visual Enhancements
- **Distance to Kaaba**: Calculate and display distance (km) using Haversine formula
- **Location Info Card**: Show user's city/coordinates with accuracy badge
- **Alignment Feedback**: Haptic vibration + visual glow when pointing within ±5° of Qibla
- **Compass Lock Button**: Lock current heading to avoid needle jitter
- **Full-screen Mode**: Option to hide UI for distraction-free orientation

### New UI Elements
```text
┌─────────────────────────────────────┐
│  ← اتجاه القبلة                     │
│    البوصلة نحو الكعبة المشرفة       │
├─────────────────────────────────────┤
│        ┌─────────────┐              │
│        │   COMPASS   │ ← Animated   │
│        │    🕋       │   needle     │
│        └─────────────┘              │
│                                     │
│  [Accuracy: ●●●○] [Calibrate]       │
│                                     │
│  ┌─────────────────────────────────┐│
│  │ اتجاه القبلة: ٢٣٤°              ││
│  │ المسافة: ١٢٣٤ كم               ││
│  │ دقة الموقع: ±١٠ متر            ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

---

## 2. Dynamic Prayer Times with User Location

### Enhancement: `src/lib/prayer-times.ts`
- Add function to calculate prayer times for **any coordinates** (not just Cairo)
- Store user's preferred location or auto-detect via geolocation
- Support multiple calculation methods (Egyptian, ISNA, MWL, Umm Al-Qura)

### New Hook: `src/hooks/useLocation.ts`
- Centralized geolocation hook shared by Qibla and Prayer pages
- Cache location in localStorage to avoid repeated prompts
- Reverse geocoding for city name display

---

## 3. Reading Achievements System

### New Hook: `src/hooks/useAchievements.ts`
Track and unlock spiritual achievements:
- 🔥 **Streak Badges**: 7-day, 30-day, 100-day reading streaks
- 📖 **Surah Completion**: Completed Al-Baqarah, completed Juz Amma
- 🎯 **Daily Goals**: Met daily goal 10 times, 50 times
- 🕋 **Hifz Milestones**: Memorized 10 surahs, 50 surahs

### New Component: `src/components/AchievementsSheet.tsx`
- Bottom sheet showing all achievements (locked/unlocked)
- Animation on new unlock
- Access from Stats page

---

## 4. Advanced Bookmarking & Notes

### Enhancement: Bookmark with Notes
- Allow adding personal notes to bookmarks
- Add tags/categories to bookmarks (Tafsir, Memorization, Review)
- Quick filter by tag on QuranPage

### New Data Structure
```ts
interface EnhancedBookmark {
  surah: number;
  ayah: number;
  note?: string;
  tag?: 'tafsir' | 'hifz' | 'review' | 'favorite';
  createdAt: string;
}
```

---

## 5. Reading Reminders & Focus Mode

### New Hook: `src/hooks/useReadingReminder.ts`
- Schedule daily reading reminder at user-chosen time
- Uses Notification API with stored preference

### Focus Mode in SurahReader
- Full-screen distraction-free reading
- Hide all UI except ayah text
- Gentle background gradient
- Timer showing reading duration

---

## 6. Ayah of the Day Widget Enhancement

### Improvements to `DailyAyah.tsx`
- Show different ayah each day (deterministic by date)
- Add "Share" button to share via native share or copy
- Add "Listen" button to play audio

---

## Files to Create
- `src/hooks/useLocation.ts` — Shared geolocation hook
- `src/hooks/useAchievements.ts` — Achievement tracking
- `src/components/AchievementsSheet.tsx` — Achievement display
- `src/hooks/useReadingReminder.ts` — Reading notification scheduler

## Files to Modify
- `src/pages/QiblaPage.tsx` — Major enhancement with accuracy, calibration, distance
- `src/lib/prayer-times.ts` — Support dynamic coordinates
- `src/pages/PrayerPage.tsx` — Use user location for accurate times
- `src/pages/StatsPage.tsx` — Add achievements section
- `src/components/quran/DailyAyah.tsx` — Add share/listen buttons
- `src/pages/SurahReaderPage.tsx` — Focus mode, enhanced bookmarks

## Priority Implementation Order
1. **Qibla Compass Enhancement** — Immediate user value
2. **Dynamic Prayer Times** — Accuracy for all users
3. **Achievements System** — Gamification & motivation
4. **Enhanced Bookmarks** — Power-user feature
5. **Reading Reminders** — Habit building
