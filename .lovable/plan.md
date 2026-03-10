

## Smart PWA Auto-Update System

### What We're Building
A hook (`useServiceWorkerUpdate`) that runs on every app open. If the user is online, it checks for a new service worker version. If an update is found, it shows a toast/banner with a progress indicator and applies the update. If offline, it silently does nothing — the app works fine from cache.

### How It Works

1. **`src/hooks/useServiceWorkerUpdate.ts`** — New hook:
   - On mount, check `navigator.onLine`
   - If online, call `navigator.serviceWorker.getRegistration()` then `registration.update()` to force a SW check
   - Listen for the `updatefound` event on the registration
   - When a new SW is `installing`, track its `statechange` — when it reaches `installed` and there's an existing controller, set `updateAvailable = true`
   - Expose state: `{ updateAvailable, isUpdating, applyUpdate }` 
   - `applyUpdate()` calls `registration.waiting.postMessage({ type: 'SKIP_WAITING' })` and reloads on `controllerchange`
   - If offline or update check fails — silently ignore, app works offline

2. **`src/components/UpdateNotification.tsx`** — New component:
   - Shows a bottom toast/banner when `updateAvailable` is true
   - Displays: "تحديث جديد متاح" with a progress bar animation and "تحديث الآن" button
   - On click: calls `applyUpdate()`, shows updating state with progress bar, then page reloads
   - Styled with motion animation, consistent with existing UI

3. **`src/components/layout/AppShell.tsx`** — Add `<UpdateNotification />` inside the shell

4. **`vite.config.ts`** — Already uses `registerType: "autoUpdate"` which is good. The `vite-plugin-pwa` auto-registers and handles `SKIP_WAITING`. The hook just adds the UI layer on top.

### Files to Create
- `src/hooks/useServiceWorkerUpdate.ts`
- `src/components/UpdateNotification.tsx`

### Files to Modify
- `src/components/layout/AppShell.tsx` — render `<UpdateNotification />`

