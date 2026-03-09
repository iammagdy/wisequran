
# Add Morning & Evening Azkar Reminder Notifications

## Overview
Add notification reminders for أذكار الصباح (morning azkar) at Fajr time and أذكار المساء (evening azkar) at Maghrib time, with a user toggle in Settings.

## Changes

### 1. New Hook: `src/hooks/useAzkarNotifications.ts`
- Follow same pattern as `usePrayerNotifications.ts`
- Check every 30 seconds against calculated Fajr/Maghrib times
- Send notification at Fajr: "حان وقت أذكار الصباح 🌅"
- Send notification at Maghrib: "حان وقت أذكار المساء 🌙"
- Track notified state per day to avoid duplicates
- Use localStorage key: `wise-azkar-notifications`

### 2. Update Settings: `src/pages/SettingsPage.tsx`
- Add toggle switch for "تذكير بأذكار الصباح والمساء"
- Place under existing prayer notifications toggle
- Same permission request flow as prayer notifications

### 3. Wire Hook: `src/App.tsx` or `AppShell.tsx`
- Call `useAzkarNotifications()` alongside existing hooks

## Technical Details
- Reuse `calculatePrayerTimes()` from `@/lib/prayer-times`
- Same notification permission check pattern
- LocalStorage: `wise-azkar-notifications` (boolean)
- Notifications link to `/azkar` page deep-link (optional)
