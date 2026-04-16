import { useEffect, useState, useCallback } from "react";
import { flushSyncQueue, getSyncQueueCount, subscribeToQueueChanges } from "@/lib/syncQueue";
import { isSupabaseConfigured } from "@/lib/supabase";

export function useSyncQueue() {
  const [pendingCount, setPendingCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    try {
      const count = await getSyncQueueCount();
      setPendingCount(count);
    } catch {
      setPendingCount(0);
    }
  }, []);

  const flush = useCallback(async () => {
    if (!isSupabaseConfigured || !navigator.onLine) return;
    await flushSyncQueue();
    await refresh();
  }, [refresh]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    void refresh();

    if (navigator.onLine) {
      void flush();
    }

    window.addEventListener("online", flush);
    const unsubscribe = subscribeToQueueChanges(refresh);

    return () => {
      window.removeEventListener("online", flush);
      unsubscribe();
    };
  }, [flush, refresh]);

  return { pendingCount, refresh, flush };
}
