import { expect, test, type Page, type TestInfo } from "@playwright/test";
import {
  ACT_SNAPSHOTS,
  FLAGSHIP_AUDIT_QUERY,
  captureScreenshot,
  sampleCanvas,
  setAuditProgress,
  unexpectedWarnings,
  waitForExperienceReady,
} from "./viewport-audit.helpers";

async function runFlagshipVisualAudit(
  page: Page,
  testInfo: TestInfo,
  viewport: { width: number; height: number },
  prefix: string
) {
  const warnings: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "warning") {
      warnings.push(msg.text());
    }
  });

  await page.setViewportSize(viewport);
  await waitForExperienceReady(page, FLAGSHIP_AUDIT_QUERY);

  const firstFrame = await sampleCanvas(page);
  expect(firstFrame).not.toBeNull();
  expect(firstFrame?.isContextLost).toBeFalsy();
  expect(firstFrame?.metrics.telemetry).toBeDefined();
  expect(firstFrame?.metrics.telemetry.startupTimeMs).toBeGreaterThan(0);
  expect(firstFrame?.metrics.telemetry.hasFallbackTriggered).toBe(false);
  expect(firstFrame?.metrics.telemetry.tier).toBe("high");
  expect(firstFrame?.metrics.telemetry.startupPhase).toBe("ready");
  expect(firstFrame?.metrics.telemetry.lateRequestCount).toBe(0);

  await captureScreenshot(page, testInfo, `${prefix}-first-visible-frame`);

  for (const snapshot of ACT_SNAPSHOTS) {
    await setAuditProgress(page, snapshot.progress);
    const sample = await sampleCanvas(page);

    expect(sample).not.toBeNull();
    expect(sample?.isContextLost).toBeFalsy();
    expect(sample?.metrics.telemetry.lateRequestCount).toBe(0);
    expect(sample?.metrics.sceneState.activeHeroLabel).toBe(snapshot.heroLabel);
    expect(sample?.metrics.sceneState.activeHeroAsset).toBe(snapshot.heroAsset);
    for (const act of snapshot.containsActs) {
      expect(sample?.metrics.sceneState.mountedActs).toContain(act);
    }
    expect(Object.keys(sample?.metrics.heroModels ?? {})).toEqual([
      snapshot.heroLabel,
    ]);

    const heroMetric = sample?.metrics.heroModels[snapshot.heroLabel];
    expect(heroMetric).toBeDefined();
    expect(heroMetric?.fillRatio ?? 1).toBeLessThan(
      (heroMetric?.maxFill ?? 0.7) + 0.03
    );

    expect(sample?.metrics.composition.visibleMeshCount ?? 0).toBeGreaterThan(0);
    expect(
      sample?.metrics.composition.transparentMeshCount ??
        Number.POSITIVE_INFINITY
    ).toBeLessThanOrEqual(snapshot.maxTransparentCount);
    expect(sample?.metrics.renderPipeline?.renderer.calls ?? 0).toBeGreaterThan(0);
    expect(sample?.metrics.renderPipeline?.renderer.triangles ?? 0).toBeGreaterThan(0);

    if (snapshot.name === "act5-entry") {
      expect(sample?.metrics.fxLayers["apotheosis-core"]?.opacity ?? 1).toBeLessThan(
        0.85
      );
      expect(sample?.metrics.fxLayers["apotheosis-core"]?.scale ?? 10).toBeLessThan(
        2
      );
    }

    await captureScreenshot(page, testInfo, `${prefix}-${snapshot.name}`);
  }

  expect(unexpectedWarnings(warnings)).toEqual([]);
}

test.describe("viewport audit visual", () => {
  test("captures deterministic desktop approval frames with scene-state assertions", async ({
    page,
  }, testInfo) => {
    test.setTimeout(240_000);
    await runFlagshipVisualAudit(
      page,
      testInfo,
      { width: 1440, height: 900 },
      "desktop"
    );
  });

  test("captures deterministic ultrawide approval frames with scene-state assertions", async ({
    page,
  }, testInfo) => {
    test.setTimeout(240_000);
    await runFlagshipVisualAudit(
      page,
      testInfo,
      { width: 1920, height: 900 },
      "ultrawide"
    );
  });
});
