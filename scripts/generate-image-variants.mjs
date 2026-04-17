#!/usr/bin/env node
/**
 * Phase D — manual entry point for emitting WebP/AVIF siblings.
 *
 * The same encode pipeline runs automatically as a Vite plugin
 * (see `scripts/vite-image-variants-plugin.mjs`). This script just
 * re-uses that plugin's `emitAllUnder` helper so a `pnpm
 * generate:image-variants` run is byte-identical to a `pnpm build`.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { emitAllUnder } from "./vite-image-variants-plugin.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reports = await emitAllUnder(path.join(ROOT, "public"));
if (reports.length === 0) {
  console.log("[image-variants] all outputs up-to-date.");
} else {
  for (const r of reports) {
    console.log(`[image-variants] ${path.relative(ROOT, r.src)}`);
    r.written.forEach((p) => console.log(`    → ${path.relative(ROOT, p)}`));
  }
}
