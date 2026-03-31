import { expect, test } from "@playwright/test";
import {
  sampleCanvas,
  waitForExperienceReady,
} from "./viewport-audit.helpers";

const AUDIT_QUERY = "?audit=1&forceTier=high";
const SWEEP_POINTS = [0.04, 0.22, 0.38, 0.54, 0.71, 0.88, 0.96, 0.04];
const PASS_RUNS = 3;
const STARTUP_READY_BUDGET_MS = 5_000;
const MAX_P95_SCROLL_LATENCY_MS = 16.6;
const MAX_FRAMES_OVER_33_MS = 2;

async function stepProgressSweep(
  page: Parameters<typeof sampleCanvas>[0],
  from: number,
  to: number,
  steps = 5
) {
  for (let step = 1; step <= steps; step += 1) {
    const progress = from + ((to - from) * step) / steps;
    await page.evaluate((nextProgress) => {
      window.__LPV5_VIEWPORT_AUDIT__?.setProgress(nextProgress);
    }, progress);
    await page.waitForTimeout(24);
  }
}

async function assertPerformanceGate(page: Parameters<typeof sampleCanvas>[0], runLabel: string) {
  const snapshot = await sampleCanvas(page);
  expect(snapshot, `${runLabel}: canvas snapshot should exist`).not.toBeNull();
  expect(snapshot?.isContextLost, `${runLabel}: WebGL context must stay intact`).toBeFalsy();

  const metrics = snapshot?.metrics;
  expect(metrics?.telemetry.hasFallbackTriggered, `${runLabel}: safe-mode fallback must not trigger`).toBe(false);
  expect(metrics?.telemetry.safeModeReason, `${runLabel}: safe mode must remain disabled`).toBeNull();
  expect(metrics?.telemetry.startupPhase, `${runLabel}: startup should reach ready`).toBe("ready");
  expect(
    metrics?.telemetry.startupPhaseTimings.readyMs ?? Number.POSITIVE_INFINITY,
    `${runLabel}: startup ready budget`
  ).toBeLessThanOrEqual(STARTUP_READY_BUDGET_MS);
  expect(metrics?.telemetry.nearScrollReady, `${runLabel}: near-scroll assets should be ready`).toBe(true);

  expect(
    metrics?.resourcePipeline?.loadedEntryCritical,
    `${runLabel}: all entry-critical assets must be loaded`
  ).toBe(metrics?.resourcePipeline?.totalEntryCritical);
  expect(
    metrics?.resourcePipeline?.loadedNearScroll,
    `${runLabel}: all near-scroll assets must be loaded`
  ).toBe(metrics?.resourcePipeline?.totalNearScroll);
  expect(
    metrics?.resourcePipeline?.lateEntryCriticalCount ?? Number.POSITIVE_INFINITY,
    `${runLabel}: no late entry-critical requests`
  ).toBe(0);
  expect(
    metrics?.resourcePipeline?.lateNearScrollCount ?? Number.POSITIVE_INFINITY,
    `${runLabel}: no late near-scroll requests`
  ).toBe(0);

  expect(
    metrics?.renderPipeline?.p95ScrollLatencyMs ?? Number.POSITIVE_INFINITY,
    `${runLabel}: p95 scroll latency`
  ).toBeLessThanOrEqual(MAX_P95_SCROLL_LATENCY_MS);
  expect(
    metrics?.renderPipeline?.over33ScrollLatencyMs ?? Number.POSITIVE_INFINITY,
    `${runLabel}: frames over 33ms scroll latency`
  ).toBeLessThanOrEqual(MAX_FRAMES_OVER_33_MS);
  expect(
    metrics?.renderPipeline?.longTasks.count ?? Number.POSITIVE_INFINITY,
    `${runLabel}: long tasks`
  ).toBe(0);
  expect(
    metrics?.renderPipeline?.budget.violations ?? ["missing-budget"],
    `${runLabel}: runtime budget violations`
  ).toEqual([]);
}

test.describe("desktop performance gate", () => {
  test("passes three consecutive production scroll sweeps within desktop budgets", async ({
    page,
  }) => {
    test.setTimeout(600_000);

    for (let runIndex = 0; runIndex < PASS_RUNS; runIndex += 1) {
      await waitForExperienceReady(page, AUDIT_QUERY);
      await page.waitForFunction(() => {
        const metrics = window.__LPV5_VIEWPORT_AUDIT__?.getMetrics();
        return (metrics?.telemetry?.warmupActCount ?? 0) >= 6;
      }, undefined, { polling: 100, timeout: 30_000 });
      await page.evaluate(() => {
        (
          window as Window & {
            __LPV5_RESET_AUDIT_WINDOW__?: () => void;
          }
        ).__LPV5_RESET_AUDIT_WINDOW__?.();
      });

      for (let pointIndex = 1; pointIndex < SWEEP_POINTS.length; pointIndex += 1) {
        await stepProgressSweep(
          page,
          SWEEP_POINTS[pointIndex - 1],
          SWEEP_POINTS[pointIndex]
        );
      }
      await page.waitForTimeout(200);

      await assertPerformanceGate(page, `run-${runIndex + 1}`);
      await page.goto("about:blank");
    }
  });
});
