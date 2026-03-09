
# Reading Statistics Dashboard

## Overview
Add a statistics page/modal accessible from the Quran page showing reading analytics with charts, streaks, and historical data.

## Data Model Enhancement

### New Hook: `src/hooks/useReadingStats.ts`
Extend tracking to store daily history (not just current day):
```ts
interface DailyLog {
  date: string; // YYYY-MM-DD
  ayahCount: number;
  timeSpentMinutes: number;
}
```
- Store last 90 days of reading data
- Calculate weekly/monthly aggregates
- Track total lifetime stats

### Update: `src/hooks/useDailyReading.ts`
- Add `logReading(ayahCount, timeSpentMinutes)` that persists to daily history
- Migrate existing single-day tracking to append to history array

## New Components

### 1. `src/components/stats/StatsPage.tsx` (or Modal)
Full-page dashboard with:
- **Hero Stats Row**: Total ayahs read, total time, longest streak
- **Weekly Chart**: Bar chart showing ayahs per day (last 7 days) using Recharts
- **Monthly Overview**: Grid calendar with color intensity per day's reading
- **Streak Section**: Current streak flame + max streak achieved
- **Goal Progress**: Circular progress ring with today's goal completion

### 2. `src/components/stats/WeeklyChart.tsx`
- BarChart using existing `recharts` dependency
- Arabic day names on x-axis
- Gradient fill bars matching app theme
- Touch-friendly tooltips

### 3. `src/components/stats/StreakCalendar.tsx`
- 4-week mini heatmap calendar
- Color scale: no activity → light → primary color
- Tap day to see details

### 4. `src/components/stats/StatCard.tsx`
- Reusable stat display with icon, value, label
- Glass-card styling consistent with app

## Navigation
- Add "الإحصائيات" button in QuranPage header (BarChart3 icon)
- Opens full-page route `/stats` or sheet/drawer

## Visual Design
- Match existing spiritual aesthetic (gradients, glass cards, ornamental elements)
- Animated number counters on stat values
- Smooth entrance animations using framer-motion

## Files to Create/Modify
- Create: `src/hooks/useReadingStats.ts`
- Create: `src/pages/StatsPage.tsx`
- Create: `src/components/stats/WeeklyChart.tsx`
- Create: `src/components/stats/StreakCalendar.tsx`
- Create: `src/components/stats/StatCard.tsx`
- Update: `src/App.tsx` (add route)
- Update: `src/pages/QuranPage.tsx` (add nav button)
- Update: `src/hooks/useDailyReading.ts` (add history logging)
