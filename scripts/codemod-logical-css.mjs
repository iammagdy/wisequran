#!/usr/bin/env node
// One-shot codemod: physical Tailwind utilities → logical equivalents.
// Run from project root: `node scripts/codemod-logical-css.mjs`.
// Scope: src/components (excluding ui/ shadcn primitives) + src/pages.
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOTS = ["src/pages", "src/components"];
const SKIP_DIRS = new Set(["ui"]);

// Standard replacements: safe to apply unconditionally. Tailwind tokens only.
const REPLACEMENTS = [
  // margins / padding (with optional negative prefix and tailwind responsive prefixes)
  [/(\b|-)ml-(?=[\d\[]|auto\b)/g, "$1ms-"],
  [/(\b|-)mr-(?=[\d\[]|auto\b)/g, "$1me-"],
  [/(\b|-)pl-(?=[\d\[]|auto\b)/g, "$1ps-"],
  [/(\b|-)pr-(?=[\d\[]|auto\b)/g, "$1pe-"],
  // text alignment
  [/\btext-left\b/g, "text-start"],
  [/\btext-right\b/g, "text-end"],
];

// Conditional replacements: skipped on lines that look like an RTL ternary
// (e.g. `isRTL ? "left-3" : "right-3"`), because converting both branches
// to start-/end- would no-op the conditional and break RTL mirroring.
// Note: we deliberately exclude fractional values (e.g. `left-1/2`, `right-1/3`)
// because those are geometric anchors (compass markers, centered overlays paired
// with `-translate-x-1/2`) and must not flip with text direction.
const CONDITIONAL_REPLACEMENTS = [
  [/(\b|-)left-(?=(?:\d+(?![\d/])|\[|auto\b|full\b|px\b))/g, "$1start-"],
  [/(\b|-)right-(?=(?:\d+(?![\d/])|\[|auto\b|full\b|px\b))/g, "$1end-"],
];

const RTL_GUARD = /\bisRTL\b|\bisRtl\b|language\s*===?\s*["']ar["']/;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (SKIP_DIRS.has(name)) continue;
      walk(full, out);
    } else if (/\.(tsx|ts|jsx|js)$/.test(name)) {
      out.push(full);
    }
  }
  return out;
}

let changed = 0;
const touched = [];
for (const root of ROOTS) {
  let files;
  try { files = walk(root); } catch { continue; }
  for (const file of files) {
    const src = readFileSync(file, "utf8");
    let next = src;
    for (const [re, to] of REPLACEMENTS) next = next.replace(re, to);
    // Apply conditional replacements line-by-line, skipping RTL ternaries.
    next = next
      .split("\n")
      .map((line) => {
        if (RTL_GUARD.test(line)) return line;
        let out = line;
        for (const [re, to] of CONDITIONAL_REPLACEMENTS) out = out.replace(re, to);
        return out;
      })
      .join("\n");
    if (next !== src) {
      writeFileSync(file, next);
      changed++;
      touched.push(file);
    }
  }
}

console.log(`✓ Updated ${changed} file(s).`);
for (const f of touched) console.log(`  - ${f}`);
