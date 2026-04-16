import { createContext, useContext, type ReactNode } from "react";
import { useSyncQueue } from "@/hooks/useSyncQueue";

type SyncQueueContextType = ReturnType<typeof useSyncQueue>;

const SyncQueueContext = createContext<SyncQueueContextType | null>(null);

export function SyncQueueProvider({ children }: { children: ReactNode }) {
  const value = useSyncQueue();
  return <SyncQueueContext.Provider value={value}>{children}</SyncQueueContext.Provider>;
}

export function useSyncQueueContext(): SyncQueueContextType {
  const ctx = useContext(SyncQueueContext);
  if (!ctx) throw new Error("useSyncQueueContext must be used within SyncQueueProvider");
  return ctx;
}
