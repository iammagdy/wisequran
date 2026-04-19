#!/usr/bin/env node
// One-shot codemod: physical Tailwind utilities → logical equivalents.
// Run from project root: `node scripts/codemod-logical-css.mjs`.
// Scope: src/components (excluding ui/ shadcn primitives) + src/pages.
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOTS = ["src/pages", "src/components"];
const SKIP_DIRS = new Set(["ui"]);

const REPLACEMENTS = [
  // margins / padding (with optional negative prefix and tailwind responsive prefixes)
  [/(\b|-)ml-(?=[\d\[])/g, "$1ms-"],
  [/(\b|-)mr-(?=[\d\[])/g, "$1me-"],
  [/(\b|-)pl-(?=[\d\[])/g, "$1ps-"],
  [/(\b|-)pr-(?=[\d\[])/g, "$1pe-"],
  // text alignment
  [/\btext-left\b/g, "text-start"],
  [/\btext-right\b/g, "text-end"],
];

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
    if (next !== src) {
      writeFileSync(file, next);
      changed++;
      touched.push(file);
    }
  }
}

console.log(`✓ Updated ${changed} file(s).`);
for (const f of touched) console.log(`  - ${f}`);
