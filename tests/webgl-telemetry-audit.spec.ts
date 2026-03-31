import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

type TelemetryWindow = Window & {
  __R3F_TELEMETRY?: () => unknown;
};
const STARTUP_READY_TIMEOUT_MS = 120_000;
const STARTUP_READY_BUDGET_MS = 5_000;
const MAX_P95_SCROLL_LATENCY_MS = 16.6;
const MAX_FRAMES_OVER_33_MS = 2;

test.describe('WebGL Telemetry Audit', () => {
  test('capture frame-by-frame telemetry and visuals', async ({ page }) => {
    test.setTimeout(360000);
    
    // Use flagship production settings for regression coverage.
    await page.goto('/?audit=1&forceTier=high');

    // Wait for the application to be ready (canvas and DOM)
    await page.waitForSelector('canvas', {
      state: 'attached',
      timeout: STARTUP_READY_TIMEOUT_MS,
    });
    await page.waitForFunction(
      () => document.querySelector('.loading-screen') === null,
      undefined,
      { polling: 100, timeout: STARTUP_READY_TIMEOUT_MS }
    );
    await page.waitForTimeout(400);

    const steps = 12; // representative sweep without spending most of the budget on screenshots
    const dir = path.join(process.cwd(), 'test-results', 'audit');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    for (let i = 0; i <= steps; i++) {
      const increment = i / steps; // 0 to 1
      
      await page.evaluate(async (progress) => {
        const auditWindow = window as TelemetryWindow & {
          __LPV5_VIEWPORT_AUDIT__?: {
            setProgress: (value: number) => void;
          };
        };

        if (auditWindow.__LPV5_VIEWPORT_AUDIT__) {
          auditWindow.__LPV5_VIEWPORT_AUDIT__.setProgress(progress);
          return;
        }

        const maxScroll =
          Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight,
            document.documentElement.clientHeight
          ) - window.innerHeight;

        window.scrollTo({
          top: maxScroll * progress,
          behavior: 'instant',
        });
      }, increment);

      // Wait a moment for R3F, gsap, and shaders to render the new state
      await page.waitForTimeout(700);

      // 1. Capture Telemetry
      const telemetry = await page.evaluate(() => {
        const telemetryWindow = window as TelemetryWindow;
        if (typeof telemetryWindow.__R3F_TELEMETRY === 'function') {
          return telemetryWindow.__R3F_TELEMETRY();
        }
        return null;
      });

      const metrics = await page.evaluate(() => {
        const auditWindow = window as TelemetryWindow & {
          __LPV5_VIEWPORT_AUDIT__?: {
            getMetrics: () => unknown;
          };
        };
        return auditWindow.__LPV5_VIEWPORT_AUDIT__?.getMetrics() ?? null;
      });

      expect(metrics).not.toBeNull();
      const typedMetrics = metrics as {
        telemetry?: {
          lateRequestCount?: number;
          hasFallbackTriggered?: boolean;
          compileReady?: boolean;
          nearScrollReady?: boolean;
          warmupActCount?: number;
          startupPhaseTimings?: {
            readyMs?: number | null;
          };
        };
        resourcePipeline?: {
          lateEntryCriticalCount?: number;
          lateNearScrollCount?: number;
        };
        renderPipeline?: {
          p95ScrollLatencyMs?: number;
          over33ScrollLatencyMs?: number;
          longTasks?: {
            count?: number;
          };
          renderer: {
            calls: number;
            triangles: number;
          };
          budget?: {
            violations?: string[];
          };
          postReadyRendererDrift?: {
            programs: number;
            geometries: number;
            textures: number;
          } | null;
        };
      };
      expect(typedMetrics.telemetry?.lateRequestCount ?? Number.POSITIVE_INFINITY).toBe(0);
      expect(typedMetrics.telemetry?.hasFallbackTriggered ?? true).toBe(false);
      expect(typedMetrics.telemetry?.compileReady ?? false).toBe(true);
      expect(typedMetrics.telemetry?.nearScrollReady ?? false).toBe(true);
      expect(typedMetrics.telemetry?.warmupActCount ?? 0).toBeGreaterThanOrEqual(2);
      expect(
        typedMetrics.telemetry?.startupPhaseTimings?.readyMs ?? Number.POSITIVE_INFINITY
      ).toBeLessThanOrEqual(STARTUP_READY_BUDGET_MS);
      expect(
        typedMetrics.resourcePipeline?.lateEntryCriticalCount ?? Number.POSITIVE_INFINITY
      ).toBe(0);
      expect(
        typedMetrics.resourcePipeline?.lateNearScrollCount ?? Number.POSITIVE_INFINITY
      ).toBe(0);
      expect(
        typedMetrics.renderPipeline?.p95ScrollLatencyMs ?? Number.POSITIVE_INFINITY
      ).toBeLessThanOrEqual(MAX_P95_SCROLL_LATENCY_MS);
      expect(
        typedMetrics.renderPipeline?.over33ScrollLatencyMs ?? Number.POSITIVE_INFINITY
      ).toBeLessThanOrEqual(MAX_FRAMES_OVER_33_MS);
      expect(
        typedMetrics.renderPipeline?.longTasks?.count ?? Number.POSITIVE_INFINITY
      ).toBe(0);
      expect(typedMetrics.renderPipeline?.budget?.violations ?? ["missing-budget"]).toEqual([]);
      expect(
        typedMetrics.renderPipeline?.postReadyRendererDrift?.programs ?? Number.POSITIVE_INFINITY
      ).toBeLessThanOrEqual(0);
      expect(
        typedMetrics.renderPipeline?.postReadyRendererDrift?.geometries ?? Number.POSITIVE_INFINITY
      ).toBeLessThanOrEqual(0);
      expect(
        typedMetrics.renderPipeline?.postReadyRendererDrift?.textures ?? Number.POSITIVE_INFINITY
      ).toBeLessThanOrEqual(0);

      if (telemetry) {
        fs.writeFileSync(
          path.join(dir, `telemetry-${i}.json`),
          JSON.stringify({ frame: i, progress: increment, ...telemetry, auditMetrics: metrics }, null, 2)
        );
      } else {
        console.warn(`[Audit] Telemetry probe missing on frame ${i}.`);
      }

      // 2. Capture Screenshot
      await page.screenshot({ 
        path: path.join(dir, `frame-${i}.png`), 
        fullPage: false,
        animations: 'disabled'
      });
    }
    
    // Basic assertion to ensure we gathered data
    const files = fs.readdirSync(dir);
    expect(files.filter(f => f.endsWith('.json')).length).toBeGreaterThan(0);
    expect(files.filter(f => f.endsWith('.png')).length).toBeGreaterThan(0);
  });
});
