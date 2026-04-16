import { addToSyncQueue, getAllSyncQueueEntries, deleteSyncQueueEntry, getSyncQueueCount } from "./db";
import { isSupabaseConfigured, supabase } from "./supabase";

export { getSyncQueueCount };

// ─── Queue change notifications ──────────────────────────────────────────────
type RefreshCallback = () => void;
const changeListeners = new Set<RefreshCallback>();

export function subscribeToQueueChanges(cb: RefreshCallback): () => void {
  changeListeners.add(cb);
  return () => changeListeners.delete(cb);
}

function notifyQueueChanged(): void {
  changeListeners.forEach((cb) => cb());
}

// ─── Error classification ─────────────────────────────────────────────────────

/** Returns true when a Supabase result error looks like a transient network or server problem. */
function isRetriableError(err: { message?: string; status?: number } | null): boolean {
  if (!err) return false;
  if (!navigator.onLine) return true;
  if (typeof err.status === "number" && err.status >= 500) return true;
  const msg = (err.message ?? "").toLowerCase();
  return (
    msg.includes("failed to fetch") ||
    msg.includes("network request failed") ||
    msg.includes("networkerror") ||
    msg.includes("load failed") ||
    msg.includes("timeout")
  );
}

/** Returns true when a thrown exception is a network connectivity failure. */
function isThrownNetworkError(err: unknown): boolean {
  if (err instanceof TypeError) {
    const msg = err.message.toLowerCase();
    return (
      msg.includes("failed to fetch") ||
      msg.includes("network request failed") ||
      msg.includes("networkerror") ||
      msg.includes("load failed") ||
      msg.includes("the internet connection appears to be offline")
    );
  }
  return err instanceof Error && err.name === "AbortError";
}

// ─── Core helpers ─────────────────────────────────────────────────────────────

async function persistToQueue(
  table: string,
  operation: "upsert" | "insert",
  payload: Record<string, unknown>,
  onConflict?: string
): Promise<void> {
  try {
    await addToSyncQueue({ table, operation, payload, onConflict, timestamp: Date.now() });
    notifyQueueChanged();
  } catch (queueErr) {
    console.error("[syncQueue] Failed to persist entry:", queueErr);
  }
}

function writeToSupabase(
  table: string,
  operation: "upsert" | "insert",
  payload: Record<string, unknown>,
  options?: { onConflict?: string }
) {
  const builder = supabase.from(table);
  return operation === "upsert"
    ? builder.upsert(payload, options)
    : builder.insert(payload);
}

let isFlushing = false;

// ─── Public API ───────────────────────────────────────────────────────────────

export async function enqueuedSupabaseWrite(
  table: string,
  operation: "upsert" | "insert",
  payload: Record<string, unknown>,
  options?: { onConflict?: string }
): Promise<void> {
  if (!isSupabaseConfigured) return;

  try {
    const result = await writeToSupabase(table, operation, payload, options);

    if (result.error) {
      if (isRetriableError(result.error)) {
        await persistToQueue(table, operation, payload, options?.onConflict);
      } else {
        console.error(`[syncQueue] Permanent error on ${operation} to ${table}:`, result.error.message);
      }
    }
  } catch (err) {
    if (!navigator.onLine || isThrownNetworkError(err)) {
      await persistToQueue(table, operation, payload, options?.onConflict);
    } else {
      console.error(`[syncQueue] Unexpected error on ${operation} to ${table}:`, err);
    }
  }
}

export async function flushSyncQueue(): Promise<number> {
  if (!isSupabaseConfigured || !navigator.onLine || isFlushing) return 0;

  isFlushing = true;
  let flushed = 0;
  try {
    const entries = await getAllSyncQueueEntries();
    for (const entry of entries) {
      if (entry.id === undefined) continue;
      try {
        const opts = entry.onConflict ? { onConflict: entry.onConflict } : undefined;
        const result = await writeToSupabase(entry.table, entry.operation, entry.payload, opts);

        if (!result.error) {
          await deleteSyncQueueEntry(entry.id);
          flushed++;
        } else if (!isRetriableError(result.error)) {
          // Permanent failure — drop the entry to avoid an indefinitely stuck queue
          console.error(`[syncQueue] Dropping permanently failed entry for ${entry.table}:`, result.error.message);
          await deleteSyncQueueEntry(entry.id);
        }
        // Retriable errors: leave in queue for the next flush
      } catch {
        // Keep entry in queue; retry on next flush
      }
    }
  } catch (err) {
    console.error("[syncQueue] Failed to flush queue:", err);
  } finally {
    isFlushing = false;
    if (flushed > 0) notifyQueueChanged();
  }
  return flushed;
}
