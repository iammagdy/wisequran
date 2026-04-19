#!/usr/bin/env node
// Pre-build gate: fail loudly if any required VITE_* build-time env var is
// missing or empty.
//
// Vite inlines `import.meta.env.VITE_*` at build time. If a required value is
// absent it silently becomes the empty string, the Supabase client crashes at
// module init, and the whole app renders as a blank page in production. This
// script makes that failure mode loud and immediate, before `vite build` runs.
const REQUIRED = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
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

console.log(`✓ All ${REQUIRED.length} required VITE_* env vars are set.`);
