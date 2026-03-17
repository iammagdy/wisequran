import { useState, useEffect, useCallback } from "react";

export function useServiceWorkerUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let isChecking = false;

    const performCheck = async () => {
      if (!navigator.onLine || isChecking) return;
      isChecking = true;

      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg) return;

        setRegistration(reg);

        if (reg.waiting) {
          setUpdateAvailable(true);
          return;
        }

        // Force check for new SW
        await reg.update();

        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              setUpdateAvailable(true);
            }
          });
        });
      } catch {
        // Offline or failed — silently ignore
      } finally {
        isChecking = false;
      }
    };

    // Initial check
    performCheck();

    // Check on visibility change (app returning from background)
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        performCheck();
      }
    };

    window.addEventListener("online", performCheck);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("online", performCheck);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  const applyUpdate = useCallback(() => {
    setIsUpdating(true);

    const doReload = () => window.location.reload();

    if (registration?.waiting) {
      let reloaded = false;
      const onControllerChange = () => {
        if (reloaded) return;
        reloaded = true;
        navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
        doReload();
      };

      navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

      // Fallback: if controllerchange never fires within 4s, force reload anyway
      setTimeout(() => {
        if (!reloaded) {
          reloaded = true;
          navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
          doReload();
        }
      }, 4000);

      registration.waiting.postMessage({ type: "SKIP_WAITING" });
    } else {
      // No waiting SW — just reload to pick up any cached updates
      setTimeout(doReload, 300);
    }
  }, [registration]);

  const checkForUpdate = useCallback(async (): Promise<boolean> => {
    if (!("serviceWorker" in navigator) || !navigator.onLine) return false;

    try {
      const reg = registration || (await navigator.serviceWorker.getRegistration());
      if (!reg) return false;

      setRegistration(reg);

      const cacheBuster = `?v=${Date.now()}`;
      const response = await fetch(`/manifest.json${cacheBuster}`, {
        cache: 'no-cache',
        headers: { 'Cache-Control': 'no-cache' }
      });

      if (!response.ok) {
        await reg.update();
      } else {
        await reg.update();
      }

      if (reg.waiting) {
        setUpdateAvailable(true);
        return true;
      }

      return new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => resolve(false), 15000);

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

  return { updateAvailable, isUpdating, applyUpdate, checkForUpdate };
}
