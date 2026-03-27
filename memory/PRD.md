# PRD

## Original Problem Statement
The user asked to add improvements 1, 2, 3, 4, 5, 6 from the suggested roadmap without breaking the existing app.
Selected scope:
1. Safari diagnostics = full diagnostics page with logs/history.
2. Smarter recitation = all upgrades in scope.
3. Better offline mode = Quran text + reciter audio only.
4. Reading personalization = implemented with safe defaults.
5. Progress dashboard = basic first version now, expandable later.
6. Home improvements = resume last surah + continue listening.

## Architecture Decisions
- Keep all additions frontend-only and preserve existing product flows.
- Add new capability pages as lazy-loaded routes (`/offline`, `/settings/safari-diagnostics`) to avoid hurting initial load.
- Reuse existing download/audio infrastructure instead of replacing it.
- Add lightweight reader personalization via localStorage-backed hook to avoid invasive state changes.
- Enhance recitation incrementally inside the current flow instead of rewriting the page.

## What Has Been Implemented
- Added `SafariDiagnosticsPage` with:
  - browser/device status cards
  - audio/microphone/notification quick tests
  - persistent diagnostics history log in localStorage
- Added `OfflineCenterPage` focused on:
  - Quran text offline downloads
  - current reciter audio downloads
  - text/audio clear actions
  - storage summary
- Added `useReaderPersonalization` hook with:
  - line spacing presets
  - reader text tone presets
  - focus preset options
- Wired reader personalization into:
  - Settings page controls
  - SurahReaderPage
  - MushafPageView
  - FocusMode
- Added separate home quick-resume cards for:
  - continue reading
  - continue listening
- Improved progress dashboard (`StatsPage`) with:
  - weekly goal card
  - memorization snapshot card
  - Hifz/review summaries
- Improved recitation flow (`RecitationTestPage` + `RecitationScoreCard`) with:
  - pause tolerance slider
  - practice-missed-part action after result
  - preserved start/recording flow
- Added Settings quick tools linking to Offline Center and Safari Diagnostics.
- Verified requested additions plus regression smoke on existing routes.

## Prioritized Backlog
### P0
- Split large pages (`SettingsPage`, `RecitationTestPage`, `SurahReaderPage`) into smaller modules to reduce regression risk.
- Expand `data-testid` coverage across remaining interactive controls.

### P1
- Upgrade the basic progress dashboard into a richer trend view with recitation analytics and listening minutes.
- Expand Offline Center with per-surah management and sync/status insights.

### P2
- Add richer Safari diagnostics export/share and deeper device troubleshooting tips.
- Add more advanced reader personalization such as layout presets and mushaf styling options.

## Next Tasks
- If requested, continue with a second pass that modularizes the large pages and deepens recitation analytics.
- Re-run device-focused QA for Safari diagnostics and offline flows on physical phones if needed.


## Version Update
- Updated package version, popup changelog data, and markdown changelog to 3.3.1.
