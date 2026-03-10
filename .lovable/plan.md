

## Fix: Make Qibla Prominent on Prayer Page + Defer Location Permission

### Problem
1. The Qibla tool is hidden as a tiny compass icon in the header — users don't notice it
2. `useLocation()` is called on PrayerPage mount, which triggers GPS permission immediately — before the user even wants Qibla

### Changes

**1. `src/pages/PrayerPage.tsx`**
- **Remove** the `useLocation()` import and call — prayer times will use default Cairo coordinates (already the fallback in `calculatePrayerTimes`) or cached location if available from a previous Qibla visit
- **Replace** the small header compass icon with a **prominent Qibla card** placed after the prayer list, styled as an eye-catching banner with a compass icon, "اتجاه القبلة" title, and a "فتح البوصلة" call-to-action. This makes it immediately discoverable
- Read cached location from localStorage directly (read-only, no permission prompt) to show city name if available

**2. `src/hooks/useLocation.ts`** — No changes needed
- The hook already reads cache first; the issue is just that PrayerPage shouldn't call it at all since it triggers GPS when cache is expired

### Layout on Prayer Page (top to bottom)
1. Header: "صلواتي اليوم" (no compass icon needed anymore)
2. Location city (from cache only, no GPS prompt)
3. Date card
4. Countdown hero
5. Progress bar
6. Prayer list
7. **Qibla Banner Card** (new, prominent) — tapping navigates to `/qibla`
8. Prayer Guide card

### Qibla Banner Design
A rounded card with gradient background, compass icon, title "اتجاه القبلة 🕋", subtitle "حدد اتجاه الكعبة المشرفة", and a right-arrow indicator. Visually distinct from the prayer cards so it stands out.

### Files
- **Modify**: `src/pages/PrayerPage.tsx` — remove `useLocation`, remove header compass button, add Qibla banner card, read cached city directly from localStorage

