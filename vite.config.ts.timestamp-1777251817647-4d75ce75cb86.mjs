// vite.config.ts
import { defineConfig } from "file:///home/runner/workspace/node_modules/vite/dist/node/index.js";
import react from "file:///home/runner/workspace/node_modules/@vitejs/plugin-react-swc/index.js";
import path2 from "path";
import { VitePWA } from "file:///home/runner/workspace/node_modules/vite-plugin-pwa/dist/index.js";

// scripts/vite-image-variants-plugin.mjs
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "file:///home/runner/workspace/node_modules/sharp/lib/index.js";
var __vite_injected_original_import_meta_url = "file:///home/runner/workspace/scripts/vite-image-variants-plugin.mjs";
var SOURCE_EXTS = /* @__PURE__ */ new Set([".jpg", ".jpeg", ".png"]);
var SKIP_DIRS = /* @__PURE__ */ new Set(["audio", "data"]);
var ICON_VARIANTS_PREFIX = "shortcut-";
async function* walk(dir, { rootBasename } = {}) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      yield* walk(full, { rootBasename: rootBasename ?? entry.name });
    } else {
      if (rootBasename === "icons" && !entry.name.startsWith(ICON_VARIANTS_PREFIX)) {
        continue;
      }
      yield full;
    }
  }
}
async function isUpToDate(src, out) {
  try {
    const [s, o] = await Promise.all([stat(src), stat(out)]);
    return o.mtimeMs >= s.mtimeMs;
  } catch {
    return false;
  }
}
async function emitVariants(src) {
  const ext = path.extname(src).toLowerCase();
  if (!SOURCE_EXTS.has(ext)) return null;
  const base = src.slice(0, -ext.length);
  const webp = `${base}.webp`;
  const avif = `${base}.avif`;
  const tasks = [];
  if (!await isUpToDate(src, webp)) {
    tasks.push(
      sharp(src).webp({ quality: 82, effort: 5 }).toFile(webp).then(() => webp)
    );
  }
  if (!await isUpToDate(src, avif)) {
    tasks.push(
      sharp(src).avif({ quality: 55, effort: 5 }).toFile(avif).then(() => avif)
    );
  }
  if (tasks.length === 0) return null;
  const written = await Promise.all(tasks);
  return { src, written };
}
async function emitAllUnder(dir) {
  const reports = [];
  for await (const file of walk(dir)) {
    const r = await emitVariants(file);
    if (r) reports.push(r);
  }
  return reports;
}
function imageVariants(opts = {}) {
  let dir = opts.dir;
  let logger = console;
  return {
    name: "wise-image-variants",
    apply: "build",
    configResolved(cfg) {
      if (!dir) {
        dir = path.join(cfg.root, "public");
      }
      if (cfg.logger) logger = cfg.logger;
    },
    async buildStart() {
      const t0 = Date.now();
      const reports = await emitAllUnder(dir);
      if (reports.length === 0) {
        logger.info?.("[image-variants] up-to-date") ?? logger.log?.("[image-variants] up-to-date");
        return;
      }
      const ms = Date.now() - t0;
      const lines = reports.flatMap((r) => r.written.map((w) => `  + ${path.basename(w)}`));
      const msg = `[image-variants] emitted ${reports.length} source(s) in ${ms} ms
${lines.join("\n")}`;
      logger.info?.(msg) ?? logger.log?.(msg);
    }
  };
}
var __filename = fileURLToPath(__vite_injected_original_import_meta_url);
if (process.argv[1] === __filename) {
  const root = path.resolve(path.dirname(__filename), "..");
  const reports = await emitAllUnder(path.join(root, "public"));
  if (reports.length === 0) {
    console.log("[image-variants] up-to-date.");
  } else {
    for (const r of reports) {
      console.log(`[image-variants] ${path.relative(root, r.src)}`);
      r.written.forEach((p) => console.log(`    \u2192 ${path.relative(root, p)}`));
    }
  }
}

// vite.config.ts
var __vite_injected_original_dirname = "/home/runner/workspace";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 5e3,
    allowedHosts: true,
    hmr: {
      overlay: false
    }
  },
  plugins: [
    // Phase D: emit AVIF/WebP siblings for static raster assets in
    // `public/` at build start so the install modal (and any future
    // <picture> consumer) can serve modern formats with PNG/JPG
    // fallbacks. Re-runs are no-ops once outputs are up-to-date.
    imageVariants(),
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
          "**/assets/charts-vendor-*.js"
        ],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024
      },
      manifest: false,
      devOptions: {
        enabled: false
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path2.resolve(__vite_injected_original_dirname, "./src")
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime"]
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
        }
      }
    }
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAic2NyaXB0cy92aXRlLWltYWdlLXZhcmlhbnRzLXBsdWdpbi5tanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9ydW5uZXIvd29ya3NwYWNlXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9ydW5uZXIvd29ya3NwYWNlL3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3J1bm5lci93b3Jrc3BhY2Uvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBWaXRlUFdBIH0gZnJvbSBcInZpdGUtcGx1Z2luLXB3YVwiO1xuaW1wb3J0IGltYWdlVmFyaWFudHMgZnJvbSBcIi4vc2NyaXB0cy92aXRlLWltYWdlLXZhcmlhbnRzLXBsdWdpbi5tanNcIjtcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+ICh7XG4gIHNlcnZlcjoge1xuICAgIGhvc3Q6IFwiMC4wLjAuMFwiLFxuICAgIHBvcnQ6IDUwMDAsXG4gICAgYWxsb3dlZEhvc3RzOiB0cnVlLFxuICAgIGhtcjoge1xuICAgICAgb3ZlcmxheTogZmFsc2UsXG4gICAgfSxcbiAgfSxcbiAgcGx1Z2luczogW1xuICAgIC8vIFBoYXNlIEQ6IGVtaXQgQVZJRi9XZWJQIHNpYmxpbmdzIGZvciBzdGF0aWMgcmFzdGVyIGFzc2V0cyBpblxuICAgIC8vIGBwdWJsaWMvYCBhdCBidWlsZCBzdGFydCBzbyB0aGUgaW5zdGFsbCBtb2RhbCAoYW5kIGFueSBmdXR1cmVcbiAgICAvLyA8cGljdHVyZT4gY29uc3VtZXIpIGNhbiBzZXJ2ZSBtb2Rlcm4gZm9ybWF0cyB3aXRoIFBORy9KUEdcbiAgICAvLyBmYWxsYmFja3MuIFJlLXJ1bnMgYXJlIG5vLW9wcyBvbmNlIG91dHB1dHMgYXJlIHVwLXRvLWRhdGUuXG4gICAgaW1hZ2VWYXJpYW50cygpLFxuICAgIHJlYWN0KCksXG4gICAgVml0ZVBXQSh7XG4gICAgICAvLyBQaGFzZSBDOiBzd2l0Y2hlZCBmcm9tIGdlbmVyYXRlU1cgdG8gaW5qZWN0TWFuaWZlc3Qgc28gdGhlXG4gICAgICAvLyBhZGhhbiArIEZyaWRheSByZW1pbmRlciBzY2hlZHVsZXIsIEJhY2tncm91bmQgU3luYywgYW5kXG4gICAgICAvLyBQZXJpb2RpYyBCYWNrZ3JvdW5kIFN5bmMgaG9va3MgbGl2ZSBpbiBhIGZpcnN0LWNsYXNzIFRTXG4gICAgICAvLyBzb3VyY2UgZmlsZSAoYHNyYy9zdy50c2ApIGluc3RlYWQgb2YgYmVpbmcgZ3JhZnRlZCBvbnRvIHRoZVxuICAgICAgLy8gZ2VuZXJhdGVkIFNXIHZpYSBgaW1wb3J0U2NyaXB0c2AuXG4gICAgICBzdHJhdGVnaWVzOiBcImluamVjdE1hbmlmZXN0XCIsXG4gICAgICBzcmNEaXI6IFwic3JjXCIsXG4gICAgICBmaWxlbmFtZTogXCJzdy50c1wiLFxuICAgICAgcmVnaXN0ZXJUeXBlOiBcInByb21wdFwiLFxuICAgICAgaW5qZWN0UmVnaXN0ZXI6IFwiYXV0b1wiLFxuICAgICAgaW5jbHVkZUFzc2V0czogW1wiZmF2aWNvbi5pY29cIiwgXCJmYXZpY29uLnBuZ1wiLCBcImZhdmljb24tMTZ4MTYucG5nXCIsIFwiaWNvbnMvKi5wbmdcIiwgXCJwbGFjZWhvbGRlci5zdmdcIl0sXG4gICAgICBpbmplY3RNYW5pZmVzdDoge1xuICAgICAgICAvLyBTYW1lIHByZWNhY2hlIGJ1ZGdldCBhcyBiZWZvcmU6IGFwcCBzaGVsbCArIGVudHJ5L3ZlbmRvclxuICAgICAgICAvLyBjaHVua3MuIEF1ZGlvIHN0YXlzIG91dCBvZiBwcmVjYWNoZSAoaXQncyBwZXJzaXN0ZWQgaW50b1xuICAgICAgICAvLyBJREIgYnkgYHNyYy9saWIvcXVyYW4tYXVkaW8udHNgKTsgaW5zdGFsbC1ndWlkZSBzY3JlZW5zaG90c1xuICAgICAgICAvLyBhbmQgbGF6eSByb3V0ZSBjaHVua3MgYXJlIGZldGNoZWQgb24gZGVtYW5kLlxuICAgICAgICBnbG9iUGF0dGVybnM6IFtcIioqLyoue2pzLGNzcyxodG1sLGljbyxwbmcsc3ZnLHdvZmYyfVwiXSxcbiAgICAgICAgZ2xvYklnbm9yZXM6IFtcbiAgICAgICAgICBcIioqL2F1ZGlvLyoqXCIsXG4gICAgICAgICAgXCIqKi9zY3JlZW5zaG90cy8qKlwiLFxuICAgICAgICAgIFwiKiovYXNzZXRzLypQYWdlLSouanNcIixcbiAgICAgICAgICBcIioqL2Fzc2V0cy9jaGFydHMtdmVuZG9yLSouanNcIixcbiAgICAgICAgXSxcbiAgICAgICAgbWF4aW11bUZpbGVTaXplVG9DYWNoZUluQnl0ZXM6IDMgKiAxMDI0ICogMTAyNCxcbiAgICAgIH0sXG4gICAgICBtYW5pZmVzdDogZmFsc2UsXG4gICAgICBkZXZPcHRpb25zOiB7XG4gICAgICAgIGVuYWJsZWQ6IGZhbHNlLFxuICAgICAgfSxcbiAgICB9KSxcbiAgXS5maWx0ZXIoQm9vbGVhbiksXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXG4gICAgfSxcbiAgICBkZWR1cGU6IFtcInJlYWN0XCIsIFwicmVhY3QtZG9tXCIsIFwicmVhY3QvanN4LXJ1bnRpbWVcIl0sXG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgLy8gRG9uJ3Qgc2hpcCBKUyBzb3VyY2UgbWFwcyB0byBlbmQgdXNlcnMuIEluIHByb2R1Y3Rpb24gYnVpbGRzIHdlXG4gICAgLy8gc3RpbGwgZ2VuZXJhdGUgXCJoaWRkZW5cIiBtYXBzIHNvIHVwbG9hZGVkIFNlbnRyeS9TdXBhYmFzZSBsb2dzXG4gICAgLy8gY2FuIGJlIHN5bWJvbGljYXRlZCBvdXQtb2YtYmFuZCwgYnV0IGJyb3dzZXJzIHdpbGwgbmV2ZXIgZmV0Y2hcbiAgICAvLyB0aGVtLiBEZXYgYnVpbGRzIChgcG5wbSBydW4gZGV2YCkga2VlcCBkZWZhdWx0IGlubGluZSBtYXBzLlxuICAgIHNvdXJjZW1hcDogbW9kZSA9PT0gXCJwcm9kdWN0aW9uXCIgPyBcImhpZGRlblwiIDogdHJ1ZSxcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgbWFudWFsQ2h1bmtzKGlkKSB7XG4gICAgICAgICAgaWYgKCFpZC5pbmNsdWRlcyhcIm5vZGVfbW9kdWxlc1wiKSkgcmV0dXJuO1xuXG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKFwiZnJhbWVyLW1vdGlvblwiKSkge1xuICAgICAgICAgICAgcmV0dXJuIFwibW90aW9uLXZlbmRvclwiO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcyhcIkByYWRpeC11aVwiKSB8fCBpZC5pbmNsdWRlcyhcImNtZGtcIikgfHwgaWQuaW5jbHVkZXMoXCJ2YXVsXCIpKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJ1aS12ZW5kb3JcIjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoXCJAc3VwYWJhc2VcIikgfHwgaWQuaW5jbHVkZXMoXCJAdGFuc3RhY2tcIikgfHwgaWQuaW5jbHVkZXMoXCJpZGJcIikpIHtcbiAgICAgICAgICAgIHJldHVybiBcImRhdGEtdmVuZG9yXCI7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKFwicmVjaGFydHNcIikgfHwgaWQuaW5jbHVkZXMoXCJkMy1cIikpIHtcbiAgICAgICAgICAgIHJldHVybiBcImNoYXJ0cy12ZW5kb3JcIjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gXCJ2ZW5kb3JcIjtcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbn0pKTtcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL2hvbWUvcnVubmVyL3dvcmtzcGFjZS9zY3JpcHRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9ydW5uZXIvd29ya3NwYWNlL3NjcmlwdHMvdml0ZS1pbWFnZS12YXJpYW50cy1wbHVnaW4ubWpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3J1bm5lci93b3Jrc3BhY2Uvc2NyaXB0cy92aXRlLWltYWdlLXZhcmlhbnRzLXBsdWdpbi5tanNcIjsvKipcbiAqIFBoYXNlIEQgXHUyMDE0IFZpdGUgcGx1Z2luIHRoYXQgZW1pdHMgV2ViUCArIEFWSUYgc2libGluZ3MgZm9yIHN0YXRpY1xuICogcmFzdGVyIGFzc2V0cyBpbiBgcHVibGljL2AgYXQgYnVpbGQgc3RhcnQuXG4gKlxuICogV3JhcHMgdGhlIHNhbWUgc2hhcnAtYmFja2VkIGVuY29kZSBwaXBlbGluZSB0aGF0XG4gKiBgc2NyaXB0cy9nZW5lcmF0ZS1pbWFnZS12YXJpYW50cy5tanNgIHVzZXMuIEJvdGggZW50cnkgcG9pbnRzXG4gKiBzaGFyZSB0aGUgc2FtZSBgZW1pdGAgaGVscGVyIHNvIGEgbWFudWFsIHJ1biBhbmQgYSBgcG5wbSBidWlsZGBcbiAqIHByb2R1Y2UgYnl0ZS1pZGVudGljYWwgb3V0cHV0cy5cbiAqXG4gKiBUaGUgcGx1Z2luIGlzIGEgbm8tb3Agd2hlbiBzb3VyY2Ugc2libGluZ3MgYXJlIGFscmVhZHkgdXAtdG8tZGF0ZVxuICogKG10aW1lIGNoZWNrKSwgc28gcmUtcnVubmluZyBgdml0ZSBidWlsZGAgZG9lc24ndCByZS1lbmNvZGUuXG4gKlxuICogU2tpcHBpbmcgdGhlIGljb24gZGlyZWN0b3J5IGlzIGNyaXRpY2FsOiBQV0EgbWFuaWZlc3QgcmVmZXJlbmNlc1xuICogZmF2aWNvbnMvaWNvbnMgYnkgZXhhY3QgUE5HIGZpbGVuYW1lIGFuZCBicm93c2VycyBkb24ndCBhY2NlcHRcbiAqIEFWSUYvV2ViUCB0aGVyZS5cbiAqL1xuaW1wb3J0IHsgcmVhZGRpciwgc3RhdCB9IGZyb20gXCJub2RlOmZzL3Byb21pc2VzXCI7XG5pbXBvcnQgcGF0aCBmcm9tIFwibm9kZTpwYXRoXCI7XG5pbXBvcnQgeyBmaWxlVVJMVG9QYXRoIH0gZnJvbSBcIm5vZGU6dXJsXCI7XG5pbXBvcnQgc2hhcnAgZnJvbSBcInNoYXJwXCI7XG5cbmNvbnN0IFNPVVJDRV9FWFRTID0gbmV3IFNldChbXCIuanBnXCIsIFwiLmpwZWdcIiwgXCIucG5nXCJdKTtcbmNvbnN0IFNLSVBfRElSUyA9IG5ldyBTZXQoW1wiYXVkaW9cIiwgXCJkYXRhXCJdKTtcbi8vIEluc2lkZSBgcHVibGljL2ljb25zL2Agb25seSBQV0Egc2hvcnRjdXQgaWNvbnMgZ2V0IG1vZGVybiB2YXJpYW50cy5cbi8vIEZhdmljb25zIC8gYXBwIGljb25zIGFyZSByZWZlcmVuY2VkIGJ5IGV4YWN0IFBORyBmaWxlbmFtZSBpblxuLy8gYDxsaW5rIHJlbD1cImljb25cIj5gIGFuZCB0aGUgbWFuaWZlc3QgYGljb25zW11gIGFycmF5LCB3aGVyZSBicm93c2Vyc1xuLy8gZG9uJ3QgYWNjZXB0IEFWSUYvV2ViUCwgc28gdGhleSBtdXN0IHJlbWFpbiBQTkctb25seS5cbmNvbnN0IElDT05fVkFSSUFOVFNfUFJFRklYID0gXCJzaG9ydGN1dC1cIjtcblxuYXN5bmMgZnVuY3Rpb24qIHdhbGsoZGlyLCB7IHJvb3RCYXNlbmFtZSB9ID0ge30pIHtcbiAgY29uc3QgZW50cmllcyA9IGF3YWl0IHJlYWRkaXIoZGlyLCB7IHdpdGhGaWxlVHlwZXM6IHRydWUgfSk7XG4gIGZvciAoY29uc3QgZW50cnkgb2YgZW50cmllcykge1xuICAgIGNvbnN0IGZ1bGwgPSBwYXRoLmpvaW4oZGlyLCBlbnRyeS5uYW1lKTtcbiAgICBpZiAoZW50cnkuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgaWYgKFNLSVBfRElSUy5oYXMoZW50cnkubmFtZSkpIGNvbnRpbnVlO1xuICAgICAgeWllbGQqIHdhbGsoZnVsbCwgeyByb290QmFzZW5hbWU6IHJvb3RCYXNlbmFtZSA/PyBlbnRyeS5uYW1lIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAocm9vdEJhc2VuYW1lID09PSBcImljb25zXCIgJiYgIWVudHJ5Lm5hbWUuc3RhcnRzV2l0aChJQ09OX1ZBUklBTlRTX1BSRUZJWCkpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICB5aWVsZCBmdWxsO1xuICAgIH1cbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBpc1VwVG9EYXRlKHNyYywgb3V0KSB7XG4gIHRyeSB7XG4gICAgY29uc3QgW3MsIG9dID0gYXdhaXQgUHJvbWlzZS5hbGwoW3N0YXQoc3JjKSwgc3RhdChvdXQpXSk7XG4gICAgcmV0dXJuIG8ubXRpbWVNcyA+PSBzLm10aW1lTXM7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZW1pdFZhcmlhbnRzKHNyYykge1xuICBjb25zdCBleHQgPSBwYXRoLmV4dG5hbWUoc3JjKS50b0xvd2VyQ2FzZSgpO1xuICBpZiAoIVNPVVJDRV9FWFRTLmhhcyhleHQpKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgYmFzZSA9IHNyYy5zbGljZSgwLCAtZXh0Lmxlbmd0aCk7XG4gIGNvbnN0IHdlYnAgPSBgJHtiYXNlfS53ZWJwYDtcbiAgY29uc3QgYXZpZiA9IGAke2Jhc2V9LmF2aWZgO1xuICBjb25zdCB0YXNrcyA9IFtdO1xuICBpZiAoIShhd2FpdCBpc1VwVG9EYXRlKHNyYywgd2VicCkpKSB7XG4gICAgdGFza3MucHVzaChcbiAgICAgIHNoYXJwKHNyYykud2VicCh7IHF1YWxpdHk6IDgyLCBlZmZvcnQ6IDUgfSkudG9GaWxlKHdlYnApLnRoZW4oKCkgPT4gd2VicCksXG4gICAgKTtcbiAgfVxuICBpZiAoIShhd2FpdCBpc1VwVG9EYXRlKHNyYywgYXZpZikpKSB7XG4gICAgdGFza3MucHVzaChcbiAgICAgIHNoYXJwKHNyYykuYXZpZih7IHF1YWxpdHk6IDU1LCBlZmZvcnQ6IDUgfSkudG9GaWxlKGF2aWYpLnRoZW4oKCkgPT4gYXZpZiksXG4gICAgKTtcbiAgfVxuICBpZiAodGFza3MubGVuZ3RoID09PSAwKSByZXR1cm4gbnVsbDtcbiAgY29uc3Qgd3JpdHRlbiA9IGF3YWl0IFByb21pc2UuYWxsKHRhc2tzKTtcbiAgcmV0dXJuIHsgc3JjLCB3cml0dGVuIH07XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBlbWl0QWxsVW5kZXIoZGlyKSB7XG4gIGNvbnN0IHJlcG9ydHMgPSBbXTtcbiAgZm9yIGF3YWl0IChjb25zdCBmaWxlIG9mIHdhbGsoZGlyKSkge1xuICAgIGNvbnN0IHIgPSBhd2FpdCBlbWl0VmFyaWFudHMoZmlsZSk7XG4gICAgaWYgKHIpIHJlcG9ydHMucHVzaChyKTtcbiAgfVxuICByZXR1cm4gcmVwb3J0cztcbn1cblxuLyoqXG4gKiBWaXRlIHBsdWdpbiBmYWN0b3J5LiBEZWZhdWx0cyB0byBgPHByb2plY3RSb290Pi9wdWJsaWNgLlxuICpcbiAqICAgaW1wb3J0IGltYWdlVmFyaWFudHMgZnJvbSBcIi4vc2NyaXB0cy92aXRlLWltYWdlLXZhcmlhbnRzLXBsdWdpbi5tanNcIjtcbiAqICAgcGx1Z2luczogW2ltYWdlVmFyaWFudHMoKV1cbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gaW1hZ2VWYXJpYW50cyhvcHRzID0ge30pIHtcbiAgbGV0IGRpciA9IG9wdHMuZGlyO1xuICBsZXQgbG9nZ2VyID0gY29uc29sZTtcbiAgcmV0dXJuIHtcbiAgICBuYW1lOiBcIndpc2UtaW1hZ2UtdmFyaWFudHNcIixcbiAgICBhcHBseTogXCJidWlsZFwiLFxuICAgIGNvbmZpZ1Jlc29sdmVkKGNmZykge1xuICAgICAgaWYgKCFkaXIpIHtcbiAgICAgICAgZGlyID0gcGF0aC5qb2luKGNmZy5yb290LCBcInB1YmxpY1wiKTtcbiAgICAgIH1cbiAgICAgIGlmIChjZmcubG9nZ2VyKSBsb2dnZXIgPSBjZmcubG9nZ2VyO1xuICAgIH0sXG4gICAgYXN5bmMgYnVpbGRTdGFydCgpIHtcbiAgICAgIGNvbnN0IHQwID0gRGF0ZS5ub3coKTtcbiAgICAgIGNvbnN0IHJlcG9ydHMgPSBhd2FpdCBlbWl0QWxsVW5kZXIoZGlyKTtcbiAgICAgIGlmIChyZXBvcnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBsb2dnZXIuaW5mbz8uKFwiW2ltYWdlLXZhcmlhbnRzXSB1cC10by1kYXRlXCIpID8/IGxvZ2dlci5sb2c/LihcIltpbWFnZS12YXJpYW50c10gdXAtdG8tZGF0ZVwiKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY29uc3QgbXMgPSBEYXRlLm5vdygpIC0gdDA7XG4gICAgICBjb25zdCBsaW5lcyA9IHJlcG9ydHMuZmxhdE1hcCgocikgPT4gci53cml0dGVuLm1hcCgodykgPT4gYCAgKyAke3BhdGguYmFzZW5hbWUodyl9YCkpO1xuICAgICAgY29uc3QgbXNnID0gYFtpbWFnZS12YXJpYW50c10gZW1pdHRlZCAke3JlcG9ydHMubGVuZ3RofSBzb3VyY2UocykgaW4gJHttc30gbXNcXG4ke2xpbmVzLmpvaW4oXCJcXG5cIil9YDtcbiAgICAgIGxvZ2dlci5pbmZvPy4obXNnKSA/PyBsb2dnZXIubG9nPy4obXNnKTtcbiAgICB9LFxuICB9O1xufVxuXG4vLyBBbGxvdyBgbm9kZSBzY3JpcHRzL3ZpdGUtaW1hZ2UtdmFyaWFudHMtcGx1Z2luLm1qc2AgdG8gcnVuIHRoZSBzYW1lXG4vLyBwaXBlbGluZSBtYW51YWxseSAodXNlZCBieSBgcG5wbSBnZW5lcmF0ZTppbWFnZS12YXJpYW50c2ApLlxuY29uc3QgX19maWxlbmFtZSA9IGZpbGVVUkxUb1BhdGgoaW1wb3J0Lm1ldGEudXJsKTtcbmlmIChwcm9jZXNzLmFyZ3ZbMV0gPT09IF9fZmlsZW5hbWUpIHtcbiAgY29uc3Qgcm9vdCA9IHBhdGgucmVzb2x2ZShwYXRoLmRpcm5hbWUoX19maWxlbmFtZSksIFwiLi5cIik7XG4gIGNvbnN0IHJlcG9ydHMgPSBhd2FpdCBlbWl0QWxsVW5kZXIocGF0aC5qb2luKHJvb3QsIFwicHVibGljXCIpKTtcbiAgaWYgKHJlcG9ydHMubGVuZ3RoID09PSAwKSB7XG4gICAgY29uc29sZS5sb2coXCJbaW1hZ2UtdmFyaWFudHNdIHVwLXRvLWRhdGUuXCIpO1xuICB9IGVsc2Uge1xuICAgIGZvciAoY29uc3QgciBvZiByZXBvcnRzKSB7XG4gICAgICBjb25zb2xlLmxvZyhgW2ltYWdlLXZhcmlhbnRzXSAke3BhdGgucmVsYXRpdmUocm9vdCwgci5zcmMpfWApO1xuICAgICAgci53cml0dGVuLmZvckVhY2goKHApID0+IGNvbnNvbGUubG9nKGAgICAgXHUyMTkyICR7cGF0aC5yZWxhdGl2ZShyb290LCBwKX1gKSk7XG4gICAgfVxuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQW9QLFNBQVMsb0JBQW9CO0FBQ2pSLE9BQU8sV0FBVztBQUNsQixPQUFPQSxXQUFVO0FBQ2pCLFNBQVMsZUFBZTs7O0FDYXhCLFNBQVMsU0FBUyxZQUFZO0FBQzlCLE9BQU8sVUFBVTtBQUNqQixTQUFTLHFCQUFxQjtBQUM5QixPQUFPLFdBQVc7QUFuQmtLLElBQU0sMkNBQTJDO0FBcUJyTyxJQUFNLGNBQWMsb0JBQUksSUFBSSxDQUFDLFFBQVEsU0FBUyxNQUFNLENBQUM7QUFDckQsSUFBTSxZQUFZLG9CQUFJLElBQUksQ0FBQyxTQUFTLE1BQU0sQ0FBQztBQUszQyxJQUFNLHVCQUF1QjtBQUU3QixnQkFBZ0IsS0FBSyxLQUFLLEVBQUUsYUFBYSxJQUFJLENBQUMsR0FBRztBQUMvQyxRQUFNLFVBQVUsTUFBTSxRQUFRLEtBQUssRUFBRSxlQUFlLEtBQUssQ0FBQztBQUMxRCxhQUFXLFNBQVMsU0FBUztBQUMzQixVQUFNLE9BQU8sS0FBSyxLQUFLLEtB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
