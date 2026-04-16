import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  upsertBookmark,
  listBookmarks,
  claimBookmarksForUser,
  releaseBookmarksForUser,
  setCurrentUserIdCache,
} from "./bookmarks";
import { clearAllBookmarks } from "./db";

// We set `isSupabaseConfigured: true` so that the bookmarks module treats
// the cached userId as authoritative (an unconfigured project always
// returns owner = device, defeating the test). The supabase client itself
// is a minimal stub — pull/upsert call paths are swallowed by try/catch
// inside the module or short-circuited via the syncQueue mock below.
vi.mock("@/lib/supabase", () => ({
  isSupabaseConfigured: true,
  supabase: {
    from: () => ({
      select: () => ({
        eq: async () => ({ data: [], error: null }),
      }),
    }),
  },
}));

vi.mock("@/lib/syncQueue", () => ({
  enqueuedSupabaseWrite: async () => {},
  flushSyncQueue: async () => {},
}));

vi.mock("@/hooks/useDeviceId", () => ({
  getDeviceId: () => "device-test-123",
}));

// These tests verify the **observable behavior** of `claimBookmarksForUser`:
// once a user claims on this device, any new bookmark attaches to that
// user's owner-key, and `listBookmarks` segregates by current owner.
// Releasing the claim returns the device to its anonymous identity.
describe("claimBookmarksForUser", () => {
  beforeEach(async () => {
    localStorage.clear();
    await clearAllBookmarks();
    // Reset module-local cache between tests so state doesn't leak.
    releaseBookmarksForUser();
  });

  it("anonymous bookmarks remain isolated from a signed-in user's list", async () => {
    // Create an anonymous bookmark under the device owner key.
    await upsertBookmark({ surah: 1, ayah: 3, bookmarked: true });
    const beforeClaim = await listBookmarks();
    expect(beforeClaim.some((b) => b.surah === 1 && b.ayah === 3)).toBe(true);

    // Claim for user A: the active owner flips to `u:user-a`.
    await claimBookmarksForUser("user-a");
    const afterClaim = await listBookmarks();

    // The anonymous bookmark should NOT appear under the user's list —
    // that's the whole point of owner segregation; merges go through
    // the explicit merge flow, not auto-claim.
    expect(afterClaim.some((b) => b.surah === 1 && b.ayah === 3)).toBe(false);
  });

  it("bookmarks added while signed in are scoped to that user and disappear on release", async () => {
    await claimBookmarksForUser("user-a");
    await upsertBookmark({ surah: 2, ayah: 255, bookmarked: true });

    const userAList = await listBookmarks();
    expect(userAList.some((b) => b.surah === 2 && b.ayah === 255)).toBe(true);

    // Sign out: the active owner becomes the anonymous device again.
    releaseBookmarksForUser();
    const anonList = await listBookmarks();
    expect(anonList.some((b) => b.surah === 2 && b.ayah === 255)).toBe(false);
  });

  it("is idempotent — claiming the same user twice doesn't double-write", async () => {
    await claimBookmarksForUser("user-a");
    await upsertBookmark({ surah: 36, ayah: 1, bookmarked: true });
    await claimBookmarksForUser("user-a");

    const list = await listBookmarks();
    const ayah36_1 = list.filter((b) => b.surah === 36 && b.ayah === 1);
    expect(ayah36_1).toHaveLength(1);
  });

  it("switching users isolates their lists", async () => {
    await claimBookmarksForUser("user-a");
    await upsertBookmark({ surah: 18, ayah: 10, bookmarked: true });

    await claimBookmarksForUser("user-b");
    const userBList = await listBookmarks();
    expect(userBList.some((b) => b.surah === 18 && b.ayah === 10)).toBe(false);

    setCurrentUserIdCache("user-a");
    const userAList = await listBookmarks();
    expect(userAList.some((b) => b.surah === 18 && b.ayah === 10)).toBe(true);
  });
});
