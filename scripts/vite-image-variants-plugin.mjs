/**
 * Phase D — Vite plugin that emits WebP + AVIF siblings for static
 * raster assets in `public/` at build start.
 *
 * Wraps the same sharp-backed encode pipeline that
 * `scripts/generate-image-variants.mjs` uses. Both entry points
 * share the same `emit` helper so a manual run and a `pnpm build`
 * produce byte-identical outputs.
 *
 * The plugin is a no-op when source siblings are already up-to-date
 * (mtime check), so re-running `vite build` doesn't re-encode.
 *
 * Skipping the icon directory is critical: PWA manifest references
 * favicons/icons by exact PNG filename and browsers don't accept
 * AVIF/WebP there.
 */
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const SOURCE_EXTS = new Set([".jpg", ".jpeg", ".png"]);
const SKIP_DIRS = new Set(["audio", "data"]);
// Inside `public/icons/` only PWA shortcut icons get modern variants.
// Favicons / app icons are referenced by exact PNG filename in
// `<link rel="icon">` and the manifest `icons[]` array, where browsers
// don't accept AVIF/WebP, so they must remain PNG-only.
const ICON_VARIANTS_PREFIX = "shortcut-";

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

export async function emitVariants(src) {
  const ext = path.extname(src).toLowerCase();
  if (!SOURCE_EXTS.has(ext)) return null;
  const base = src.slice(0, -ext.length);
  const webp = `${base}.webp`;
  const avif = `${base}.avif`;
  const tasks = [];
  if (!(await isUpToDate(src, webp))) {
    tasks.push(
      sharp(src).webp({ quality: 82, effort: 5 }).toFile(webp).then(() => webp),
    );
  }
  if (!(await isUpToDate(src, avif))) {
    tasks.push(
      sharp(src).avif({ quality: 55, effort: 5 }).toFile(avif).then(() => avif),
    );
  }
  if (tasks.length === 0) return null;
  const written = await Promise.all(tasks);
  return { src, written };
}

export async function emitAllUnder(dir) {
  const reports = [];
  for await (const file of walk(dir)) {
    const r = await emitVariants(file);
    if (r) reports.push(r);
  }
  return reports;
}

/**
 * Vite plugin factory. Defaults to `<projectRoot>/public`.
 *
 *   import imageVariants from "./scripts/vite-image-variants-plugin.mjs";
 *   plugins: [imageVariants()]
 */
export default function imageVariants(opts = {}) {
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
      const msg = `[image-variants] emitted ${reports.length} source(s) in ${ms} ms\n${lines.join("\n")}`;
      logger.info?.(msg) ?? logger.log?.(msg);
    },
  };
}

// Allow `node scripts/vite-image-variants-plugin.mjs` to run the same
// pipeline manually (used by `pnpm generate:image-variants`).
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  const root = path.resolve(path.dirname(__filename), "..");
  const reports = await emitAllUnder(path.join(root, "public"));
  if (reports.length === 0) {
    console.log("[image-variants] up-to-date.");
  } else {
    for (const r of reports) {
      console.log(`[image-variants] ${path.relative(root, r.src)}`);
      r.written.forEach((p) => console.log(`    → ${path.relative(root, p)}`));
    }
  }
}
