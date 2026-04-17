import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 5000,
    allowedHosts: true,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      injectRegister: "auto",
      // Note: assets listed here are *referenced* by the SW so they can be
      // fetched on demand, but they are NOT all forcibly precached. The
      // workbox.globPatterns below decides what's actually precached on
      // install. We deliberately keep audio out of precache (it's huge
      // and is persisted into IDB by `src/lib/quran-audio.ts`).
      includeAssets: ["favicon.ico", "favicon.png", "favicon-16x16.png", "icons/*.png", "placeholder.svg"],
      workbox: {
        // Trim precache: drop `mp3` (audio is on the IDB path) and `jpg`
        // (install-guide screenshots are large and on-demand). Audio
        // adhan files still resolve at runtime via the CacheFirst
        // strategy below the first time the user plays one.
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        globIgnores: ["**/audio/**", "**/screenshots/**"],
        // Hard cap on any single precached file so we can't accidentally
        // pull a giant asset back into the precache through a loose
        // globPattern in the future.
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        navigateFallbackDenylist: [/^\/~oauth/, /^\/auth/, /^\/api\//],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        // Pulls our SW-side adhan scheduler into the generated SW so
        // it can fire prayer notifications even when the page is
        // backgrounded. See `public/sw-adhan.js` for the protocol.
        importScripts: ["/sw-adhan.js"],
        runtimeCaching: [
          {
            urlPattern: /\/data\/tafsir\/.*\.json$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "offline-tafsir-cache",
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\/data\/wbw\/.*\.json$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "offline-wbw-cache",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https?:\/\/.*\/audio\/adhan\/.*\.mp3$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "local-adhan-audio-cache",
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/api\.alquran\.cloud\/v1\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "quran-api-cache",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/api\.quran\.com\/api\/v4\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "quran-foundation-api-cache",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/download\.quranicaudio\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "quranic-audio-cache",
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.mp3quran\.net\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "mp3quran-audio-cache",
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/cdn\.islamic\.network\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "adhan-audio-cache",
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/assets\.mixkit\.co\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "chime-audio-cache",
              expiration: { maxEntries: 5, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Google Fonts runtime caches removed: fonts are now self-hosted
          // via @fontsource and bundled into the app's own static assets,
          // so no third-party request is made.
        ],
      },
      manifest: false,
      devOptions: {
        enabled: false,
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
  build: {
    // Don't ship JS source maps to end users. In production builds we
    // still generate "hidden" maps so uploaded Sentry/Supabase logs
    // can be symbolicated out-of-band, but browsers will never fetch
    // them. Dev builds (`pnpm run dev`) keep default inline maps.
    sourcemap: mode === "production" ? "hidden" : true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (id.includes("framer-motion")) {
            return "motion-vendor";
          }

          if (id.includes("@radix-ui") || id.includes("cmdk") || id.includes("vaul")) {
            return "ui-vendor";
          }

          if (id.includes("@supabase") || id.includes("@tanstack") || id.includes("idb")) {
            return "data-vendor";
          }

          if (id.includes("recharts") || id.includes("d3-")) {
            return "charts-vendor";
          }

          return "vendor";
        },
      },
    },
  },
}));
