/**
 * One-shot persistent storage opt-in.
 *
 * Calls `navigator.storage.persist()` exactly once per device after the
 * user takes an explicit action that implies they want their data to
 * stick around (the first Sleep-Mode offline download is a perfect
 * trigger). Persisted storage protects IndexedDB blobs from being
 * evicted when the OS reclaims space — critical on iOS Safari, which
 * otherwise wipes uncached PWA storage after ~7 days of inactivity.
 *
 * Idempotent and best-effort: silently no-ops on browsers without the
 * Storage API, when permission is denied, or on subsequent calls.
 */

const REQUESTED_FLAG = "wise-storage-persist-requested";

export async function requestPersistentStorageOnce(): Promise<void> {
  if (typeof navigator === "undefined") return;
  if (!navigator.storage || typeof navigator.storage.persist !== "function") return;
  if (typeof localStorage !== "undefined" && localStorage.getItem(REQUESTED_FLAG) === "1") return;

  try {
    if (typeof navigator.storage.persisted === "function") {
      const already = await navigator.storage.persisted();
      if (already) {
        localStorage.setItem(REQUESTED_FLAG, "1");
        return;
      }
    }
    await navigator.storage.persist();
    localStorage.setItem(REQUESTED_FLAG, "1");
  } catch {
    // Best-effort — never block downloads on this.
  }
}
