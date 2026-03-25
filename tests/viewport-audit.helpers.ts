import type { Page, TestInfo } from "@playwright/test";

export const ACT_SNAPSHOTS = [
  {
    name: "act1-entry",
    progress: 0.06,
    heroLabel: "act1-dark-star",
    maxTransparentCount: 32,
  },
  {
    name: "act2-entry",
    progress: 0.26,
    heroLabel: "act2-globe",
    maxTransparentCount: 26,
  },
  {
    name: "act3-entry",
    progress: 0.46,
    heroLabel: "act3-hologram",
    maxTransparentCount: 24,
  },
  {
    name: "act4-entry",
    progress: 0.66,
    heroLabel: "act4-paradox",
    maxTransparentCount: 28,
  },
  {
    name: "act5-entry",
    progress: 0.86,
    heroLabel: "act5-black-hole",
    maxTransparentCount: 22,
  },
] as const;

export async function waitForExperienceReady(page: Page, search = "") {
  await page.goto(`/${search}`);
  await page.waitForFunction(() => window.__LPV5_VIEWPORT_AUDIT__ != null);
  await page.waitForFunction(
    () => document.querySelector(".loading-screen") === null,
    undefined,
    { timeout: 30_000 }
  );
  await page.waitForTimeout(400);
}

export async function setAuditProgress(page: Page, progress: number) {
  await page.evaluate((nextProgress) => {
    const auditWindow = window as Window & {
      __LPV5_VIEWPORT_AUDIT__?: {
        setProgress: (progress: number) => void;
      };
    };
    auditWindow.__LPV5_VIEWPORT_AUDIT__?.setProgress(nextProgress);
  }, progress);
  await page.waitForTimeout(1_100);
}

export async function captureScreenshot(
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

export async function sampleCanvas(page: Page) {
  return await page.evaluate(() => {
    const auditWindow = window as Window & {
      __LPV5_VIEWPORT_AUDIT__?: {
        getMetrics: () => unknown;
        getState: () => unknown;
      };
      __R3F_TELEMETRY?: () => unknown;
    };
    const canvas = document.querySelector("canvas");
    const gl = canvas?.getContext("webgl2") ?? canvas?.getContext("webgl");
    const auditApi = auditWindow.__LPV5_VIEWPORT_AUDIT__;
    const telemetry =
      typeof auditWindow.__R3F_TELEMETRY === "function"
        ? auditWindow.__R3F_TELEMETRY()
        : null;

    if (!canvas || !gl || !auditApi) {
      return null;
    }

    return {
      isContextLost: gl.isContextLost(),
      metrics: auditApi.getMetrics(),
      scrollState: auditApi.getState(),
      telemetry,
    };
  });
}

export async function sampleHeap(page: Page) {
  return await page.evaluate(() => {
    // @ts-expect-error usedJSHeapSize is a non-standard property
    if (!("memory" in performance) || !performance.memory || !performance.memory.usedJSHeapSize) {
      return null;
    }

    // @ts-expect-error usedJSHeapSize is a non-standard property
    return performance.memory.usedJSHeapSize as number;
  });
}

export function unexpectedWarnings(warnings: string[]) {
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

    if (
      warning.includes("[StartupReadinessGate] Critical assets timed out") ||
      warning.includes("[StartupReadinessGate] Stable frames timed out")
    ) {
      return false;
    }

    return true;
  });
}
