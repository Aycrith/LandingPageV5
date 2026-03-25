import { expect, test } from "@playwright/test";
import {
  sampleCanvas,
  sampleHeap,
  setAuditProgress,
  unexpectedWarnings,
  waitForExperienceReady,
} from "./viewport-audit.helpers";

test.describe("viewport audit stability", () => {
  test("holds frame times, survives a 30 second idle, and stays stable across a full scroll sweep", async ({
    page,
  }) => {
    const warnings: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "warning") {
        warnings.push(msg.text());
      }
    });

    await waitForExperienceReady(page, "?audit=1");
    await setAuditProgress(page, 0.06);
    await page.waitForFunction(() => {
      const auditWindow = window as Window & {
        __LPV5_VIEWPORT_AUDIT__?: {
          getMetrics: () => {
            renderPipeline?: { samples: number; renderer: { calls: number; triangles: number } };
          };
        };
      };
      const renderPipeline = auditWindow.__LPV5_VIEWPORT_AUDIT__?.getMetrics().renderPipeline;
      return (
        renderPipeline != null &&
        renderPipeline.samples >= 10 &&
        renderPipeline.renderer.calls > 0 &&
        renderPipeline.renderer.triangles > 0
      );
    });

    const initialHeap = await sampleHeap(page);

    await page.waitForTimeout(30_000);

    const idleSnapshot = await sampleCanvas(page);
    expect(idleSnapshot).not.toBeNull();
    expect(idleSnapshot?.isContextLost).toBeFalsy();
    expect(idleSnapshot?.metrics.renderPipeline).toBeTruthy();
    expect(idleSnapshot?.metrics.renderPipeline?.samples ?? 0).toBeGreaterThan(30);
    expect(
      idleSnapshot?.metrics.renderPipeline?.meanCpuMs ?? Number.POSITIVE_INFINITY
    ).toBeLessThan(16.6);
    // Headless Chromium heavily throttles presentation cadence, so CPU-side render cost
    // is the stable budget signal here rather than RAF delta.
    expect(
      idleSnapshot?.metrics.renderPipeline?.p95CpuMs ?? Number.POSITIVE_INFINITY
    ).toBeLessThan(12);
    expect(idleSnapshot?.metrics.renderPipeline?.renderer.calls ?? 0).toBeGreaterThan(0);
    expect(idleSnapshot?.metrics.renderPipeline?.renderer.triangles ?? 0).toBeGreaterThan(0);
    expect(idleSnapshot?.metrics.renderPipeline?.renderer.geometries ?? 0).toBeGreaterThan(0);
    expect(idleSnapshot?.metrics.renderPipeline?.renderer.textures ?? 0).toBeGreaterThan(0);

    const idleHeap = await sampleHeap(page);
    if (initialHeap != null && idleHeap != null) {
      expect(idleHeap).toBeLessThan(initialHeap * 1.6);
    }

    for (const progress of [0.06, 0.26, 0.46, 0.66, 0.86, 0.06]) {
      await setAuditProgress(page, progress);
    }

    const postSweep = await sampleCanvas(page);
    expect(postSweep).not.toBeNull();
    expect(postSweep?.isContextLost).toBeFalsy();
    expect(postSweep?.metrics.renderPipeline).toBeTruthy();

    for (const progress of [0.06, 0.26, 0.46, 0.66, 0.86, 0.06]) {
      await setAuditProgress(page, progress);
    }

    const repeatedSweep = await sampleCanvas(page);
    expect(repeatedSweep).not.toBeNull();
    expect(repeatedSweep?.isContextLost).toBeFalsy();
    expect(repeatedSweep?.metrics.renderPipeline).toBeTruthy();

    if (postSweep?.metrics.renderPipeline && repeatedSweep?.metrics.renderPipeline) {
      expect(repeatedSweep.metrics.renderPipeline.renderer.geometries).toBeLessThanOrEqual(
        postSweep.metrics.renderPipeline.renderer.geometries + 25
      );
      expect(repeatedSweep.metrics.renderPipeline.renderer.textures).toBeLessThanOrEqual(
        postSweep.metrics.renderPipeline.renderer.textures + 15
      );
      expect(repeatedSweep.metrics.renderPipeline.renderer.programs).toBeLessThanOrEqual(
        postSweep.metrics.renderPipeline.renderer.programs + 10
      );
    }

    expect(unexpectedWarnings(warnings)).toEqual([]);
  });

  test("triggers startup recovery when critical assets timeout", async ({
    page,
  }) => {
    await page.route("**/*.gltf", (route) => route.abort("timedout"));
    await page.route("**/*.bin", (route) => route.abort("timedout"));

    await page.goto("/?audit=1");
    await page.waitForFunction(() => {
      const auditWindow = window as Window & {
        __LPV5_VIEWPORT_AUDIT__?: unknown;
      };
      return auditWindow.__LPV5_VIEWPORT_AUDIT__ != null;
    });

    await page.waitForFunction(
      () => document.querySelector(".loading-screen") === null,
      undefined,
      { timeout: 15_000 }
    );
    await page.waitForTimeout(400);

    const isFallbackVisible = await page.evaluate(() => {
      const el = document.body.innerText;
      return el.includes("Visuals limited (Safe Mode)");
    });
    expect(isFallbackVisible).toBe(true);
  });
});
