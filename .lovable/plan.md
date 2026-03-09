

# Fix Prayer Times Accuracy — Use GPS + Browser Timezone

## Problem
Prayer times are inaccurate because:
1. **Timezone is guessed** via `Math.round(longitude / 15)` — this can be off by 1+ hours for many countries (e.g., Egypt is UTC+2 but the formula may yield UTC+2 or UTC+3 depending on exact longitude)
2. **Notification hooks** (`usePrayerNotifications`, `useAzkarNotifications`) hardcode Cairo timezone and don't pass user GPS coordinates — so they always compute times for Cairo defaults
3. The browser already knows the **exact local timezone offset** via `new Date().getTimezoneOffset()`

## Fix

### `src/lib/prayer-times.ts`
- Change `getTimezoneOffset(lng)` to use the **browser's actual timezone**: `-(new Date().getTimezoneOffset() / 60)` as the default when no explicit timezone is provided
- This single change fixes accuracy for all components that call `calculatePrayerTimes`

### `src/hooks/usePrayerNotifications.ts`
- Use `useLocation()` hook to get GPS coordinates and pass them to `calculatePrayerTimes(now, { latitude, longitude })`
- Remove hardcoded Cairo timezone — compare against local time instead of `cairoNow`

### `src/hooks/useAzkarNotifications.ts`
- Same fix: use `useLocation()` and pass coordinates to `calculatePrayerTimes`
- Remove Cairo timezone hardcoding

## Files to modify
- `src/lib/prayer-times.ts` — fix timezone default (1 line change)
- `src/hooks/usePrayerNotifications.ts` — add location, remove Cairo hardcode
- `src/hooks/useAzkarNotifications.ts` — add location, remove Cairo hardcode

