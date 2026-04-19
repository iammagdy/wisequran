#!/usr/bin/env node
// Pre-deploy smoke test: serve the built `dist/` directory and confirm that
// the React root renders at least one child element within a few seconds.
//
// This is the minimum check that catches the "blank page" failure mode
// (e.g. Supabase client throws at module init, or a missing import causes a
// ReferenceError before the app mounts). The page must reach a state where
// `#root` has children — a successful HTTP response and parsed HTML are not
// enough on their own.
//
// Run AFTER `pnpm run build`.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, resolve } from "node:path";
import { chromium } from "playwright-chromium";

const DIST = resolve(process.cwd(), "dist");
const PORT = Number(process.env.SMOKE_PORT || 4321);
const TIMEOUT_MS = Number(process.env.SMOKE_TIMEOUT_MS || 10_000);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
  ".map": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

async function ensureDistExists() {
  try {
    const s = await stat(DIST);
    if (!s.isDirectory()) throw new Error("not a directory");
  } catch (err) {
    console.error(`✖ ${DIST} not found. Run \`pnpm run build\` first.`);
    console.error(`  ${err.message}`);
    process.exit(2);
  }
}

function startStaticServer() {
  const server = createServer(async (req, res) => {
    try {
      const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
      let filePath = join(DIST, urlPath);
      try {
        const s = await stat(filePath);
        if (s.isDirectory()) filePath = join(filePath, "index.html");
      } catch {
        // Fall through to SPA fallback
        filePath = join(DIST, "index.html");
      }
      // SPA fallback: any unknown path returns index.html
      try {
        await stat(filePath);
      } catch {
        filePath = join(DIST, "index.html");
      }
      const body = await readFile(filePath);
      const type = MIME[extname(filePath).toLowerCase()] || "application/octet-stream";
      res.writeHead(200, { "content-type": type, "cache-control": "no-store" });
      res.end(body);
    } catch (err) {
      res.writeHead(500, { "content-type": "text/plain" });
      res.end(`smoke server error: ${err.message}`);
    }
  });
  return new Promise((res, rej) => {
    server.once("error", rej);
    server.listen(PORT, "127.0.0.1", () => res(server));
  });
}

async function main() {
  await ensureDistExists();
  const server = await startStaticServer();
  console.log(`Serving dist/ at http://127.0.0.1:${PORT}`);

  let browser;
  let exitCode = 0;
  const consoleErrors = [];
  const pageErrors = [];

  try {
    browser = await chromium.launch();
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => {
      pageErrors.push(err.message);
    });

    await page.goto(`http://127.0.0.1:${PORT}/`, {
      waitUntil: "domcontentloaded",
      timeout: TIMEOUT_MS,
    });

    // Wait for the React root to have at least one child element.
    await page.waitForFunction(
      () => {
        const root = document.getElementById("root");
        return !!(root && root.children && root.children.length > 0);
      },
      null,
      { timeout: TIMEOUT_MS, polling: 100 },
    );

    const childCount = await page.evaluate(
      () => document.getElementById("root")?.children.length ?? 0,
    );

    if (pageErrors.length > 0) {
      console.error("✖ Uncaught errors during boot:");
      for (const e of pageErrors) console.error(`    ${e}`);
      exitCode = 1;
    } else {
      console.log(`✓ React root rendered ${childCount} child element(s).`);
      if (consoleErrors.length > 0) {
        console.warn(`  (${consoleErrors.length} console.error message(s) observed but not fatal.)`);
      }
    }
  } catch (err) {
    console.error("✖ Smoke test failed: the React root never rendered any children.");
    console.error(`  ${err.message}`);
    if (pageErrors.length > 0) {
      console.error("  Uncaught page errors:");
      for (const e of pageErrors) console.error(`    ${e}`);
    }
    if (consoleErrors.length > 0) {
      console.error("  Console errors:");
      for (const e of consoleErrors.slice(0, 10)) console.error(`    ${e}`);
    }
    exitCode = 1;
  } finally {
    if (browser) await browser.close().catch(() => {});
    await new Promise((res) => server.close(() => res(null)));
  }

  process.exit(exitCode);
}

main().catch((err) => {
  console.error("✖ Unexpected smoke test error:", err);
  process.exit(2);
});
