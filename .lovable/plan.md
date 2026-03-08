

# Plan: Daily Quran Goal, Streak & Favorites

## localStorage Data Structures

```typescript
// Daily reading goal (ayat count)
"wise-daily-goal": number  // e.g. 20 (default: 10)

// Daily reading progress — resets at midnight
"wise-daily-reading": { date: string; count: number }  // e.g. { date: "2026-03-08", count: 14 }

// Streak tracking
"wise-streak": { current: number; lastActiveDate: string }  // e.g. { current: 5, lastActiveDate: "2026-03-08" }

// Favorite surahs
"wise-favorite-surahs": number[]  // e.g. [1, 36, 67]

// Favorite azkar
"wise-favorite-azkar": string[]  // dhikr IDs e.g. ["morning-1", "evening-3"]
```

## Changes

### 1. Streak Logic Hook — `src/hooks/useStreak.ts` (new)
- Reads/writes `wise-streak` from localStorage.
- Exposes `{ streak, markActive() }`.
- `markActive()`: if `lastActiveDate === today` → no-op; if `lastActiveDate === yesterday` → increment streak; else → reset to 1.
- Called from SurahReaderPage (on load = reading) and AzkarPage (on dhikr completion).

### 2. Daily Reading Goal & Progress — `src/hooks/useDailyReading.ts` (new)
- Reads `wise-daily-goal` and `wise-daily-reading`.
- Exposes `{ goal, todayCount, increment(n), setGoal(n) }`.
- Auto-resets count if stored date ≠ today.

### 3. QuranPage (`src/pages/QuranPage.tsx`)
- Add a small progress bar under header: "اليوم: X / Y آية" with a thin progress bar.
- Add streak display: "🔥 N أيام متتالية".
- Add a "⭐ المفضلة" toggle button next to the bookmark button to filter surah list by favorites.

### 4. SurahReaderPage (`src/pages/SurahReaderPage.tsx`)
- On mount (after ayahs load): call `streak.markActive()` and increment daily reading count by number of ayahs displayed.
- Add a ⭐ favorite toggle button in the header for the current surah.

### 5. AzkarPage (`src/pages/AzkarPage.tsx`)
- In `DhikrCounter`: when a dhikr reaches 0, call `streak.markActive()`.
- Add a ❤️ favorite toggle on each dhikr card.
- Add a "المفضلة" filter tab at the top of the categories view showing favorited azkar across categories.

### 6. SettingsPage (`src/pages/SettingsPage.tsx`)
- Add a "Daily Quran Goal" section with preset buttons (10, 20, 50, custom) and a slider.

### 7. PrayerPage (`src/pages/PrayerPage.tsx`)
- Show streak indicator: "🔥 N أيام" small badge near the header.

### Files Created
- `src/hooks/useStreak.ts`
- `src/hooks/useDailyReading.ts`

### Files Modified
- `src/pages/QuranPage.tsx` — goal progress, streak, favorites filter
- `src/pages/SurahReaderPage.tsx` — mark active, increment reading, favorite toggle
- `src/pages/AzkarPage.tsx` — mark active on completion, favorite toggle, favorites view
- `src/pages/SettingsPage.tsx` — daily goal setting
- `src/pages/PrayerPage.tsx` — streak display

