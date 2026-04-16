/* eslint-disable no-restricted-globals */
// Service-worker-scheduled adhan reminders. Imported by the generated
// PWA service worker via `workbox.importScripts`. Pairs with the
// in-page scheduler in `useAdhan.ts`: the page posts the next prayer
// time to us so we can fire a notification even if the tab is
// backgrounded (subject to platform-specific SW lifetimes).
//
// Protocol (client -> SW):
//   { type: "WISE_ADHAN_SCHEDULE", prayerId, prayerLabel, fireAt }
//   { type: "WISE_ADHAN_CANCEL" }
//
// `fireAt` is an absolute epoch ms. We also persist it in a Cache so
// the schedule survives SW termination long enough to be rehydrated on
// the next `activate`. We never schedule more than 12h ahead — longer
// setTimeouts are unreliable across SW restarts.

(() => {
  const STATE_CACHE = "wise-adhan-schedule-v1";
  const STATE_REQUEST = new Request("/__wise_adhan_state__");
  const MAX_SCHEDULE_MS = 12 * 60 * 60 * 1000;
  let timerId = null;

  async function persistState(state) {
    try {
      const cache = await caches.open(STATE_CACHE);
      if (!state) {
        await cache.delete(STATE_REQUEST);
        return;
      }
      await cache.put(
        STATE_REQUEST,
        new Response(JSON.stringify(state), {
          headers: { "Content-Type": "application/json" },
        }),
      );
    } catch {
      /* ignore */
    }
  }

  async function readState() {
    try {
      const cache = await caches.open(STATE_CACHE);
      const res = await cache.match(STATE_REQUEST);
      if (!res) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  function cancelTimer() {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
  }

  async function fireNotification(state) {
    try {
      await self.registration.showNotification(
        `حان وقت صلاة ${state.prayerLabel || ""} 🕌`.trim(),
        {
          body: "الأذان يعمل الآن",
          dir: "rtl",
          lang: "ar",
          // Matches the in-page notification tag format in
          // `useAdhan.ts` (`wise-adhan-<Y-M-D>-<prayerId>`) so the
          // browser collapses duplicates if both the foreground and
          // the SW try to notify for the same prayer.
          tag: (() => {
            const d = new Date(state.fireAt);
            const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
            return `wise-adhan-${key}-${state.prayerId}`;
          })(),
          renotify: false,
          silent: false,
          data: { prayerId: state.prayerId, firedAt: Date.now() },
        },
      );
    } catch {
      /* ignore — platform may disallow notifications */
    }
    await persistState(null);
    // Ask any open clients to re-run their in-page catch-up logic so
    // the foreground UI stays in sync with what we just fired.
    try {
      const clients = await self.clients.matchAll({ includeUncontrolled: true });
      for (const c of clients) c.postMessage({ type: "WISE_ADHAN_FIRED", prayerId: state.prayerId });
    } catch {
      /* ignore */
    }
  }

  function scheduleFromState(state) {
    cancelTimer();
    if (!state || typeof state.fireAt !== "number") return;
    const remaining = state.fireAt - Date.now();
    if (remaining <= 0) {
      // We're already past the intended fire time: fire immediately
      // (showNotification will still dedupe on tag).
      void fireNotification(state);
      return;
    }
    if (remaining > MAX_SCHEDULE_MS) {
      // Don't fire yet — re-arm in chunks until we're within the
      // 12 h safe window of `fireAt`. Prevents early notifications
      // when the prayer is more than 12 h out.
      timerId = setTimeout(() => scheduleFromState(state), MAX_SCHEDULE_MS);
      return;
    }
    timerId = setTimeout(() => {
      void fireNotification(state);
    }, remaining);
  }

  self.addEventListener("message", (event) => {
    const data = event.data;
    if (!data || typeof data !== "object") return;
    if (data.type === "WISE_ADHAN_SCHEDULE") {
      const state = {
        prayerId: String(data.prayerId || ""),
        prayerLabel: String(data.prayerLabel || ""),
        fireAt: Number(data.fireAt),
      };
      if (!Number.isFinite(state.fireAt) || state.fireAt <= Date.now()) return;
      event.waitUntil(persistState(state).then(() => scheduleFromState(state)));
    } else if (data.type === "WISE_ADHAN_CANCEL") {
      cancelTimer();
      event.waitUntil(persistState(null));
    } else if (data.type === "SCHEDULE_FRIDAY_REMINDER") {
      const fireAt = Number(data.fireAt);
      if (!Number.isFinite(fireAt) || fireAt <= Date.now()) return;
      const title = String(data.title || "جمعة مباركة");
      const body = String(data.body || "");
      const tag = `wise-friday-reminder-${String(data.key || fireAt)}`;

      // Mirror the chunked re-arming pattern used for adhan timers:
      // `setTimeout` in an SW becomes unreliable beyond ~12 h, and we
      // must never fire early. Re-arm in 12 h increments until we're
      // within the safe window, then fire at the exact `fireAt`.
      const scheduleFriday = () => {
        const remaining = fireAt - Date.now();
        if (remaining <= 0) {
          self.registration
            .showNotification(title, { body, dir: "rtl", lang: "ar", tag, renotify: false })
            .catch(() => {});
          return;
        }
        if (remaining > MAX_SCHEDULE_MS) {
          setTimeout(scheduleFriday, MAX_SCHEDULE_MS);
          return;
        }
        setTimeout(scheduleFriday, remaining);
      };
      scheduleFriday();
    }
  });

  self.addEventListener("activate", (event) => {
    // Rehydrate any scheduled adhan after an SW update/restart so we
    // don't silently drop the timer.
    event.waitUntil(readState().then((s) => scheduleFromState(s)));
  });

  self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    event.waitUntil(
      (async () => {
        const clientsList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
        for (const c of clientsList) {
          if ("focus" in c) return c.focus();
        }
        if (self.clients.openWindow) return self.clients.openWindow("/");
      })(),
    );
  });
})();
