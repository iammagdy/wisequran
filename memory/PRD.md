# PRD

## Original Problem Statement
The user asked to go with Phase 2 while ensuring no existing functionality breaks.
Chosen scope:
- Friday mode + deeper memorization planning + advanced recitation feedback
- Friday mode should be a full hub with multiple cards and reminders
- Memorization planning should include daily + weekly revision planning
- Advanced recitation feedback should include all proposed analytics
- Version should be bumped and changelog updated

## Architecture Decisions
- Add Friday mode as a dedicated lazy-loaded route instead of overloading existing pages.
- Keep Friday reminders lightweight and app-safe via local notification checks while the app is open.
- Extend existing Hifz and recitation screens rather than replacing them.
- Preserve compatibility when Supabase is not configured by using a local recitation-history fallback.
- Use a minor feature-release bump to 3.4.0.

## What Has Been Implemented
- Added `/friday` with `FridayModePage` including:
  - Surah Al-Kahf shortcut
  - Friday reminder toggle + test reminder button
  - salawat counter with reset
  - Friday checklist
- Added `useFridayReminders()` and wired it into `App.tsx` so Friday reminders can trigger safely while the app is open.
- Added a Friday entry card to `PrayerPage`.
- Expanded `HifzPage` with a **weekly revision planner** card:
  - due today / tomorrow / this week
  - seven-day due buckets
  - daily recommendation text
- Expanded `RecitationScoreCard` with advanced feedback:
  - average confidence
  - strongest ayah
  - weakest ayah
  - most difficult words summary
- Added a local fallback path in `useRecitationHistory.ts` so recitation analytics continue to work without Supabase.
- Updated version surfaces to **3.4.0** in:
  - `package.json`
  - `src/data/changelog.ts`
  - `CHANGELOG.md`
- Fixed a Friday reminder timezone edge case by switching to local date keys.

## Prioritized Backlog
### P0
- Add stronger deterministic data-testid coverage for recitation result analytics and Friday interactions.
- Split oversized Hifz / Recitation pages into smaller modules.

### P1
- Add richer Friday content such as dua collections, Jumu'ah prep reminders, and saved Friday goals.
- Expand memorization planning into a full week planner with adjustable targets and adaptive difficulty.

### P2
- Add export/share options for Friday progress and recitation summaries.
- Add deeper per-word recitation trends across time.

## Next Tasks
- If requested, continue with Phase 3 or deepen the Friday/planner analytics further.
- Re-run device-level QA for reminder-heavy flows on real mobile devices if needed.
