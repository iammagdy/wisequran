/// <reference lib="webworker" />
//
// Wise Quran service worker (injectManifest source).
//
// Replaces the previous `generateSW` config in vite.config.ts. Keeps the
// same runtime caching behavior, the same adhan/Friday-reminder protocol
// that used to live in `public/sw-adhan.js`, and adds Background Sync
// and Periodic Background Sync hooks for Phase C offline robustness.
//
// Client ↔ SW message protocol (unchanged from the v1 sw-adhan.js):
//   { type: "WISE_ADHAN_SCHEDULE", prayerId, prayerLabel, fireAt }
//   { type: "WISE_ADHAN_CANCEL" }
//   { type: "SCHEDULE_FRIDAY_REMINDER", fireAt, key, title, body }
//   { type: "CANCEL_FRIDAY_REMINDER" }
//
// New SW → client broadcasts (Phase C):
//   { type: "WISE_FLUSH_QUEUE" }                   // background-sync wakeup
//   { type: "WISE_REARM_REMINDERS" }               // periodic-sync wakeup

import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute, NavigationRoute, setCatchHandler } from "workbox-routing";
import { CacheFirst, StaleWhileRevalidate } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { clientsClaim } from "workbox-core";
import { createHandlerBoundToURL } from "workbox-precaching";

// `self` is the SW global. We narrow it for the bits we touch.
declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
  _fridayTimerId?: ReturnType<typeof setTimeout> | null;
};

// ─── Standard activation lifecycle ───────────────────────────────────────────
self.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();

// `__WB_MANIFEST` is rewritten by vite-plugin-pwa at build time with the
// list of static assets matching `injectManifest.globPatterns`.
precacheAndRoute(self.__WB_MANIFEST);

// SPA navigations fall back to the precached app shell so the route
// works offline. `navigateFallbackDenylist` mirrors the previous config.
registerRoute(
  new NavigationRoute(createHandlerBoundToURL("/index.html"), {
    denylist: [/^\/~oauth/, /^\/auth/, /^\/api\//],
  }),
);

// ─── Runtime caches ──────────────────────────────────────────────────────────
// Each entry intentionally mirrors the previous generateSW config so the
// migration is behavior-preserving.

registerRoute(
  /\/data\/tafsir\/.*\.json$/i,
  new CacheFirst({
    cacheName: "offline-tafsir-cache",
    plugins: [
      new ExpirationPlugin({ maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 365 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
);

registerRoute(
  /\/data\/wbw\/.*\.json$/i,
  new CacheFirst({
    cacheName: "offline-wbw-cache",
    plugins: [
      new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 365 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
);

registerRoute(
  /^https?:\/\/.*\/audio\/adhan\/.*\.mp3$/i,
  new CacheFirst({
    cacheName: "local-adhan-audio-cache",
    plugins: [
      new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
);

registerRoute(
  /^https:\/\/api\.alquran\.cloud\/v1\/.*/i,
  new StaleWhileRevalidate({
    cacheName: "quran-api-cache",
    plugins: [
      new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
);

registerRoute(
  /^https:\/\/api\.quran\.com\/api\/v4\/.*/i,
  new StaleWhileRevalidate({
    cacheName: "quran-foundation-api-cache",
    plugins: [
      new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
);

registerRoute(
  /^https:\/\/download\.quranicaudio\.com\/.*/i,
  new CacheFirst({
    cacheName: "quranic-audio-cache",
    plugins: [
      new ExpirationPlugin({ maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 365 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
);

registerRoute(
  /^https:\/\/.*\.mp3quran\.net\/.*/i,
  new CacheFirst({
    cacheName: "mp3quran-audio-cache",
    plugins: [
      new ExpirationPlugin({ maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 365 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
);

registerRoute(
  /^https:\/\/cdn\.islamic\.network\/.*/i,
  new CacheFirst({
    cacheName: "adhan-audio-cache",
    plugins: [
      new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
);

registerRoute(
  /^https:\/\/assets\.mixkit\.co\/.*/i,
  new CacheFirst({
    cacheName: "chime-audio-cache",
    plugins: [
      new ExpirationPlugin({ maxEntries: 5, maxAgeSeconds: 60 * 60 * 24 * 365 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
);

setCatchHandler(async () => Response.error());

// ─── Adhan + Friday reminder scheduler ───────────────────────────────────────
// Ported verbatim (typed) from the previous public/sw-adhan.js. The
// protocol is unchanged so existing in-page schedulers (`useAdhan.ts`,
// `useFridayReminders.ts`) keep working without modification.

const ADHAN_STATE_CACHE = "wise-adhan-schedule-v1";
const ADHAN_STATE_REQUEST = new Request("/__wise_adhan_state__");
const MAX_SCHEDULE_MS = 12 * 60 * 60 * 1000;
let adhanTimerId: ReturnType<typeof setTimeout> | null = null;

interface AdhanState {
  prayerId: string;
  prayerLabel: string;
  fireAt: number;
}

async function persistAdhanState(state: AdhanState | null): Promise<void> {
  try {
    const cache = await caches.open(ADHAN_STATE_CACHE);
    if (!state) {
      await cache.delete(ADHAN_STATE_REQUEST);
      return;
    }
    await cache.put(
      ADHAN_STATE_REQUEST,
      new Response(JSON.stringify(state), {
        headers: { "Content-Type": "application/json" },
      }),
    );
  } catch {
    /* ignore */
  }
}

async function readAdhanState(): Promise<AdhanState | null> {
  try {
    const cache = await caches.open(ADHAN_STATE_CACHE);
    const res = await cache.match(ADHAN_STATE_REQUEST);
    if (!res) return null;
    return (await res.json()) as AdhanState;
  } catch {
    return null;
  }
}

function cancelAdhanTimer(): void {
  if (adhanTimerId !== null) {
    clearTimeout(adhanTimerId);
    adhanTimerId = null;
  }
}

async function fireAdhanNotification(state: AdhanState): Promise<void> {
  try {
    const d = new Date(state.fireAt);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    await self.registration.showNotification(
      `حان وقت صلاة ${state.prayerLabel || ""} 🕌`.trim(),
      {
        body: "الأذان يعمل الآن",
        dir: "rtl",
        lang: "ar",
        tag: `wise-adhan-${key}-${state.prayerId}`,
        renotify: false,
        silent: false,
        data: { prayerId: state.prayerId, firedAt: Date.now() },
      },
    );
  } catch {
    /* ignore */
  }
  await persistAdhanState(null);
  try {
    const clients = await self.clients.matchAll({ includeUncontrolled: true });
    for (const c of clients) {
      c.postMessage({ type: "WISE_ADHAN_FIRED", prayerId: state.prayerId });
    }
  } catch {
    /* ignore */
  }
}

function scheduleAdhanFromState(state: AdhanState | null): void {
  cancelAdhanTimer();
  if (!state || typeof state.fireAt !== "number") return;
  const remaining = state.fireAt - Date.now();
  if (remaining <= 0) {
    void fireAdhanNotification(state);
    return;
  }
  if (remaining > MAX_SCHEDULE_MS) {
    adhanTimerId = setTimeout(() => scheduleAdhanFromState(state), MAX_SCHEDULE_MS);
    return;
  }
  adhanTimerId = setTimeout(() => {
    void fireAdhanNotification(state);
  }, remaining);
}

// ─── Periodic Background Sync — re-arm reminders ─────────────────────────────
//
// On browsers that grant the `periodicsync` capability (currently Chrome
// when the PWA is installed and the site permission is granted), this
// fires roughly daily. We use it to:
//   - Re-rehydrate the persisted adhan state so a multi-day-closed-tab
//     window doesn't lose the next prayer notification.
//   - Broadcast a wake-up to any open clients so they can recompute the
//     next Friday reminder and re-arm the SW timer with a fresh `fireAt`.
//
// On unsupported browsers this listener simply never runs; the existing
// in-tab `setInterval` paths in `useAdhan` and `useFridayReminders`
// continue to handle scheduling whenever the app is open.
async function rearmReminders(): Promise<void> {
  // Re-rehydrate persisted adhan timer if the SW has been restarted.
  try {
    const state = await readAdhanState();
    if (state) scheduleAdhanFromState(state);
  } catch {
    /* ignore */
  }
  // Ask any open clients to recompute reminders against the current
  // wall clock and re-post SCHEDULE_* messages with fresh `fireAt`.
  try {
    const clients = await self.clients.matchAll({ includeUncontrolled: true });
    for (const c of clients) c.postMessage({ type: "WISE_REARM_REMINDERS" });
  } catch {
    /* ignore */
  }
}

self.addEventListener("periodicsync", (event) => {
  const e = event as ExtendableEvent & { tag: string };
  if (e.tag === "wise-reminders") {
    e.waitUntil(rearmReminders());
  }
});

// ─── Background Sync — drain offline write queue ─────────────────────────────
//
// Page registers `wise-sync-queue` whenever a write fell back to IDB
// (see `enqueuedSupabaseWrite` in `src/lib/syncQueue.ts`). The browser
// fires `sync` once connectivity returns — even if the tab was closed
// at the time.
//
// The Supabase JS SDK can't run in the SW (no auth session is mounted
// here), so the actual flush happens in the page via `flushSyncQueue()`.
// Closed-tab strategy:
//   1. Try to find any open client (uncontrolled + window types).
//   2. If found → broadcast WISE_FLUSH_QUEUE and resolve. The page
//      drains the queue authoritatively and acks via Supabase.
//   3. If none found → throw, which keeps the sync registration alive.
//      The browser will re-fire the `sync` event the next time the
//      user opens the PWA (or, on Chromium installed PWAs that grant
//      `clientsClaim`-eligible wakeups, when network conditions change
//      again). This is conservative but never silently drops writes.
//
// Browsers without Background Sync support never reach this handler;
// `useSyncQueue.ts`'s online/visibility-event flush keeps doing the
// work the next time the user opens the app.
async function notifyClientsToFlush(): Promise<void> {
  const clients = await self.clients.matchAll({
    includeUncontrolled: true,
    type: "window",
  });
  if (clients.length === 0) {
    // Throwing makes the browser keep our sync registration so it can
    // be retried when a client is alive.
    throw new Error("wise-sync-queue: no open clients to drain queue");
  }
  for (const c of clients) c.postMessage({ type: "WISE_FLUSH_QUEUE" });
}

self.addEventListener("sync", (event) => {
  const e = event as ExtendableEvent & { tag: string };
  if (e.tag === "wise-sync-queue") {
    e.waitUntil(notifyClientsToFlush());
  }
});

// ─── Message handler (adhan + Friday — unchanged protocol) ───────────────────
self.addEventListener("message", (event) => {
  const data = event.data as Record<string, unknown> | null;
  if (!data || typeof data !== "object") return;

  if (data.type === "WISE_ADHAN_SCHEDULE") {
    const state: AdhanState = {
      prayerId: String(data.prayerId || ""),
      prayerLabel: String(data.prayerLabel || ""),
      fireAt: Number(data.fireAt),
    };
    if (!Number.isFinite(state.fireAt) || state.fireAt <= Date.now()) return;
    event.waitUntil(persistAdhanState(state).then(() => scheduleAdhanFromState(state)));
  } else if (data.type === "WISE_ADHAN_CANCEL") {
    cancelAdhanTimer();
    event.waitUntil(persistAdhanState(null));
  } else if (data.type === "SCHEDULE_FRIDAY_REMINDER") {
    const fireAt = Number(data.fireAt);
    if (!Number.isFinite(fireAt) || fireAt <= Date.now()) return;
    const title = String(data.title || "جمعة مباركة");
    const body = String(data.body || "");
    const tag = `wise-friday-reminder-${String(data.key || fireAt)}`;

    const scheduleFriday = (): void => {
      const remaining = fireAt - Date.now();
      if (remaining <= 0) {
        self._fridayTimerId = null;
        self.registration
          .showNotification(title, { body, dir: "rtl", lang: "ar", tag, renotify: false })
          .catch(() => {});
        return;
      }
      const delay = remaining > MAX_SCHEDULE_MS ? MAX_SCHEDULE_MS : remaining;
      self._fridayTimerId = setTimeout(scheduleFriday, delay);
    };
    if (self._fridayTimerId) clearTimeout(self._fridayTimerId);
    scheduleFriday();
  } else if (data.type === "CANCEL_FRIDAY_REMINDER") {
    if (self._fridayTimerId) {
      clearTimeout(self._fridayTimerId);
      self._fridayTimerId = null;
    }
  } else if (data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// ─── Activate: rehydrate any pending adhan ───────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(readAdhanState().then((s) => scheduleAdhanFromState(s)));
});

// ─── Notification click — focus or open the app ──────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const list = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const c of list) {
        if ("focus" in c) return (c as WindowClient).focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow("/");
    })(),
  );
});

export {};
