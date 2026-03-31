import type { Page, TestInfo } from "@playwright/test";

// NOTE: Transparent mesh counts were recalibrated after the PBR optimization pass
// (adaptive LOD, MeshPhysicalMaterial upgrade). All hero materials are now
// MeshPhysicalMaterial and are counted as transparent during cross-fade transitions.
// These thresholds give ~40% headroom above the measured 119-mesh steady-state
// baseline so genuine regressions still trip the guard.
//
// Progress values are calibrated to the first half of each act so the active hero
// has strong weight (≥0.7). scrollStore uses NUM_ACTS=6, so act N spans [N/6, (N+1)/6].
// Sampling at (N + 0.3)/6 gives actProgress≈0.3 → currentWeight≈0.74.
// Act 4 (apotheosis) = WORLD_PHASES[4], not act 5 which is QuantumConsciousness.
export const ACT_SNAPSHOTS = [
  {
    name: "act1-entry",
    progress: 0.05,
    heroLabel: "seed-core",
    heroAsset: "dark_star",
    maxTransparentCount: 170,
    containsActs: [0, 1],
  },
  {
    name: "act2-entry",
    progress: 0.22,
    heroLabel: "scaffold-shell",
    heroAsset: "wireframe_globe",
    maxTransparentCount: 170,
    containsActs: [1, 2],
  },
  {
    name: "act3-entry",
    progress: 0.38,
    heroLabel: "circulation-core",
    heroAsset: "hologram",
    maxTransparentCount: 170,
    containsActs: [2, 3],
  },
  {
    name: "act4-entry",
    progress: 0.55,
    heroLabel: "sentience-bridge",
    heroAsset: "quantum_leap",
    maxTransparentCount: 170,
    containsActs: [3, 4],
  },
  {
    name: "act5-entry",
    progress: 0.72,
    heroLabel: "apotheosis-crown",
    heroAsset: "black_hole",
    maxTransparentCount: 170,
    containsActs: [4, 5],
  },
] as const;

const AUDIT_BASE_URL = "http://localhost:3100";
export const FLAGSHIP_AUDIT_QUERY = "?audit=1&forceTier=high";
const STARTUP_READY_TIMEOUT_MS = 120_000;

export async function waitForExperienceReady(page: Page, search = "") {
  await page.goto(`${AUDIT_BASE_URL}/${search}`);
  await page.waitForFunction(() => window.__LPV5_VIEWPORT_AUDIT__ != null, undefined, {
    polling: 100,
    timeout: STARTUP_READY_TIMEOUT_MS,
  });
  await page.waitForFunction(
    () => document.querySelector(".loading-screen") === null,
    undefined,
    { polling: 100, timeout: STARTUP_READY_TIMEOUT_MS }
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
      warning.includes("THREE.WebGLRenderer: KHR_parallel_shader_compile extension not supported.")
    ) {
      return false;
    }

    if (
      warning.includes("[StartupReadinessGate] Critical assets timed out") ||
      warning.includes("[StartupReadinessGate] Startup pipeline timed out") ||
      warning.includes("[StartupReadinessGate] Stable frames timed out")
    ) {
      return false;
    }

    return true;
  });
}
