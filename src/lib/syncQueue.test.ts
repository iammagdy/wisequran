import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// `vi.mock` is hoisted, so capture the shared mocks via `vi.hoisted`.
const { upsertMock, insertMock, fromMock, addToSyncQueueMock } = vi.hoisted(() => {
  const upsertMock = vi.fn();
  const insertMock = vi.fn();
  const fromMock = vi.fn(() => ({ upsert: upsertMock, insert: insertMock }));
  const addToSyncQueueMock = vi.fn(async () => undefined);
  return { upsertMock, insertMock, fromMock, addToSyncQueueMock };
});

vi.mock("./supabase", () => ({
  isSupabaseConfigured: true,
  supabase: { from: fromMock },
}));

vi.mock("./db", () => ({
  addToSyncQueue: addToSyncQueueMock,
  getAllSyncQueueEntries: vi.fn(async () => []),
  deleteSyncQueueEntry: vi.fn(async () => undefined),
  getSyncQueueCount: vi.fn(async () => 0),
}));

import { enqueuedSupabaseWrite } from "./syncQueue";

describe("enqueuedSupabaseWrite idempotency", () => {
  beforeEach(() => {
    upsertMock.mockReset();
    insertMock.mockReset();
    fromMock.mockClear();
    addToSyncQueueMock.mockClear();
    Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("passes onConflict to supabase.upsert so repeated writes do not duplicate", async () => {
    upsertMock.mockResolvedValue({ error: null });

    const payload = { device_id: "dev-1", date: "2026-04-16", count: 5 };
    await enqueuedSupabaseWrite("device_daily_reading", "upsert", payload, { onConflict: "device_id,date" });
    await enqueuedSupabaseWrite("device_daily_reading", "upsert", payload, { onConflict: "device_id,date" });

    expect(fromMock).toHaveBeenCalledTimes(2);
    expect(fromMock).toHaveBeenCalledWith("device_daily_reading");
    expect(upsertMock).toHaveBeenCalledTimes(2);
    expect(upsertMock).toHaveBeenNthCalledWith(1, payload, { onConflict: "device_id,date" });
    expect(upsertMock).toHaveBeenNthCalledWith(2, payload, { onConflict: "device_id,date" });
    expect(insertMock).not.toHaveBeenCalled();
    expect(addToSyncQueueMock).not.toHaveBeenCalled();
  });

  it("queues the same upsert with onConflict when offline, preserving idempotency on flush", async () => {
    Object.defineProperty(navigator, "onLine", { configurable: true, value: false });
    upsertMock.mockRejectedValue(new TypeError("Failed to fetch"));

    const payload = { id: "abc", surah_number: 2, score: 90 };
    await enqueuedSupabaseWrite("recitation_history", "upsert", payload, { onConflict: "id" });

    expect(addToSyncQueueMock).toHaveBeenCalledTimes(1);
    const entry = addToSyncQueueMock.mock.calls[0][0] as {
      table: string;
      operation: string;
      payload: unknown;
      onConflict?: string;
    };
    expect(entry.table).toBe("recitation_history");
    expect(entry.operation).toBe("upsert");
    expect(entry.onConflict).toBe("id");
    expect(entry.payload).toEqual(payload);
  });

  it("produces no duplicate row when the network drops after a successful write and the retry replays the same payload", async () => {
    // First call succeeds server-side. Simulate the client missing
    // the success response (classic 'network dropped after 200'): the
    // queue replays the same payload. Because `enqueuedSupabaseWrite`
    // routes through Supabase's `upsert` with `onConflict`, the
    // replay must hit the same unique constraint and no-op instead
    // of inserting a second row. We verify by counting how many
    // rows Supabase would persist given our upsertMock: each call is
    // deduplicated by the `onConflict` key we passed.
    const stored = new Map<string, Record<string, unknown>>();
    upsertMock.mockImplementation(async (payload: Record<string, unknown>, opts: { onConflict?: string }) => {
      const key = opts.onConflict
        ? opts.onConflict.split(",").map((k) => String(payload[k])).join("|")
        : JSON.stringify(payload);
      stored.set(key, payload);
      return { error: null };
    });

    const payload = { device_id: "dev-9", date: "2026-04-16", count: 3 };
    await enqueuedSupabaseWrite("device_daily_reading", "upsert", payload, { onConflict: "device_id,date" });
    // Simulated retry after perceived network drop — identical payload.
    await enqueuedSupabaseWrite("device_daily_reading", "upsert", payload, { onConflict: "device_id,date" });

    expect(upsertMock).toHaveBeenCalledTimes(2);
    // Despite two calls, only one logical row is persisted because
    // `onConflict` collapses the duplicate.
    expect(stored.size).toBe(1);
  });

  it("does not queue on permanent errors (non-retriable)", async () => {
    upsertMock.mockResolvedValue({ error: { message: "duplicate key", status: 409 } });
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await enqueuedSupabaseWrite("foo", "upsert", { id: 1 }, { onConflict: "id" });

    expect(addToSyncQueueMock).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
