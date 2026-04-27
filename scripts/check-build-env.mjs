#!/usr/bin/env node
// Pre-build gate: fail loudly if any required VITE_* build-time env var is
// missing or empty.
//
// VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are intentionally NOT listed here:
// supabase.ts already falls back to placeholder values and logs a console.warn
// when they are absent, so the app builds and runs correctly without them
// (sync is silently disabled). Only truly app-breaking env vars belong here.
const REQUIRED = [];

const missing = REQUIRED.filter((name) => {
  const v = process.env[name];
  return v == null || v.trim() === "";
});

if (missing.length > 0) {
  console.error("✖ Required build-time environment variables are missing or empty:");
  for (const name of missing) {
    console.error(`    - ${name}`);
  }
  console.error("");
  console.error("These must be set in the deploy environment before `pnpm run build`.");
  console.error("Without them Vite inlines empty strings and the production app boots blank.");
  process.exit(1);
}

console.log("✓ No required VITE_* env vars are missing (Supabase is optional — app has fallbacks).");
