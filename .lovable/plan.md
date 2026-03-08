

# Plan: Live Countdown Widget for Each Prayer

## Current State
Only the next prayer shows a small text line "متبقي X دقيقة على الفجر". The user wants each prayer to have a prominent, attractive live countdown.

## Design

Each prayer row will show a **live countdown** to its time (if it hasn't passed yet). For passed prayers, show "انتهى" or just the prayer time. The **next prayer** gets a larger, hero-style countdown widget at the top — a big card with hours:minutes:seconds ticking down in real-time.

### Hero Countdown (Next Prayer)
Replace the small text line (lines 117-128) with a prominent card:
- Large prayer name + icon centered
- Big `HH:MM:SS` countdown in `text-4xl font-bold tabular-nums` with a gradient or primary color
- Circular progress ring around it showing % of time elapsed since previous prayer
- Subtle pulse animation on the seconds
- Update interval changed from 60s to 1s for live seconds

### Per-Prayer Row Countdown
In each prayer row (lines 142-180), add a compact countdown badge showing `H:MM` remaining if the prayer is upcoming, replacing or augmenting the static time display:
- Upcoming prayers: show `متبقي ٢:١٥` in a small badge
- Next prayer: highlighted badge with primary color
- Passed prayers: just show the adhan time, no countdown

### Technical Changes in `src/pages/PrayerPage.tsx`:
1. Change `setInterval` from 60s → 1s and track `secondsLeft` not just `minutesLeft`
2. Add a `now` state that updates every second (for per-prayer countdowns)
3. New hero countdown section with SVG circular progress
4. Each prayer row gets a computed "time remaining" display
5. `formatCountdown` updated to support `HH:MM:SS` format

### Update `src/lib/prayer-times.ts`:
- `getNextPrayer` returns `secondsLeft` instead of `minutesLeft`
- Add `getTimeRemainingForPrayer(prayerTime: string, now: Date): number` helper returning seconds remaining (negative if passed)

## Files

| File | Action |
|------|--------|
| `src/lib/prayer-times.ts` | Add seconds-based helpers |
| `src/pages/PrayerPage.tsx` | Hero countdown widget + per-row countdowns, 1s interval |

