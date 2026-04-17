#!/usr/bin/env node
/**
 * Phase D — emit WebP + AVIF siblings for static raster assets in
 * `public/`. Run on demand (`pnpm generate:image-variants`) and
 * commit the outputs alongside the originals.
 *
 * Why a script and not a build-time Vite plugin: the source images
 * are stable (install guides, etc.), so doing the encode at build
 * time on every CI run would burn ~30s for zero practical benefit.
 * A committed siblings strategy keeps `vite build` fast and lets the
 * server pick the smallest acceptable format via the `<picture>`
 * element on the consumer side.
 *
 * Skips files where an output sibling is already newer than the
 * source (so re-running is a no-op until you replace an image).
 */
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(new URL(".", import.meta.url).pathname, "..");
const PUBLIC = path.join(ROOT, "public");

const SOURCE_EXTS = new Set([".jpg", ".jpeg", ".png"]);
// PWA icons + favicons must remain authoritative PNG/ICO — the manifest
// references them by exact filename and browsers don't accept
// webp/avif there. Skip the icon directory entirely.
const SKIP_DIRS = new Set(["icons", "audio", "data"]);

async function* walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      yield* walk(full);
    } else {
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

async function emit(src) {
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
  const [srcStat, ...outStats] = await Promise.all([stat(src), ...written.map((p) => stat(p))]);
  return { src, written, srcBytes: srcStat.size, outBytes: outStats.map((s) => s.size) };
}

async function main() {
  const reports = [];
  for await (const file of walk(PUBLIC)) {
    const r = await emit(file);
    if (r) reports.push(r);
  }
  if (reports.length === 0) {
    console.log("[image-variants] all outputs up-to-date.");
    return;
  }
  for (const r of reports) {
    console.log(`[image-variants] ${path.relative(ROOT, r.src)}  (${(r.srcBytes / 1024).toFixed(1)} KB)`);
    r.written.forEach((p, i) => {
      console.log(`    → ${path.relative(ROOT, p)}  (${(r.outBytes[i] / 1024).toFixed(1)} KB)`);
    });
  }
}

await main();
