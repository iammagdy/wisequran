#!/usr/bin/env node
// Pre-build gate: fail loudly if any required VITE_* build-time env var is
// missing or empty.
//
// HOW TO USE: Add any env var that is *truly* app-breaking if absent to the
// REQUIRED array below. The gate will then exit 1 before `vite build` runs,
// preventing a silent blank-page deploy.
//
// VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are intentionally NOT listed:
//   - supabase.ts falls back to placeholder values and logs a console.warn
//   - the app builds and serves correctly without them (sync is disabled)
//   - they were removed from the required list in v3.9.1 when sign-in was dropped
//
// If you add a truly mandatory env var (e.g. a payment key without which the
// app cannot function at all), add it here AND document why it is required.
const REQUIRED = [
  // e.g. "VITE_STRIPE_PUBLISHABLE_KEY",
];

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

if (REQUIRED.length === 0) {
  console.log("✓ No required VITE_* env vars defined (Supabase and other vars are optional — app has fallbacks).");
} else {
  console.log(`✓ All ${REQUIRED.length} required VITE_* env vars are set.`);
}
