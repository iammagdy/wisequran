

# Plan: Simplify Prayer Page — Today Only

## Changes

### 1. `src/lib/utils.ts` — Add fallback to `getArabicDayName`
The array is already correct. Just add `?? ""` fallback for safety (as user requested).

### 2. `src/pages/PrayerPage.tsx` — Remove weekly view, keep today only

**Remove:**
- `last7` useMemo (lines 94-108)
- `weekData` state (line 60)
- `getArabicDayShort` import
- Entire "Weekly View" section (lines 223-286)
- Week data migration logic in `todayData` useMemo (lines 75-77)

**Keep as-is:**
- Date header block (lines 119-123) — already shows day name, hijri, gregorian correctly
- Hero countdown widget
- Progress bar
- Prayer list with countdowns

Result: A focused, today-only prayer page with correct Arabic day/date header, no weekly history.

## Files

| File | Change |
|------|--------|
| `src/lib/utils.ts` | Add `?? ""` fallback to `getArabicDayName` |
| `src/pages/PrayerPage.tsx` | Remove weekly view section and related state/imports |

