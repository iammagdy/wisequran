import { useState, useEffect, useCallback } from "react";

export function useServiceWorkerUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const checkForUpdate = async () => {
      if (!navigator.onLine) return;

      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg) return;

        setRegistration(reg);

        // If there's already a waiting worker, update is available
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
      }
    };

    checkForUpdate();
  }, []);

  const applyUpdate = useCallback(() => {
    if (!registration?.waiting) return;

    setIsUpdating(true);

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    });

    registration.waiting.postMessage({ type: "SKIP_WAITING" });
  }, [registration]);

  return { updateAvailable, isUpdating, applyUpdate };
}
