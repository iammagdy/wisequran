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
      includeAssets: ["favicon.ico", "favicon.png", "favicon-16x16.png", "icons/*.png", "placeholder.svg", "audio/adhan/*.mp3", "*.jpg"],
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,jpg,svg,woff2,mp3}"],
        navigateFallbackDenylist: [/^\/~oauth/, /^\/auth/, /^\/api\//],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        runtimeCaching: [
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
            handler: "CacheFirst",
            options: {
              cacheName: "quran-api-cache",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/api\.quran\.com\/api\/v4\/.*/i,
            handler: "CacheFirst",
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
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-webfonts",
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
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
