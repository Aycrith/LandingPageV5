import { expect, test, type Page, type TestInfo } from "@playwright/test";

const ACT_SNAPSHOTS = [
  { name: "act1-entry", progress: 0.06, maxNearWhiteRatio: 0.42 },
  { name: "act2-entry", progress: 0.26, maxNearWhiteRatio: 0.46 },
  { name: "act3-entry", progress: 0.46, maxNearWhiteRatio: 0.52 },
  { name: "act4-entry", progress: 0.66, maxNearWhiteRatio: 0.52 },
  { name: "act5-entry", progress: 0.86, maxNearWhiteRatio: 0.46 },
] as const;

async function waitForExperienceReady(page: Page, search = "") {
  await page.goto(`/${search}`);
  await page.waitForFunction(() => window.__LPV5_VIEWPORT_AUDIT__ != null);
  await page.waitForFunction(
    () => document.querySelector(".loading-screen") === null,
    undefined,
    { timeout: 30_000 }
  );
  await page.waitForTimeout(400);
}

async function setAuditProgress(page: Page, progress: number) {
  await page.evaluate((nextProgress) => {
    window.__LPV5_VIEWPORT_AUDIT__?.setProgress(nextProgress);
  }, progress);
  await page.waitForTimeout(1_100);
}

async function captureScreenshot(
  page: Page,
  testInfo: TestInfo,
  name: string
): Promise<void> {
  const path = testInfo.outputPath(`${name}.png`);
  await page.screenshot({ path, fullPage: false });
  await testInfo.attach(name, {
    path,
    contentType: "image/png",
  });
}

async function sampleCanvas(page: Page) {
  return await page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    const gl = canvas?.getContext("webgl2") ?? canvas?.getContext("webgl");
    const auditApi = window.__LPV5_VIEWPORT_AUDIT__;
    if (!canvas || !gl || !auditApi) {
      return null;
    }

    return {
      isContextLost: gl.isContextLost(),
      heroModels: auditApi.getMetrics().heroModels,
      fxLayers: auditApi.getMetrics().fxLayers,
      renderPipeline: auditApi.getMetrics().renderPipeline,
      scrollState: auditApi.getState(),
    };
  });
}

async function sampleHeap(page: Page) {
  return await page.evaluate(() => {
    if (!("memory" in performance) || !performance.memory) {
      return null;
    }

    return performance.memory.usedJSHeapSize;
  });
}

function unexpectedWarnings(warnings: string[]) {
  return warnings.filter((warning) => {
    if (warning.includes("THREE.THREE.Clock")) {
      return false;
    }

    if (
      warning.includes("GL Driver Message") &&
      warning.includes("GPU stall due to ReadPixels")
    ) {
      return false;
    }

    return true;
  });
}

test.describe("viewport audit", () => {
  test("captures deterministic viewport screenshots in normal and safe mode", async ({
    page,
  }, testInfo) => {
    const warnings: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "warning") {
        warnings.push(msg.text());
      }
    });

    for (const mode of [
      { name: "normal", search: "?audit=1" },
      { name: "safe", search: "?audit=1&safeMode=1" },
    ]) {
      await waitForExperienceReady(page, mode.search);

      const firstFrame = await sampleCanvas(page);
      expect(firstFrame).not.toBeNull();
      expect(firstFrame?.isContextLost).toBeFalsy();
      expect(firstFrame?.heroModels["act1-dark-star"]).toBeDefined();
      expect(firstFrame?.heroModels["act1-dark-star"].fillRatio ?? 1).toBeLessThan(
        (firstFrame?.heroModels["act1-dark-star"].maxFill ?? 0) + 0.03
      );
      expect(firstFrame?.fxLayers["act1-glow"]?.opacity ?? 1).toBeLessThan(0.5);

      await captureScreenshot(page, testInfo, `${mode.name}-first-visible-frame`);

      for (const snapshot of ACT_SNAPSHOTS) {
        await setAuditProgress(page, snapshot.progress);
        const metrics = await sampleCanvas(page);

        expect(metrics).not.toBeNull();
        expect(metrics?.isContextLost).toBeFalsy();
        const heroLabels = [
          "act1-dark-star",
          "act2-globe",
          "act3-hologram",
          "act4-paradox",
          "act5-black-hole",
        ] as const;
        const heroMetric = metrics?.heroModels[heroLabels[ACT_SNAPSHOTS.indexOf(snapshot)]];
        expect(heroMetric).toBeDefined();
        expect(heroMetric?.fillRatio ?? 1).toBeLessThan(
          (heroMetric?.maxFill ?? snapshot.maxNearWhiteRatio) + 0.03
        );
        if (snapshot.name === "act5-entry") {
          expect(metrics?.fxLayers["act5-inner-core"]?.opacity ?? 1).toBeLessThan(0.45);
          expect(metrics?.fxLayers["act5-inner-core"]?.scale ?? 1).toBeLessThan(0.32);
        }

        await captureScreenshot(
          page,
          testInfo,
          `${mode.name}-${snapshot.name}`
        );
      }
    }

    expect(unexpectedWarnings(warnings)).toEqual([]);
  });

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
      const renderPipeline = window.__LPV5_VIEWPORT_AUDIT__?.getMetrics().renderPipeline;
      return renderPipeline != null && renderPipeline.samples >= 10;
    });

    const initialHeap = await sampleHeap(page);

    await page.waitForTimeout(30_000);

    const idleSnapshot = await sampleCanvas(page);
    expect(idleSnapshot).not.toBeNull();
    expect(idleSnapshot?.isContextLost).toBeFalsy();
    expect(idleSnapshot?.renderPipeline).toBeTruthy();
    expect(idleSnapshot?.renderPipeline?.samples ?? 0).toBeGreaterThan(30);
    expect(
      idleSnapshot?.renderPipeline?.meanCpuMs ?? Number.POSITIVE_INFINITY
    ).toBeLessThan(12);
    expect(
      idleSnapshot?.renderPipeline?.p95CpuMs ?? Number.POSITIVE_INFINITY
    ).toBeLessThan(18);
    expect(idleSnapshot?.renderPipeline?.renderer.calls ?? 0).toBeGreaterThan(0);
    expect(idleSnapshot?.renderPipeline?.renderer.geometries ?? 0).toBeGreaterThan(0);
    expect(idleSnapshot?.renderPipeline?.renderer.textures ?? 0).toBeGreaterThan(0);

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
    expect(postSweep?.renderPipeline).toBeTruthy();

    for (const progress of [0.06, 0.26, 0.46, 0.66, 0.86, 0.06]) {
      await setAuditProgress(page, progress);
    }

    const repeatedSweep = await sampleCanvas(page);
    expect(repeatedSweep).not.toBeNull();
    expect(repeatedSweep?.isContextLost).toBeFalsy();
    expect(repeatedSweep?.renderPipeline).toBeTruthy();

    if (postSweep?.renderPipeline && repeatedSweep?.renderPipeline) {
      expect(repeatedSweep.renderPipeline.renderer.geometries).toBeLessThanOrEqual(
        postSweep.renderPipeline.renderer.geometries + 12
      );
      expect(repeatedSweep.renderPipeline.renderer.textures).toBeLessThanOrEqual(
        postSweep.renderPipeline.renderer.textures + 8
      );
      expect(repeatedSweep.renderPipeline.renderer.programs).toBeLessThanOrEqual(
        postSweep.renderPipeline.renderer.programs + 2
      );
    }

    expect(unexpectedWarnings(warnings)).toEqual([]);
  });
});
