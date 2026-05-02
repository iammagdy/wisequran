import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for Wise Quran end-to-end coverage.
 *
 * Runs against the same Vite dev server we use locally (port 5000), so
 * the specs exercise the real React routing, AudioPlayerContext, Sleep
 * Mode singleton, and IndexedDB layer — not a build-time stub.
 *
 * Mobile Safari is the primary target because that's where the audio
 * stack is the most fragile (iOS standalone PWA + audio session
 * gymnastics). Desktop Chromium is included as a baseline that catches
 * regressions in the non-mobile codepaths (route guards, Settings,
 * Quran reader virtualization).
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? "list" : "html",
  use: {
    baseURL: "http://localhost:5000",
    trace: "on-first-retry",
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-safari",
      use: { ...devices["iPhone 14"] },
    },
  ],
  webServer: {
    command: "pnpm run dev",
    url: "http://localhost:5000",
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
});
