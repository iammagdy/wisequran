#!/usr/bin/env node
// Pre-deploy gate: catch user-visible string literals that are not bilingual.
//
// Heuristics scoped to src/pages and src/components (excluding src/components/ui
// shadcn primitives, devkit panels, and test files):
//   - JSX text nodes containing Arabic letters that are NOT inside a
//     `language === "ar" ? ... : ...` ternary or a `t("...")` call.
//   - String literals containing Arabic letters in JSX attributes/expressions
//     where the same expression has no English fallback within ~6 lines.
//
// This is a best-effort lint, not a parser. False positives can be silenced
// with the inline comment `// i18n-ok` on the offending line.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const ROOTS = ["src/pages", "src/components"];
const SKIP_DIRS = new Set(["ui", "devkit", "__tests__", "__mocks__"]);
const ARABIC = /[\u0600-\u06FF]/;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (SKIP_DIRS.has(name)) continue;
      walk(full, out);
    } else if (/\.(tsx|ts)$/.test(name) && !/\.test\.(tsx|ts)$/.test(name)) {
      out.push(full);
    }
  }
  return out;
}

const offenders = [];

for (const root of ROOTS) {
  const abs = join(ROOT, root);
  let files;
  try {
    files = walk(abs);
  } catch {
    continue;
  }
  for (const file of files) {
    const src = readFileSync(file, "utf8");
    const lines = src.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!ARABIC.test(line)) continue;
      if (line.includes("// i18n-ok")) continue;
      // Allowed: bilingual ternary on same line or within ±5 lines
      const window = lines.slice(Math.max(0, i - 5), i + 6).join("\n");
      const hasTernary =
        /language\s*===?\s*["'](?:ar|en)["']\s*\?/.test(window) ||
        /\bisRTL\s*\?/.test(window) ||
        /labelAr|labelEn|nameAr|nameEn|titleAr|titleEn|textAr|textEn/.test(window);
      const hasTCall = /\bt\(\s*["'][a-zA-Z0-9_.]+["']\s*[,)]/.test(line);
      // Comments are fine
      const trimmed = line.trim();
      if (trimmed.startsWith("//") || trimmed.startsWith("*")) continue;
      // Translation table itself: skip the LanguageContext file
      if (file.endsWith("LanguageContext.tsx")) continue;
      if (hasTernary || hasTCall) continue;
      offenders.push({
        file: relative(ROOT, file),
        line: i + 1,
        snippet: trimmed.slice(0, 140),
      });
    }
  }
}

// Baseline: existing offenders are tracked to keep the lint warning-only
// for now; new offenders will be reported on stderr but the script still
// exits 0. Wire `STRICT_BILINGUAL=1 node scripts/check-bilingual-coverage.mjs`
// in CI once the backlog is paid down.
const STRICT = process.env.STRICT_BILINGUAL === "1";

if (offenders.length === 0) {
  console.log("✓ Bilingual coverage OK across src/pages and src/components.");
  process.exit(0);
}

const stream = STRICT ? console.error : console.warn;
stream(
  `${STRICT ? "✖" : "⚠"} Bilingual coverage: ${offenders.length} Arabic literal(s) without an obvious English fallback.`
);
stream("─".repeat(70));
for (const o of offenders) stream(`  ${o.file}:${o.line}  ${o.snippet}`);
stream("─".repeat(70));
stream(
  'Add a `language === "ar" ? ... : ...` ternary, an `isRTL ? ... : ...` ternary,'
);
stream(
  'a `t("...")` call, or annotate the line with `// i18n-ok` for intentional'
);
stream("Arabic-only typography (e.g. Bismillah preview).");
process.exit(STRICT ? 1 : 0);
