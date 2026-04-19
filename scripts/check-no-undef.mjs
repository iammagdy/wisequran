#!/usr/bin/env node
// Pre-deploy gate: fail if ESLint reports any `no-undef` errors under src/.
//
// This catches the class of bug where a JSX file references something
// (typically a lucide-react icon) whose import was deleted but the usage
// site wasn't. TypeScript treats unknown JSX intrinsics loosely, so the
// only thing that flags it before runtime is `no-undef` from ESLint.
//
// We deliberately scope to *only* the `no-undef` rule so this gate isn't
// affected by other lint rules the team is still cleaning up.
import { spawnSync } from "node:child_process";

const result = spawnSync(
  "pnpm",
  ["exec", "eslint", "--rule", '{"no-undef":"error"}', "--format", "json", "src"],
  { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
);

if (result.error) {
  console.error("✖ Failed to run eslint:", result.error.message);
  process.exit(2);
}

let report;
try {
  report = JSON.parse(result.stdout);
} catch (err) {
  console.error("✖ Could not parse eslint JSON output.");
  console.error(result.stdout.slice(0, 2000));
  console.error(result.stderr.slice(0, 2000));
  console.error(err.message);
  process.exit(2);
}

const offenders = [];
for (const file of report) {
  for (const msg of file.messages) {
    if (msg.ruleId === "no-undef" && msg.severity === 2) {
      offenders.push({
        filePath: file.filePath,
        line: msg.line,
        column: msg.column,
        message: msg.message,
      });
    }
  }
}

if (offenders.length > 0) {
  console.error("✖ ESLint no-undef errors found in src/:");
  console.error("─".repeat(70));
  for (const o of offenders) {
    console.error(`  ${o.filePath}:${o.line}:${o.column}  ${o.message}`);
  }
  console.error("─".repeat(70));
  console.error(
    "These usually mean a symbol is referenced but not imported (e.g. a",
  );
  console.error(
    "lucide-react icon whose import was deleted). Fix the imports and re-run.",
  );
  process.exit(1);
}

console.log("✓ No `no-undef` errors in src/.");
