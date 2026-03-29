import { create } from "zustand";

export type QualityTier = "high" | "medium" | "low";

export interface Budgets {
  fps: number;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  programs: number;
  points: number;
  textureMemoryMB: number;
  loadTimeMs: number;
  frameTimeMs: number;
}

export interface RuntimeCaps {
  tier: QualityTier;
  isMobile: boolean;
  supportsWebGL2: boolean;
  maxParticles: number;
  enableShadows: boolean;
  enablePostProcessing: boolean;
  dpr: [number, number];
  prefersReducedMotion: boolean;
  budgets: Budgets;
}

interface CapsState {
  caps: RuntimeCaps | null;
  setCaps: (caps: RuntimeCaps) => void;
}

export const useCapsStore = create<CapsState>((set) => ({
  caps: null,
  setCaps: (caps) => set({ caps }),
}));

const QUALITY_PROFILES: Record<
  QualityTier,
  Pick<RuntimeCaps, "maxParticles" | "enableShadows" | "enablePostProcessing" | "dpr" | "budgets">
> = {
  high: {
    maxParticles: 50000,
    enableShadows: true,
    enablePostProcessing: true,
    dpr: [1, 1.15],
    budgets: {
      fps: 60,
      drawCalls: 80,
      triangles: 280000,
      geometries: 180,
      textures: 48,
      programs: 18,
      points: 75000,
      textureMemoryMB: 256,
      loadTimeMs: 10000,
      frameTimeMs: 16.6,
    },
  },
  medium: {
    maxParticles: 18000,
    enableShadows: false,
    enablePostProcessing: false,
    dpr: [0.9, 1],
    budgets: {
      fps: 60,
      drawCalls: 55,
      triangles: 180000,
      geometries: 120,
      textures: 30,
      programs: 14,
      points: 28000,
      textureMemoryMB: 128,
      loadTimeMs: 10000,
      frameTimeMs: 16.6,
    },
  },
  low: {
    maxParticles: 5000,
    enableShadows: false,
    enablePostProcessing: false,
    dpr: [0.75, 0.9],
    budgets: {
      fps: 30,
      drawCalls: 30,
      triangles: 80000,
      geometries: 72,
      textures: 18,
      programs: 10,
      points: 12000,
      textureMemoryMB: 64,
      loadTimeMs: 10000,
      frameTimeMs: 33.3,
    },
  },
};

function buildCaps(
  tier: QualityTier,
  meta: Pick<RuntimeCaps, "isMobile" | "supportsWebGL2" | "prefersReducedMotion">
): RuntimeCaps {
  const profile = QUALITY_PROFILES[tier];
  return {
    tier,
    isMobile: meta.isMobile,
    supportsWebGL2: meta.supportsWebGL2,
    prefersReducedMotion: meta.prefersReducedMotion,
    maxParticles: profile.maxParticles,
    enableShadows: profile.enableShadows,
    enablePostProcessing: profile.enablePostProcessing,
    dpr: profile.dpr,
    budgets: profile.budgets,
  };
}

function readSafeModeFlag(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const urlSafeMode = new URLSearchParams(window.location.search).get(
      "safeMode"
    );
    const storedSafeMode = window.localStorage.getItem("lpv5-safe-mode");
    return urlSafeMode === "1" || storedSafeMode === "1";
  } catch {
    return false;
  }
}

function readForcedTier(): QualityTier | null {
  if (typeof window === "undefined") return null;

  try {
    const forceTier = new URLSearchParams(window.location.search).get(
      "forceTier"
    ) as QualityTier | null;

    if (forceTier && ["high", "medium", "low"].includes(forceTier)) {
      return forceTier;
    }
  } catch {
    return null;
  }

  return null;
}

/** Release a temporary WebGL context so it doesn't count against the browser limit */
function releaseProbeContext(gl: WebGL2RenderingContext | null) {
  if (!gl) return;
  const ext = gl.getExtension("WEBGL_lose_context");
  if (ext) ext.loseContext();
}

/** Detect GPU capabilities and set quality tier */
export function detectCapabilities(): RuntimeCaps {
  if (typeof window === "undefined") {
    return defaultCaps("low");
  }

  const isMobile =
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    window.innerWidth < 768;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2");
  const supportsWebGL2 = !!gl;

  const meta = {
    isMobile,
    supportsWebGL2,
    prefersReducedMotion,
  };
  const forcedTier = readForcedTier();

  if (process.env.NODE_ENV !== "production") {
    if (forcedTier) {
      releaseProbeContext(gl);
      const caps = buildCaps(forcedTier, meta);
      // In dev mode, Turbopack JIT-compiles and serves assets on demand, so
      // model loading is significantly slower than in a production build.
      // Override the startup budget to a generous value so the StartupReadiness-
      // Gate doesn't trigger safe-mode fallback before assets finish loading.
      caps.budgets = { ...caps.budgets, loadTimeMs: 30_000 };
      return caps;
    }
    releaseProbeContext(gl);
    return buildCaps("low", meta);
  }

  if (readSafeModeFlag()) {
    releaseProbeContext(gl);
    return buildCaps("low", meta);
  }

  if (forcedTier) {
    releaseProbeContext(gl);
    return buildCaps(forcedTier, meta);
  }

  let tier: QualityTier = "medium";

  if (!supportsWebGL2 || isMobile || prefersReducedMotion) {
    tier = "low";
  } else if (gl) {
    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
    const maxRenderBufferSize = gl.getParameter(
      gl.MAX_RENDERBUFFER_SIZE
    ) as number;
    const hardwareThreads = navigator.hardwareConcurrency ?? 4;
    const mem = (navigator as { deviceMemory?: number }).deviceMemory;

    let renderer = "";
    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    if (debugInfo) {
      renderer = String(
        gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      ).toLowerCase();
    }

    const isSoftwareRenderer =
      renderer.includes("swiftshader") ||
      renderer.includes("llvmpipe") ||
      renderer.includes("software") ||
      renderer.includes("microsoft basic");

    const isWeakIntegratedGpu =
      (renderer.includes("intel(r) hd") || renderer.includes("intel(r) uhd")) &&
      !renderer.includes("iris") &&
      !renderer.includes("xe");

    const isStrongGpu =
      renderer.includes("nvidia") ||
      renderer.includes("geforce") ||
      renderer.includes("rtx") ||
      renderer.includes("radeon") ||
      renderer.includes(" arc") ||
      renderer.includes("apple m") ||
      renderer.includes("iris xe");

    const hasLowMemory = mem !== undefined && mem < 4;
    const hasHighMemory = mem === undefined || mem >= 8;
    const hasStrongNumericCaps =
      maxTextureSize >= 8192 &&
      maxRenderBufferSize >= 8192 &&
      hardwareThreads >= 8;

    if (
      isSoftwareRenderer ||
      isWeakIntegratedGpu ||
      maxTextureSize <= 4096 ||
      maxRenderBufferSize <= 4096 ||
      hardwareThreads <= 4 ||
      hasLowMemory
    ) {
      tier = "low";
    } else if (hasStrongNumericCaps && hasHighMemory && isStrongGpu) {
      tier = "high";
    } else if (hasStrongNumericCaps && hasHighMemory && !debugInfo) {
      tier = "high";
    } else if (hasStrongNumericCaps && hasHighMemory && renderer === "") {
      tier = "high";
    }
  }

  releaseProbeContext(gl);
  return buildCaps(tier, meta);
}

function defaultCaps(tier: QualityTier): RuntimeCaps {
  return buildCaps(tier, {
    isMobile: false,
    supportsWebGL2: tier !== "low",
    prefersReducedMotion: false,
  });
}
