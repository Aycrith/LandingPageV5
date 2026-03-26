#!/usr/bin/env node
/**
 * extract-page-state.mjs
 *
 * Lightweight, standalone page-state extractor for development mode.
 * Works against a running dev server — does NOT require a production build.
 * Captures DOM state, ARIA tree, WebGL telemetry, console logs, and a screenshot.
 *
 * Usage:
 *   npm run audit:extract                              # defaults
 *   node scripts/extract-page-state.mjs --url=http://localhost:3000 --progress=0.5
 *
 * Options:
 *   --url=<url>       Base URL of the running dev server  (default: http://localhost:3000)
 *   --progress=<0-1>  Scroll progress to inject via audit probe (default: 0)
 *
 * Output: test-results/extraction/
 *   state.json      — structured report (DOM, telemetry, console, network)
 *   screenshot.png  — full-viewport screenshot at the given progress
 */

import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, "..", "test-results", "extraction");

// --- Parse CLI args ---
const argMap = Object.fromEntries(
  process.argv
    .slice(2)
    .filter((a) => a.startsWith("--"))
    .map((a) => a.slice(2).split("="))
    .filter(([k]) => k.length > 0)
    .map(([k, v = "true"]) => [k, v])
);

const TARGET_URL = argMap.url ?? "http://localhost:3000";
const SCROLL_PROGRESS = parseFloat(argMap.progress ?? "0");

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

console.log(`\n[extract] Target URL      : ${TARGET_URL}`);
console.log(`[extract] Scroll progress : ${SCROLL_PROGRESS}`);
console.log(`[extract] Output dir      : ${OUTPUT_DIR}\n`);

const browser = await chromium.launch({
  headless: true,
  args: [
    // Prevent Chrome from throttling requestAnimationFrame and timers for
    // off-screen / background contexts. Without these flags, headless Chromium
    // drops the rAF rate to ~1 fps for WebGL canvases, which means R3F's frame
    // loop barely fires and StartupReadinessGate never accumulates stable frames.
    "--disable-background-timer-throttling",
    "--disable-renderer-backgrounding",
    "--disable-backgrounding-occluded-windows",
  ],
});
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

// Bring page to foreground so Chrome treats it as an active tab — this
// ensures requestAnimationFrame fires at full speed rather than being
// throttled as a background/hidden page.
await page.bringToFront();

const consoleLog = [];
const networkLog = [];
const requestTimes = new Map();

page.on("console", (msg) =>
  consoleLog.push({ type: msg.type(), text: msg.text() })
);
page.on("pageerror", (err) =>
  consoleLog.push({ type: "pageerror", text: err.message })
);
page.on("request", (req) => requestTimes.set(req.url(), Date.now()));
page.on("response", (res) => {
  if (res.url().startsWith("chrome-extension://")) return;
  networkLog.push({
    url: res.url(),
    status: res.status(),
    type: res.request().resourceType(),
    durationMs: Date.now() - (requestTimes.get(res.url()) ?? Date.now()),
  });
});

const query = "?forceTier=high&audit=1";
await page.goto(`${TARGET_URL}${query}`, { waitUntil: "domcontentloaded" });

// Wait for audit probe (up to 30 s) — non-fatal if absent
const hasAuditProbe = await page
  .waitForFunction(() => window.__LPV5_VIEWPORT_AUDIT__ != null, undefined, {
    polling: 200,
    timeout: 30_000,
  })
  .then(() => true)
  .catch(() => false);

if (!hasAuditProbe) {
  console.warn("[extract] Warning: __LPV5_VIEWPORT_AUDIT__ not found — WebGL telemetry unavailable");
  console.warn("[extract] Make sure the dev server is running: npm run dev\n");
}

// Wait for scene to reach stableFrameReady (audit probe exposes this as startupTimeMs != null).
// This is the authoritative signal — polling the DOM loading-screen is unreliable because it
// only disappears after a 900 ms minimumVeilMs + 1200 ms fade, and in headless dev mode the
// full chain can take >30 s before our 30 s polling window was hit.
const sceneStable = await page
  .waitForFunction(
    () => {
      const probe = window.__LPV5_VIEWPORT_AUDIT__;
      if (!probe) return false;
      const m = probe.getMetrics();
      return m?.telemetry?.startupTimeMs != null;
    },
    undefined,
    { polling: 300, timeout: 60_000 }
  )
  .then(() => true)
  .catch(() => false);

if (!sceneStable) {
  console.warn("[extract] Warning: scene did not reach stableFrameReady within 60 s — telemetry may be incomplete");
}

// Brief settle time for the renderer to flush the first stable frame
await page.waitForTimeout(800);

// Inject scroll progress AFTER the scene is stable so act transitions complete cleanly
if (SCROLL_PROGRESS > 0) {
  await page.evaluate((p) => {
    if (window.__LPV5_VIEWPORT_AUDIT__) {
      window.__LPV5_VIEWPORT_AUDIT__.setProgress(p);
    }
  }, SCROLL_PROGRESS);
  await page.waitForTimeout(1_200);
}

// --- Extract state ---
const [domInfo, telemetry, ariaYaml] = await Promise.all([
  page.evaluate(() => ({
    title: document.title,
    url: window.location.href,
    canvasCount: document.querySelectorAll("canvas").length,
    visibleText: (document.body.innerText ?? "").slice(0, 3_000),
    interactiveElements: Array.from(
      document.querySelectorAll(
        'button, a[href], input, select, [role="button"], [role="link"], [tabindex="0"]'
      )
    ).map((el) => ({
      tag: el.tagName,
      text: (el.textContent ?? "").trim().slice(0, 80),
      ariaLabel: el.getAttribute("aria-label"),
      role: el.getAttribute("role"),
    })),
  })),
  hasAuditProbe
    ? page.evaluate(() => window.__LPV5_VIEWPORT_AUDIT__?.getMetrics() ?? null)
    : Promise.resolve(null),
  page.locator("body").ariaSnapshot(),
]);

const screenshotPath = path.join(OUTPUT_DIR, "screenshot.png");
const screenshot = await page.screenshot({ fullPage: false });
fs.writeFileSync(screenshotPath, screenshot);

const result = {
  capturedAt: new Date().toISOString(),
  targetUrl: `${TARGET_URL}${query}`,
  scrollProgress: SCROLL_PROGRESS,
  domInfo,
  telemetry,
  ariaYaml,
  consoleErrors: consoleLog.filter((m) => m.type === "error" || m.type === "pageerror"),
  consoleWarnings: consoleLog.filter((m) => m.type === "warning"),
  networkFailures: networkLog.filter((r) => r.status >= 400),
  screenshotPath,
};

const outputPath = path.join(OUTPUT_DIR, "state.json");
fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));

console.log(`[extract] state.json saved   : ${outputPath}`);
console.log(`[extract] screenshot.png saved: ${screenshotPath}`);
console.log(`[extract] Canvas count       : ${domInfo.canvasCount}`);
console.log(`[extract] Console errors     : ${result.consoleErrors.length}`);
console.log(`[extract] Network failures   : ${result.networkFailures.length}`);
console.log(`[extract] WebGL telemetry    : ${telemetry ? "available" : "unavailable"}\n`);

await browser.close();
