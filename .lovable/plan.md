

## Root Cause

The `vite-plugin-pwa` is configured with `registerType: "autoUpdate"`. This injects `self.skipWaiting()` directly into the generated service worker, meaning new SWs **never enter the `waiting` state** — they activate immediately. So `checkForUpdate()` can never find a waiting worker, and always returns `false`.

## Fix

**1. `vite.config.ts`** — Change `registerType` from `"autoUpdate"` to `"prompt"`

This makes new service workers wait in the `waiting` state until explicitly told to activate, which is exactly what our manual update flow needs.

**2. `src/main.tsx`** — Register the SW using `registerSW` from `virtual:pwa-register`

Import `registerSW` and call it on app startup. This replaces the implicit auto-registration that `autoUpdate` was doing. The `onNeedRefresh` callback will fire when a new SW is waiting.

**3. `src/hooks/useServiceWorkerUpdate.ts`** — No changes needed

The existing logic correctly checks for `reg.waiting` and listens for `updatefound` → `installed`. Once the SW actually stays in `waiting` state (thanks to the `prompt` mode), everything will work.

### Files
- Modify: `vite.config.ts` (one line change)
- Modify: `src/main.tsx` (add SW registration import)

