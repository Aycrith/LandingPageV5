import { create } from "zustand";

export type QualityTier = "high" | "medium" | "low";

export interface RuntimeCaps {
  tier: QualityTier;
  isMobile: boolean;
  supportsWebGL2: boolean;
  maxParticles: number;
  enableShadows: boolean;
  enablePostProcessing: boolean;
  dpr: [number, number];
  prefersReducedMotion: boolean;
}

interface CapsState {
  caps: RuntimeCaps | null;
  setCaps: (caps: RuntimeCaps) => void;
}

export const useCapsStore = create<CapsState>((set) => ({
  caps: null,
  setCaps: (caps) => set({ caps }),
}));

/** Detect GPU capabilities and set quality tier */
export function detectCapabilities(): RuntimeCaps {
  if (typeof window === "undefined") {
    return defaultCaps("medium");
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

  let tier: QualityTier = "high";

  if (!supportsWebGL2 || isMobile || prefersReducedMotion) {
    tier = "low";
  } else if (gl) {
    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      const lowerRenderer = renderer.toLowerCase();
      if (
        lowerRenderer.includes("swiftshader") ||
        lowerRenderer.includes("llvmpipe") ||
        lowerRenderer.includes("software")
      ) {
        tier = "low";
      } else if (
        lowerRenderer.includes("intel") &&
        !lowerRenderer.includes("iris")
      ) {
        tier = "medium";
      }
    }
    const mem = (navigator as { deviceMemory?: number }).deviceMemory;
    if (mem && mem < 4) {
      tier = tier === "high" ? "medium" : tier;
    }
  }

  return {
    tier,
    isMobile,
    supportsWebGL2,
    prefersReducedMotion,
    maxParticles: tier === "high" ? 100000 : tier === "medium" ? 50000 : 15000,
    enableShadows: tier !== "low",
    enablePostProcessing: tier !== "low",
    dpr: tier === "high" ? [1, 2] : tier === "medium" ? [1, 1.5] : [1, 1],
  };
}

function defaultCaps(tier: QualityTier): RuntimeCaps {
  return {
    tier,
    isMobile: false,
    supportsWebGL2: true,
    prefersReducedMotion: false,
    maxParticles: 50000,
    enableShadows: true,
    enablePostProcessing: true,
    dpr: [1, 1.5],
  };
}
