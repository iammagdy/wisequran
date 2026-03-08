

# Plan: Prayer Time Notifications using Notification API

## Approach

Create a custom hook `usePrayerNotifications` that:
1. Checks every minute if a prayer time has arrived
2. Sends a browser `Notification` when it matches
3. Tracks which prayers were already notified today (to avoid duplicates)
4. Stores the user's notification preference in localStorage

Add a toggle in **SettingsPage** to enable/disable prayer notifications, which triggers the permission request on first enable.

## Changes

### 1. New hook: `src/hooks/usePrayerNotifications.ts`

- Accepts prayer times from `calculatePrayerTimes`
- Every 30 seconds, compares current time (HH:MM) against each prayer time
- If a match is found and not yet notified today, fires `new Notification("حان وقت صلاة الفجر 🕌", { body: "٤:٤٥ ص", icon: "/icons/icon-192.png" })`
- Stores notified prayers in a `Set` keyed by today's date (resets daily)
- Uses localStorage key `wise-prayer-notifications-enabled` (boolean)

### 2. Update `src/pages/PrayerPage.tsx`

- Import and call `usePrayerNotifications(prayerTimes)` so notifications run while the page is open
- Also call it from `AppShell` or `App.tsx` so it works even when not on the prayer page

### 3. Update `src/pages/SettingsPage.tsx`

- Add a new section "إشعارات الصلاة" with a Switch toggle
- On enable: call `Notification.requestPermission()`, save to localStorage
- On disable: save preference
- Show permission status note if denied: "تم رفض إذن الإشعارات، يرجى تفعيلها من إعدادات المتصفح"

### 4. Update `src/App.tsx`

- Import and call `usePrayerNotifications()` at the app level so notifications work regardless of which page the user is on

## Files

| File | Action |
|------|--------|
| `src/hooks/usePrayerNotifications.ts` | **Create** — notification logic |
| `src/pages/SettingsPage.tsx` | **Update** — add toggle |
| `src/App.tsx` | **Update** — activate hook globally |

No new dependencies. Uses standard `Notification` API only.

