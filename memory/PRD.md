# PRD

## Original Problem Statement
The user asked to implement Phase 1 of the roadmap without breaking existing functionality.
User choices:
- Phase 1 feature set: selected option A.
- Ayah notes: explicitly declined by user, so not implemented.
- Custom home dashboard: reorder + show/hide.
- Per-surah offline management: download/delete + filter by downloaded/not downloaded.
- Friday mode answer was provided, but Friday mode was not part of the chosen Phase 1 feature set, so it was not implemented in this phase.

## Architecture Decisions
- Preserve all existing app flows and add new features incrementally.
- Keep new tools as route-level additions or contained UI panels to reduce regression risk.
- Use localStorage-backed customization for dashboard order/visibility and recitation fallback history.
- Use a local fallback for recitation history when Supabase is not configured, so analytics/heatmap still work safely.
- Reuse existing Quran/audio/Hifz data sources instead of replacing core infrastructure.

## What Has Been Implemented
- Added **custom home dashboard controls** in `QuranPage`:
  - show/hide dashboard sections
  - reorder sections
  - reset to defaults
- Added **smart Hifz planner** in `HifzPage`:
  - urgent review suggestion
  - continue in-progress surah
  - suggested next new surah
- Expanded **Offline Center** in `OfflineCenterPage` with:
  - per-surah text/audio download and delete controls
  - all/downloaded/pending filters
  - search field
- Added **recitation mistake heatmap** in `StatsPage` based on recitation history.
- Added **auto-practice weak ayahs** in `RecitationTestPage` as a safe replacement feature after the user declined ayah notes.
- Added safe **local recitation history fallback** in `useRecitationHistory.ts` when Supabase is not configured.
- Preserved and verified existing routes and main app behavior.

## Prioritized Backlog
### P0
- Modularize large pages (`QuranPage`, `RecitationTestPage`, `HifzPage`) to reduce regression risk.
- Add broader `data-testid` coverage to remaining interactive controls.

### P1
- Deepen the heatmap into per-ayah/word-level struggle analytics.
- Expand the Hifz planner into a full weekly memorization schedule.
- Add batch actions in Offline Center (e.g. selected surahs only).

### P2
- Add Friday mode as a separate phase if requested.
- Add richer dashboard widgets and saved dashboard presets.

## Next Tasks
- If requested, continue with Phase 2 or polish Phase 1 by splitting large pages and deepening recitation analytics.
- Re-run real device QA for offline/audio-heavy flows if needed.
