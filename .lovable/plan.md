

## Fix: UI Scale Not Applying Globally

### Root Cause

`useLocalStorage` doesn't sync state across component instances. When SettingsPage changes `uiScale`, only SettingsPage's `useTheme` hook updates its React state and runs the `useEffect` to apply the CSS class. When the user navigates to another tab, AppShell re-renders but its `useTheme` hook still has the old `uiScale` value — the `useEffect` won't re-run since its dependency hasn't changed. So the class persists technically, but there may be race conditions or re-mount scenarios resetting it.

### Fix

Make the scale change **imperative** — apply the CSS class directly in the setter function, not just via `useEffect`. Also add a `storage` custom event so all hook instances stay in sync.

**File: `src/hooks/useLocalStorage.ts`**
- Add a `storage` event listener to sync across hook instances when the same key changes in another component
- Dispatch a custom event when `setValue` is called

**File: `src/hooks/useTheme.ts`**  
- Keep the `useEffect` for initial mount (reads correct value from localStorage)
- Also apply the class imperatively inside `setUIScale` as a backup

### Additionally: Convert hardcoded `px` to `rem`

Many elements use `text-[10px]`, `text-[11px]`, `text-[9px]` which won't scale with root font-size. Convert these across all files to rem equivalents:
- `text-[10px]` → `text-[0.625rem]`
- `text-[11px]` → `text-[0.6875rem]`  
- `text-[9px]` → `text-[0.5625rem]`

**Files to update** (all instances of hardcoded px text sizes):
1. `src/pages/SurahReaderPage.tsx`
2. `src/pages/SettingsPage.tsx`
3. `src/pages/HifzPage.tsx`
4. `src/components/layout/BottomNav.tsx`
5. `src/components/quran/SurahBottomBar.tsx`
6. `src/components/quran/GlobalAudioBar.tsx`
7. `src/components/AchievementsSheet.tsx`
8. `src/components/prayer/PrayerGuideCard.tsx`
9. `src/components/ramadan/DailyDuaCard.tsx`

### Summary
1. Fix `useLocalStorage` to sync across components via custom events
2. Convert all `text-[Npx]` to `text-[Nrem]` equivalents so the entire UI scales with the root font-size setting

