import { expect, test } from "@playwright/test";
import {
  ACT_SNAPSHOTS,
  captureScreenshot,
  sampleCanvas,
  setAuditProgress,
  unexpectedWarnings,
  waitForExperienceReady,
} from "./viewport-audit.helpers";

test.describe("viewport audit visual", () => {
  test("captures deterministic act screenshots with scene-state assertions", async ({
    page,
  }, testInfo) => {
    test.setTimeout(240_000);
    const warnings: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "warning") {
        warnings.push(msg.text());
      }
    });

    await waitForExperienceReady(page, "?audit=1");

    const firstFrame = await sampleCanvas(page);
    expect(firstFrame).not.toBeNull();
    expect(firstFrame?.isContextLost).toBeFalsy();
    expect(firstFrame?.metrics.telemetry).toBeDefined();
    expect(firstFrame?.metrics.telemetry.startupTimeMs).toBeGreaterThan(0);
    expect(firstFrame?.metrics.telemetry.hasFallbackTriggered).toBe(false);

    await captureScreenshot(page, testInfo, "normal-first-visible-frame");

    for (const snapshot of ACT_SNAPSHOTS) {
      await setAuditProgress(page, snapshot.progress);
      const sample = await sampleCanvas(page);

      expect(sample).not.toBeNull();
      expect(sample?.isContextLost).toBeFalsy();
      expect(sample?.metrics.sceneState.activeHeroLabel).toBe(snapshot.heroLabel);
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

      if (snapshot.name === "act5-entry" || snapshot.name === "wrap-rebirth") {
        expect(sample?.metrics.fxLayers["apotheosis-core"]?.opacity ?? 1).toBeLessThan(
          0.85
        );
        expect(sample?.metrics.fxLayers["apotheosis-core"]?.scale ?? 10).toBeLessThan(
          2
        );
      }

      await captureScreenshot(page, testInfo, `normal-${snapshot.name}`);
    }

    expect(unexpectedWarnings(warnings)).toEqual([]);
  });
});
