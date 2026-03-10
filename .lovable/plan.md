

## Fix: Manual Update Check Not Detecting Updates

### Problem
The `checkForUpdate()` function calls `reg.update()` then **immediately** checks `reg.waiting`. But `reg.update()` only *starts* downloading the new service worker — it doesn't wait for it to finish installing. So `reg.waiting` is always `null` at that point, and the function always returns `false`.

### Solution
Rewrite `checkForUpdate()` to **wait for the new SW to finish installing** before returning. After calling `reg.update()`, listen for the `updatefound` event, then wait for the installing worker's `statechange` to reach `installed`.

### File: `src/hooks/useServiceWorkerUpdate.ts`

Replace the `checkForUpdate` callback (lines 59-79) with a version that:

1. Calls `reg.update()` to trigger SW fetch
2. If `reg.waiting` already exists, return `true` immediately
3. Otherwise, return a `Promise` that resolves when:
   - `updatefound` fires on the registration
   - The new installing worker reaches `installed` state → resolve `true`
   - Or after a 10-second timeout → resolve `false` (no update found)

```typescript
const checkForUpdate = useCallback(async (): Promise<boolean> => {
  if (!("serviceWorker" in navigator) || !navigator.onLine) return false;
  try {
    const reg = registration || (await navigator.serviceWorker.getRegistration());
    if (!reg) return false;
    setRegistration(reg);
    await reg.update();

    if (reg.waiting) {
      setUpdateAvailable(true);
      return true;
    }

    // Wait for the new SW to install (or timeout)
    return new Promise<boolean>((resolve) => {
      const timeout = setTimeout(() => resolve(false), 10000);

      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (!newWorker) { clearTimeout(timeout); resolve(false); return; }

        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed") {
            clearTimeout(timeout);
            setUpdateAvailable(true);
            resolve(true);
          }
        });
      }, { once: true });
    });
  } catch {
    return false;
  }
}, [registration]);
```

### Single file change
- `src/hooks/useServiceWorkerUpdate.ts` — replace the `checkForUpdate` callback

