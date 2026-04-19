# Wise Quran (القرآن الكريم)

A modern, feature-rich, offline-first Progressive Web App (PWA) for reading the Quran, listening to recitations, tracking spiritual habits, and managing Hifz (memorization) progress.

## Tech Stack

- **Frontend:** React 18 + TypeScript
- **Build Tool:** Vite
- **Package Manager:** pnpm
- **Styling:** Tailwind CSS + Radix UI (shadcn/ui pattern)
- **State:** TanStack Query + React Context + IndexedDB (offline-first)
- **Virtualization:** @tanstack/react-virtual (useWindowVirtualizer for Surah Reader ayah list)
- **Backend/Cloud Sync:** Supabase (optional, app works without it)
- **PWA:** Vite PWA Plugin + Workbox

## Project Structure

- `src/` — Main source code
  - `components/` — Feature components (quran, prayer, ramadan, sleep, stats, ui, layout)
  - `contexts/` — React Context providers (Audio, Auth, Language)
  - `hooks/` — Custom hooks (useHifz, useAdhan, usePrayerNotifications, etc.)
  - `lib/` — Core logic, API clients, utilities, DB schemas
  - `pages/` — Route-level view components
  - `data/` — Static data (surah-meta, azkar-data)
- `public/` — Static assets, icons, audio files
- `supabase/` — Edge Functions and SQL migrations
- `dist/` — Production build output

## Key Features

1. Quran reading with Uthmanic typography, multiple reciters, verse-by-verse highlighting
2. Prayer times, Adhan notifications, Qibla compass, Tasbeeh counter
3. Hifz (memorization) tracking with recitation testing
4. Friday Mode hub for Jumu'ah activities
5. Sleep Mode with gradual audio fade-out and nature sounds
6. Ramadan tracker, Azkar collections, stats dashboard
7. Backup & Restore — export/import all user progress (hifz, reading, azkar, wird) as a JSON file from Settings and the DevKit

## Performance Notes

- **SettingsPage chunk** is prefetched during idle time after app startup (alongside main tabs)
- **Audio byte tracking**: `db.ts` maintains `wise-audio-bytes-total` in localStorage (updated by `saveAudio`/`deleteAudio`/`clearAllAudio`). `getStorageStats()` reads this O(1) instead of loading all audio ArrayBuffers from IDB.
- **`getAllDownloadedAudio()`** uses key-only IDB scan (`getAllKeys`) to avoid loading ArrayBuffers.
- **AudioPlayerContext** is split into 3 separate contexts to minimize re-renders; `timeupdate` is suppressed when the page is hidden.
- **Developer control panel** at `/devkit` (PIN: "devkit") — session-locked, standalone route outside AppShell.

## Development

```bash
pnpm install
pnpm run dev   # starts on http://0.0.0.0:5000
```

## Deployment

Configured as a static site deployment:
- Build: `pnpm run build` → outputs to `dist/`
- Served as static files

### Pre-deploy gates

`.github/workflows/deploy.yml` runs three blocking checks before the SFTP step
so a broken build cannot reach production:

1. `pnpm run check:no-undef` — fails on any ESLint `no-undef` error under `src/`.
   Catches missing icon imports and other undeclared references that
   TypeScript/`vite build` let through but blow up at runtime.
2. `pnpm run check:build-env` — fails if any required `VITE_*` env var is
   missing or empty before the build runs (prevents Vite from inlining empty
   strings into the bundle).
3. `pnpm run check:smoke` — boots the freshly built `dist/` in headless
   Chromium and asserts that `#root` has at least one rendered child. Catches
   the blank-page failure mode.

Run all three locally with `pnpm run predeploy`.

## Environment Variables

- `VITE_SUPABASE_URL` — Supabase project URL. Required for CI/deploy builds
  (the `check:build-env` gate blocks deploys when missing). Local dev still
  runs without it, but sign-in and sync will be disabled.
- `VITE_SUPABASE_ANON_KEY` — Supabase anonymous key. Same requirement as above.
