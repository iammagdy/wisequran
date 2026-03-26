# PRD

## Original Problem Statement
The user asked to analyze app performance, fix any issues without breaking functionality, remove the Ramadan tab because Ramadan is over while keeping the page code for later reuse, and update the app changelog/version to 3.3.0.

## Architecture Decisions
- Keep all product flows intact and focus on safe, low-risk performance improvements.
- Improve frontend performance through Vite bundle splitting rather than rewriting feature logic.
- Keep the Ramadan page route/code in the app, but remove current-season navigation exposure.
- Reduce Settings page overhead by deferring heavy storage/database helpers until they are actually needed.
- Clean up console/runtime warnings that affect maintainability and testing confidence.

## What Has Been Implemented
- Added smarter Vite manual chunk splitting to break large vendor code into smaller bundles (`motion-vendor`, `ui-vendor`, `data-vendor`, `charts-vendor`, etc.).
- Reduced the main app chunk from roughly ~824 KB before optimization to ~172 KB after splitting (pre-gzip build output comparison).
- Moved Settings page IndexedDB/storage helpers behind a deferred import path via `src/lib/settings-storage.ts`, so the Settings route no longer pulls those helpers eagerly.
- Removed the Ramadan tab from the bottom navigation and removed Ramadan visibility controls from Settings.
- Kept the `/ramadan` route and Ramadan page code in the codebase for future seasonal reuse.
- Updated page transition ordering after Ramadan nav removal.
- Added stronger testability coverage with `data-testid` on bottom nav links and Settings changelog controls.
- Fixed React Router future-flag warnings by opting into supported future flags on `BrowserRouter`.
- Fixed dialog accessibility warning in `NowPlayingScreen` by adding hidden dialog title/description.
- Removed the unnecessary Supabase missing-env console warning and prevented eager Azan fallback audio requests in Settings.
- Updated app version to `3.3.0` in `package.json`, `src/data/changelog.ts`, and `CHANGELOG.md`.
- Added 3.3.0 changelog content focused on performance improvements and Ramadan tab cleanup.

## Prioritized Backlog
### P0
- Split `SettingsPage.tsx` into smaller feature-focused components/hooks to reduce long-term regression risk.
- Reduce debug auth console logs in production-facing flows if no longer needed.

### P1
- Further isolate database utilities used by Quran/tafsir/audio flows to optimize chunking even more.
- Add more `data-testid` coverage to other high-impact interactive controls.

### P2
- Explore font loading optimization/fallback strategy to reduce occasional external font request noise.
- Add a lightweight internal performance diagnostics panel for route/chunk timing.

## Next Tasks
- If desired, continue with a second performance pass focused specifically on auth logs, font loading, and breaking up `SettingsPage.tsx`.
- Re-run device-level QA after any future seasonal feature reactivation (like Ramadan).
