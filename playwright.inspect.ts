import { defineConfig } from "@playwright/test";

/**
 * Playwright inspection config — targets a running dev server on port 3000.
 * Does NOT build or spawn any server process.
 *
 * Designed for:
 *   - Live renderer state capture during active development
 *   - Agent-driven inspection without a production build cycle
 *   - Always-on traces and screenshots for maximum observability
 *
 * Prerequisites:
 *   npm run dev          # must be running in a separate terminal
 *
 * Usage:
 *   npx playwright test --config=playwright.inspect.ts tests/renderer-snapshot.spec.ts
 *   npm run audit:snapshot      # shorthand (see package.json)
 */
export default defineConfig({
  testDir: "./tests",
  timeout: 180_000,
  fullyParallel: false,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "test-results/inspect-report" }],
  ],
  use: {
    baseURL: "http://localhost:3000",
    browserName: "chromium",
    headless: true,
    screenshot: "on",
    trace: "on",
    video: "retain-on-failure",
    viewport: { width: 1440, height: 900 },
    launchOptions: {
      args: [
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
        "--enable-precise-memory-info",
      ],
    },
  },
  // No webServer block — connects to an already-running dev server
});
