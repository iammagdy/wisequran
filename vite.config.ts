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
      // Phase C: switched from generateSW to injectManifest so the
      // adhan + Friday reminder scheduler, Background Sync, and
      // Periodic Background Sync hooks live in a first-class TS
      // source file (`src/sw.ts`) instead of being grafted onto the
      // generated SW via `importScripts`.
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      registerType: "prompt",
      injectRegister: "auto",
      includeAssets: ["favicon.ico", "favicon.png", "favicon-16x16.png", "icons/*.png", "placeholder.svg"],
      injectManifest: {
        // Same precache budget as before: app shell + entry/vendor
        // chunks. Audio stays out of precache (it's persisted into
        // IDB by `src/lib/quran-audio.ts`); install-guide screenshots
        // and lazy route chunks are fetched on demand.
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        globIgnores: [
          "**/audio/**",
          "**/screenshots/**",
          "**/assets/*Page-*.js",
          "**/assets/charts-vendor-*.js",
        ],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
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
