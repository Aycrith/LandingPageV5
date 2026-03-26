import { expect, test } from "@playwright/test";
import fs from "fs";
import path from "path";

/**
 * Renderer Snapshot — comprehensive browser state capture for AI agent ground truth.
 *
 * Captures: DOM state, ARIA tree, all console messages, network requests,
 * WebGL telemetry via __LPV5_VIEWPORT_AUDIT__, performance timing, and
 * screenshots at each scroll-act progress point.
 *
 * Outputs to test-results/renderer-snapshot/:
 *   renderer-state.json  — full structured report
 *   summary.json         — lightweight quick-read for agents
 *   scene-initial.png    — screenshot at page load
 *   act-*.png            — screenshot at each act
 *
 * Run against production build (port 3100):
 *   npx playwright test tests/renderer-snapshot.spec.ts
 *
 * Run against dev server (port 3000):
 *   npx playwright test --config=playwright.inspect.ts tests/renderer-snapshot.spec.ts
 */

const SNAPSHOT_DIR = path.join(process.cwd(), "test-results", "renderer-snapshot");

type AuditWindow = Window & {
  __LPV5_VIEWPORT_AUDIT__?: {
    getMetrics: () => unknown;
    setProgress: (value: number) => void;
  };
};

type ConsoleEntry = {
  type: string;
  text: string;
  location?: string;
  timestamp: number;
};

type NetworkEntry = {
  url: string;
  method: string;
  status: number;
  durationMs: number;
  resourceType: string;
};

const ACT_POINTS = [
  { name: "act1-entry", progress: 0.05 },
  { name: "act2-entry", progress: 0.22 },
  { name: "act3-entry", progress: 0.38 },
  { name: "act4-entry", progress: 0.55 },
  { name: "act5-entry", progress: 0.72 },
  { name: "act6-end", progress: 0.90 },
] as const;

test.describe("Renderer Snapshot", () => {
  test("capture full renderer state for agent ground truth", async ({ page }, testInfo) => {
    test.setTimeout(180_000);

    fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });

    const consoleEntries: ConsoleEntry[] = [];
    const networkEntries: NetworkEntry[] = [];
    const requestStartTimes = new Map<string, number>();

    page.on("console", (msg) => {
      consoleEntries.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()?.url,
        timestamp: Date.now(),
      });
    });

    page.on("pageerror", (err) => {
      consoleEntries.push({
        type: "pageerror",
        text: `${err.message}\n${err.stack ?? ""}`,
        timestamp: Date.now(),
      });
    });

    page.on("request", (req) => {
      requestStartTimes.set(req.url(), Date.now());
    });

    page.on("response", (res) => {
      if (res.url().startsWith("chrome-extension://")) return;
      networkEntries.push({
        url: res.url(),
        method: res.request().method(),
        status: res.status(),
        durationMs: Date.now() - (requestStartTimes.get(res.url()) ?? Date.now()),
        resourceType: res.request().resourceType(),
      });
    });

    // --- Navigate and wait for full experience readiness ---
    await page.goto("/?audit=1&forceTier=high");

    await page.waitForFunction(
      () => (window as AuditWindow).__LPV5_VIEWPORT_AUDIT__ != null,
      undefined,
      { polling: 100, timeout: 60_000 }
    );

    await page.waitForFunction(
      () => document.querySelector(".loading-screen") === null,
      undefined,
      { polling: 100, timeout: 30_000 }
    );

    await page.waitForTimeout(2_000);

    // --- 1. DOM Snapshot ---
    const domSnapshot = await page.evaluate(() => ({
      title: document.title,
      url: window.location.href,
      canvasCount: document.querySelectorAll("canvas").length,
      visibleText: (document.body.innerText ?? "").slice(0, 4_000),
      metaTags: Array.from(
        document.querySelectorAll("meta[name], meta[property]")
      ).map((m) => ({
        key: m.getAttribute("name") ?? m.getAttribute("property"),
        content: m.getAttribute("content"),
      })),
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
    }));

    // --- 2. WebGL Telemetry ---
    const initialTelemetry = await page.evaluate(
      () => (window as AuditWindow).__LPV5_VIEWPORT_AUDIT__?.getMetrics() ?? null
    );

    // --- 3. Performance Timing ---
    const performanceTiming = await page.evaluate(() => {
      const nav = performance.getEntriesByType(
        "navigation"
      )[0] as PerformanceNavigationTiming | undefined;
      if (!nav) return null;
      return {
        domContentLoadedMs: Math.round(nav.domContentLoadedEventEnd - nav.fetchStart),
        loadCompleteMs: Math.round(nav.loadEventEnd - nav.fetchStart),
        ttfbMs: Math.round(nav.responseStart - nav.fetchStart),
        transferSizeBytes: nav.transferSize,
      };
    });

    // --- 4. ARIA Snapshot (non-deprecated, human + machine readable YAML) ---
    const ariaYaml = await page.locator("body").ariaSnapshot();

    // --- 5. Initial Screenshot ---
    const initialScreenshotPath = path.join(SNAPSHOT_DIR, "scene-initial.png");
    await page.screenshot({ path: initialScreenshotPath, fullPage: false });
    await testInfo.attach("scene-initial", {
      path: initialScreenshotPath,
      contentType: "image/png",
    });

    // --- 6. Act-by-Act State Capture ---
    const actSnapshots: Array<{ name: string; progress: number; metrics: unknown }> = [];

    for (const { name, progress } of ACT_POINTS) {
      await page.evaluate(
        (p) => (window as AuditWindow).__LPV5_VIEWPORT_AUDIT__?.setProgress(p),
        progress
      );
      await page.waitForTimeout(900);

      const metrics = await page.evaluate(
        () => (window as AuditWindow).__LPV5_VIEWPORT_AUDIT__?.getMetrics() ?? null
      );

      const actScreenshotPath = path.join(SNAPSHOT_DIR, `${name}.png`);
      await page.screenshot({ path: actScreenshotPath, fullPage: false });

      actSnapshots.push({ name, progress, metrics });
    }

    // --- 7. Compute Report Summaries ---
    const errors = consoleEntries.filter(
      (e) => e.type === "error" || e.type === "pageerror"
    );
    const warnings = consoleEntries.filter((e) => e.type === "warning");
    const networkFailures = networkEntries.filter((e) => e.status >= 400);
    const slowRequests = networkEntries.filter((e) => e.durationMs > 1_000);

    // --- 8. Build and Write Full Report ---
    const report = {
      capturedAt: new Date().toISOString(),
      config: {
        viewport: { width: 1440, height: 900 },
        auditQuery: "?audit=1&forceTier=high",
        note: "Run with --config=playwright.inspect.ts to target dev server (port 3000)",
      },
      domSnapshot,
      performanceTiming,
      webglTelemetry: {
        initial: initialTelemetry,
        actProgression: actSnapshots,
      },
      accessibility: {
        ariaYaml,
        note: "ARIA tree captured via page.locator(body).ariaSnapshot()",
      },
      console: {
        errorCount: errors.length,
        warningCount: warnings.length,
        errors,
        warnings,
        all: consoleEntries,
      },
      network: {
        totalRequests: networkEntries.length,
        failureCount: networkFailures.length,
        slowRequestCount: slowRequests.length,
        failures: networkFailures,
        slowRequests,
        all: networkEntries,
      },
      screenshots: {
        savedTo: SNAPSHOT_DIR,
        files: ["scene-initial.png", ...ACT_POINTS.map((a) => `${a.name}.png`)],
      },
    };

    const reportPath = path.join(SNAPSHOT_DIR, "renderer-state.json");
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    await testInfo.attach("renderer-state", {
      path: reportPath,
      contentType: "application/json",
    });

    // Lightweight summary for quick agent reads
    const summary = {
      capturedAt: report.capturedAt,
      url: domSnapshot.url,
      canvasCount: domSnapshot.canvasCount,
      consoleErrors: errors.length,
      consoleWarnings: warnings.length,
      networkFailures: networkFailures.length,
      slowRequests: slowRequests.length,
      performanceTiming,
      initialTelemetry,
      actsSnapshotted: actSnapshots.length,
      outputDir: SNAPSHOT_DIR,
      files: report.screenshots.files,
    };

    const summaryPath = path.join(SNAPSHOT_DIR, "summary.json");
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    await testInfo.attach("summary", {
      path: summaryPath,
      contentType: "application/json",
    });

    // --- 9. Assertions ---
    expect(domSnapshot.canvasCount, "WebGL canvas must be present").toBeGreaterThan(0);

    const unexpectedErrors = errors.filter(
      (e) =>
        !e.text.includes("favicon") &&
        !e.text.includes("ERR_NAME_NOT_RESOLVED")
    );
    expect(unexpectedErrors, "No unexpected console errors").toHaveLength(0);

    console.log(`\n[renderer-snapshot] Saved to: ${SNAPSHOT_DIR}`);
    console.log(`[renderer-snapshot] Summary:\n${JSON.stringify(summary, null, 2)}\n`);
  });
});
