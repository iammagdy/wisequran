

# إضافة أدعية يومية + عداد تنازلي للإفطار + التحكم بظهور تبويب رمضان

## ١. أدعية يومية لكل يوم من رمضان (٣٠ دعاء)

### `src/lib/ramadan-data.ts`
- Add `DAILY_DUAS` array with 30 entries, one per day — each has `day`, `text` (the dua), and `source`
- Content: authentic duas from Quran and Sunnah, varied daily

### `src/pages/RamadanPage.tsx`
- Add a "دعاء اليوم" section in the header area showing today's dua based on `ramadanDay`
- Add a share button using `navigator.share()` (Web Share API) with fallback to `navigator.clipboard.writeText()`
- The dua card gets a prominent amber-themed design with share icon

## ٢. عداد تنازلي لوقت الإفطار (المغرب)

### `src/pages/RamadanPage.tsx`
- Add a countdown card below the header showing time remaining until Maghrib
- Use `calculatePrayerTimes()` from `src/lib/prayer-times.ts` with user location from `useLocation()`
- Update every second via `setInterval`
- Display format: `ساعات : دقائق : ثوانٍ` in Arabic numerals
- After Maghrib passes: show "حان وقت الإفطار! 🎉" with optional notification
- Use `Notification` API to send alert at Maghrib time (if permission granted)

## ٣. إخفاء تبويب رمضان بعد انتهاء رمضان + تحكم يدوي

### `src/hooks/useRamadan.ts`
- `isRamadanNow()` already detects Hijri month 9 — this handles auto-hide after Ramadan ends
- Add a new localStorage key `wise-ramadan-hidden` — when `true`, user has manually dismissed the tab
- Export a new function `hideRamadanTab()` / `showRamadanTab()`

### `src/components/layout/BottomNav.tsx`
- Check both `isRamadanNow()` AND `!localStorage.getItem("wise-ramadan-hidden")` before showing the tab
- Tab is completely hidden outside Ramadan (already works via Hijri detection)

### `src/pages/SettingsPage.tsx`
- Add a toggle in settings: "إظهار تبويب رمضان" — allows user to manually hide/show the Ramadan tab during Ramadan
- Only visible when `isRamadanNow()` is true

## Files to modify
- `src/lib/ramadan-data.ts` — add 30 daily duas
- `src/hooks/useRamadan.ts` — add `hideRamadanTab`/`showRamadanTab` helpers
- `src/pages/RamadanPage.tsx` — add daily dua with share + iftar countdown
- `src/components/layout/BottomNav.tsx` — respect manual hide setting
- `src/pages/SettingsPage.tsx` — add Ramadan tab visibility toggle

