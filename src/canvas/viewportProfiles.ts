"use client";

export type Vec3Tuple = readonly [number, number, number];

export interface CameraPose {
  position: Vec3Tuple;
  lookAt: Vec3Tuple;
  fov: number;
}

export interface HeroModelBehavior {
  baseScale: number;
  maxScale: number;
  fitPadding: number;
  focusOffset: Vec3Tuple;
}

export interface FxLayerBehavior {
  minimumVeilMs: number;
  settleDurationMs: number;
  stableFrames: number;
  coreScaleLimit: number;
  coreOpacity: number;
}

export type OverlayMode =
  | "orbital"
  | "grid"
  | "flow"
  | "quantum"
  | "event-horizon";

export type AmbientParticleMode = "dense" | "sparse" | "none";

export type TextLayoutMode =
  | "top-center"
  | "left-column"
  | "right-column"
  | "upper-band"
  | "lower-third";

export type TextPanelMode = "none" | "glass" | "hud" | "soft";

export type PresentationTier = "high" | "medium" | "low";

export interface ActCopy {
  eyebrow: string;
  title: string;
  subtitle: string;
  body?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export interface TextSafeZone {
  layout: TextLayoutMode;
  align: "left" | "center";
  panel: TextPanelMode;
  maxWidthRem: number;
  veilOpacity: number;
  titleScale: "display" | "feature";
}

export interface LightRig {
  fogColor: string;
  fogDensity: number;
  ambientIntensity: number;
  key: {
    color: string;
    intensity: number;
    position: Vec3Tuple;
  };
  fill: {
    color: string;
    intensity: number;
    position: Vec3Tuple;
  };
  rim: {
    color: string;
    intensity: number;
    position: Vec3Tuple;
    angle: number;
  };
}

export interface PostFxProfile {
  bloomThreshold: number;
  bloomSmoothing: number;
  bloomIntensity: number;
  vignetteOffset: number;
  vignetteDarkness: number;
  chromaticOffset: number;
}

export interface TierPresentationOverride {
  renderRange?: number;
  ambientParticleMode?: AmbientParticleMode;
  bloomIntensityMultiplier?: number;
  bloomThresholdOffset?: number;
  vignetteDarknessMultiplier?: number;
  chromaticOffsetMultiplier?: number;
}

export interface ActViewportProfile {
  id: number;
  slug: string;
  heroLabel: string;
  accent: string;
  copy: ActCopy;
  previewCamera: CameraPose;
  settleCamera: CameraPose;
  cameraPath: {
    positions: readonly Vec3Tuple[];
    lookAts: readonly Vec3Tuple[];
    fovs: readonly number[];
  };
  maxModelViewportFill: number;
  heroModelBehavior: HeroModelBehavior;
  fxLayerBehavior: FxLayerBehavior;
  textSafeZone: TextSafeZone;
  lightRig: LightRig;
  postFxProfile: PostFxProfile;
  overlayMode: OverlayMode;
  ambientParticleMode: AmbientParticleMode;
  tierOverrides: Partial<Record<PresentationTier, TierPresentationOverride>>;
}

export const STARTUP_CRITICAL_ASSETS = ["act1-dark-star"] as const;

export type StartupCriticalAsset = (typeof STARTUP_CRITICAL_ASSETS)[number];

export const ACT_VIEWPORT_PROFILES: readonly ActViewportProfile[] = [
  {
    id: 0,
    slug: "emergence",
    heroLabel: "act1-dark-star",
    accent: "#7ef2c6",
    copy: {
      eyebrow: "Act I · Emergence",
      title: "Emergence",
      subtitle: "From the void, light finds form",
      body: "Every creation begins with a single spark, then gathers mass, gravity, and intent until presence becomes unavoidable.",
    },
    previewCamera: {
      position: [0, 0.35, 7.4],
      lookAt: [0, 0.1, 0],
      fov: 44,
    },
    settleCamera: {
      position: [0.2, 0.15, 3.3],
      lookAt: [0, 0.05, 0],
      fov: 38,
    },
    cameraPath: {
      positions: [
        [0, 0.35, 7.4],
        [0.6, 0.1, 5.2],
        [0.2, 0.15, 3.3],
      ],
      lookAts: [
        [0, 0.1, 0],
        [0.1, 0.05, 0],
        [0, 0.05, 0],
      ],
      fovs: [44, 41, 38],
    },
    maxModelViewportFill: 0.74,
    heroModelBehavior: {
      baseScale: 0.34,
      maxScale: 1.9,
      fitPadding: 0.92,
      focusOffset: [0, -0.05, -0.4],
    },
    fxLayerBehavior: {
      minimumVeilMs: 900,
      settleDurationMs: 1300,
      stableFrames: 2,
      coreScaleLimit: 0.64,
      coreOpacity: 0.34,
    },
    textSafeZone: {
      layout: "top-center",
      align: "center",
      panel: "none",
      maxWidthRem: 36,
      veilOpacity: 0.24,
      titleScale: "display",
    },
    lightRig: {
      fogColor: "#040607",
      fogDensity: 0.0068,
      ambientIntensity: 0.08,
      key: {
        color: "#7ef2c6",
        intensity: 2.1,
        position: [4.5, 7, 5],
      },
      fill: {
        color: "#e8fff4",
        intensity: 0.48,
        position: [-5.5, 2.2, 3.8],
      },
      rim: {
        color: "#7ef2c6",
        intensity: 1.25,
        position: [0, 5.5, -6],
        angle: Math.PI / 5,
      },
    },
    postFxProfile: {
      bloomThreshold: 0.78,
      bloomSmoothing: 0.04,
      bloomIntensity: 1.05,
      vignetteOffset: 0.16,
      vignetteDarkness: 1.05,
      chromaticOffset: 0.00045,
    },
    overlayMode: "orbital",
    ambientParticleMode: "dense",
    tierOverrides: {
      medium: {
        ambientParticleMode: "sparse",
        bloomIntensityMultiplier: 0.72,
        chromaticOffsetMultiplier: 0,
      },
      low: {
        renderRange: 0,
        ambientParticleMode: "none",
        bloomIntensityMultiplier: 0.45,
        chromaticOffsetMultiplier: 0,
      },
    },
  },
  {
    id: 1,
    slug: "structure",
    heroLabel: "act2-globe",
    accent: "#6dc7ff",
    copy: {
      eyebrow: "Act II · Structure",
      title: "Structure",
      subtitle: "Order crystallizes from chaos",
      body: "Systems, frameworks, and signal architecture lock into place when the noise is reduced to only what matters.",
    },
    previewCamera: {
      position: [-4.4, 1.8, 9.2],
      lookAt: [2.1, 0.2, 0],
      fov: 48,
    },
    settleCamera: {
      position: [-5.8, 1.5, 6.8],
      lookAt: [2.3, 0.2, 0],
      fov: 44,
    },
    cameraPath: {
      positions: [
        [-4.4, 1.8, 9.2],
        [-6.3, 1.3, 7.6],
        [-5.8, 1.5, 6.8],
      ],
      lookAts: [
        [2.1, 0.2, 0],
        [2.4, 0.2, 0],
        [2.3, 0.2, 0],
      ],
      fovs: [48, 45, 44],
    },
    maxModelViewportFill: 0.66,
    heroModelBehavior: {
      baseScale: 0.014,
      maxScale: 0.026,
      fitPadding: 0.94,
      focusOffset: [2.1, 0.2, 0],
    },
    fxLayerBehavior: {
      minimumVeilMs: 0,
      settleDurationMs: 0,
      stableFrames: 1,
      coreScaleLimit: 1,
      coreOpacity: 1,
    },
    textSafeZone: {
      layout: "left-column",
      align: "left",
      panel: "hud",
      maxWidthRem: 28,
      veilOpacity: 0.48,
      titleScale: "display",
    },
    lightRig: {
      fogColor: "#050914",
      fogDensity: 0.0072,
      ambientIntensity: 0.11,
      key: {
        color: "#6dc7ff",
        intensity: 1.85,
        position: [7.5, 6, 3.5],
      },
      fill: {
        color: "#dff6ff",
        intensity: 0.35,
        position: [-4.5, 2.8, -3],
      },
      rim: {
        color: "#6dc7ff",
        intensity: 0.95,
        position: [0, 6.5, -7],
        angle: Math.PI / 5.4,
      },
    },
    postFxProfile: {
      bloomThreshold: 0.86,
      bloomSmoothing: 0.03,
      bloomIntensity: 0.82,
      vignetteOffset: 0.18,
      vignetteDarkness: 0.92,
      chromaticOffset: 0.00018,
    },
    overlayMode: "grid",
    ambientParticleMode: "none",
    tierOverrides: {
      medium: {
        renderRange: 0,
        bloomIntensityMultiplier: 0.7,
        chromaticOffsetMultiplier: 0,
      },
      low: {
        renderRange: 0,
        bloomIntensityMultiplier: 0.4,
        chromaticOffsetMultiplier: 0,
      },
    },
  },
  {
    id: 2,
    slug: "flow",
    heroLabel: "act3-hologram",
    accent: "#d0a2ff",
    copy: {
      eyebrow: "Act III · Flow",
      title: "Flow",
      subtitle: "Currents shape the unseen",
      body: "Once the system is tuned, movement becomes continuous, liquid, and precise instead of loud.",
    },
    previewCamera: {
      position: [-4.6, 2.1, 10],
      lookAt: [2.9, 0.6, -0.6],
      fov: 50,
    },
    settleCamera: {
      position: [-5.2, 1.6, 7.3],
      lookAt: [2.8, 0.7, -0.8],
      fov: 46,
    },
    cameraPath: {
      positions: [
        [-4.6, 2.1, 10],
        [-5.5, 1.8, 8.3],
        [-5.2, 1.6, 7.3],
      ],
      lookAts: [
        [2.9, 0.6, -0.6],
        [3, 0.7, -0.7],
        [2.8, 0.7, -0.8],
      ],
      fovs: [50, 47, 46],
    },
    maxModelViewportFill: 0.62,
    heroModelBehavior: {
      baseScale: 1.2,
      maxScale: 5.8,
      fitPadding: 0.92,
      focusOffset: [2.9, 0.6, -0.8],
    },
    fxLayerBehavior: {
      minimumVeilMs: 0,
      settleDurationMs: 0,
      stableFrames: 1,
      coreScaleLimit: 1,
      coreOpacity: 1,
    },
    textSafeZone: {
      layout: "left-column",
      align: "left",
      panel: "glass",
      maxWidthRem: 27,
      veilOpacity: 0.42,
      titleScale: "display",
    },
    lightRig: {
      fogColor: "#08050d",
      fogDensity: 0.0065,
      ambientIntensity: 0.09,
      key: {
        color: "#d0a2ff",
        intensity: 1.5,
        position: [4.2, 6.2, 3.5],
      },
      fill: {
        color: "#76d1ff",
        intensity: 0.4,
        position: [-4, 2.5, 2.8],
      },
      rim: {
        color: "#f4ddff",
        intensity: 1.2,
        position: [2, 6.5, -6],
        angle: Math.PI / 5,
      },
    },
    postFxProfile: {
      bloomThreshold: 0.74,
      bloomSmoothing: 0.035,
      bloomIntensity: 0.94,
      vignetteOffset: 0.16,
      vignetteDarkness: 0.9,
      chromaticOffset: 0.00022,
    },
    overlayMode: "flow",
    ambientParticleMode: "none",
    tierOverrides: {
      medium: {
        renderRange: 0,
        bloomIntensityMultiplier: 0.72,
        chromaticOffsetMultiplier: 0.25,
      },
      low: {
        renderRange: 0,
        bloomIntensityMultiplier: 0.45,
        chromaticOffsetMultiplier: 0,
      },
    },
  },
  {
    id: 3,
    slug: "quantum",
    heroLabel: "act4-paradox",
    accent: "#ffd06f",
    copy: {
      eyebrow: "Act IV · Quantum",
      title: "Quantum",
      subtitle: "Reality splits and recombines",
      body: "Opposites remain in suspension until the right observation forces the field to resolve with intent.",
    },
    previewCamera: {
      position: [0, 3.5, 9.2],
      lookAt: [0, 0.1, 0],
      fov: 48,
    },
    settleCamera: {
      position: [0, 2.8, 7.1],
      lookAt: [0, 0.2, 0],
      fov: 44,
    },
    cameraPath: {
      positions: [
        [0, 3.5, 9.2],
        [0.2, 2.8, 7.8],
        [0, 2.8, 7.1],
      ],
      lookAts: [
        [0, 0.1, 0],
        [0, 0.2, 0],
        [0, 0.2, 0],
      ],
      fovs: [48, 45, 44],
    },
    maxModelViewportFill: 0.74,
    heroModelBehavior: {
      baseScale: 0.25,
      maxScale: 0.95,
      fitPadding: 0.92,
      focusOffset: [0, 0.1, -0.15],
    },
    fxLayerBehavior: {
      minimumVeilMs: 0,
      settleDurationMs: 0,
      stableFrames: 1,
      coreScaleLimit: 0.58,
      coreOpacity: 0.5,
    },
    textSafeZone: {
      layout: "upper-band",
      align: "center",
      panel: "soft",
      maxWidthRem: 30,
      veilOpacity: 0.36,
      titleScale: "display",
    },
    lightRig: {
      fogColor: "#0d0a07",
      fogDensity: 0.0074,
      ambientIntensity: 0.12,
      key: {
        color: "#ffd06f",
        intensity: 1.55,
        position: [-5.6, 5.4, 4.5],
      },
      fill: {
        color: "#ff7eb3",
        intensity: 0.46,
        position: [5.6, 4.8, 4.5],
      },
      rim: {
        color: "#fff1c1",
        intensity: 1.1,
        position: [0, 6.2, -6.5],
        angle: Math.PI / 4.8,
      },
    },
    postFxProfile: {
      bloomThreshold: 0.76,
      bloomSmoothing: 0.04,
      bloomIntensity: 0.88,
      vignetteOffset: 0.2,
      vignetteDarkness: 1,
      chromaticOffset: 0.00016,
    },
    overlayMode: "quantum",
    ambientParticleMode: "sparse",
    tierOverrides: {
      medium: {
        renderRange: 0,
        bloomIntensityMultiplier: 0.72,
        ambientParticleMode: "none",
        chromaticOffsetMultiplier: 0.5,
      },
      low: {
        renderRange: 0,
        ambientParticleMode: "none",
        bloomIntensityMultiplier: 0.4,
        chromaticOffsetMultiplier: 0,
      },
    },
  },
  {
    id: 4,
    slug: "convergence",
    heroLabel: "act5-black-hole",
    accent: "#ff7eb3",
    copy: {
      eyebrow: "Act V · Convergence",
      title: "Convergence",
      subtitle: "All paths lead here",
      body: "A precise finale should feel inevitable: the field tightens, the noise falls away, and the invitation is impossible to miss.",
      ctaLabel: "Get in Touch",
      ctaHref: "mailto:hello@example.com",
    },
    previewCamera: {
      position: [0, 2.4, 8.8],
      lookAt: [0, 0.6, -0.5],
      fov: 43,
    },
    settleCamera: {
      position: [0, 1.6, 5.1],
      lookAt: [0, 0.7, -0.6],
      fov: 36,
    },
    cameraPath: {
      positions: [
        [0, 2.4, 8.8],
        [0, 1.9, 6.5],
        [0, 1.6, 5.1],
      ],
      lookAts: [
        [0, 0.6, -0.5],
        [0, 0.7, -0.55],
        [0, 0.7, -0.6],
      ],
      fovs: [43, 39, 36],
    },
    maxModelViewportFill: 0.62,
    heroModelBehavior: {
      baseScale: 0.04,
      maxScale: 0.16,
      fitPadding: 0.88,
      focusOffset: [0, 0.8, -0.7],
    },
    fxLayerBehavior: {
      minimumVeilMs: 0,
      settleDurationMs: 0,
      stableFrames: 1,
      coreScaleLimit: 0.9,
      coreOpacity: 0.52,
    },
    textSafeZone: {
      layout: "lower-third",
      align: "center",
      panel: "glass",
      maxWidthRem: 34,
      veilOpacity: 0.46,
      titleScale: "feature",
    },
    lightRig: {
      fogColor: "#0a0508",
      fogDensity: 0.0088,
      ambientIntensity: 0.07,
      key: {
        color: "#ff7eb3",
        intensity: 2.2,
        position: [0, 7, 5],
      },
      fill: {
        color: "#d0a2ff",
        intensity: 0.55,
        position: [-4.8, 2.8, 2.5],
      },
      rim: {
        color: "#ffffff",
        intensity: 1.7,
        position: [0, 7, -7],
        angle: Math.PI / 4.6,
      },
    },
    postFxProfile: {
      bloomThreshold: 0.68,
      bloomSmoothing: 0.05,
      bloomIntensity: 1.18,
      vignetteOffset: 0.12,
      vignetteDarkness: 1.28,
      chromaticOffset: 0.00052,
    },
    overlayMode: "event-horizon",
    ambientParticleMode: "sparse",
    tierOverrides: {
      medium: {
        renderRange: 0,
        ambientParticleMode: "none",
        bloomIntensityMultiplier: 0.72,
        chromaticOffsetMultiplier: 0.55,
      },
      low: {
        renderRange: 0,
        ambientParticleMode: "none",
        bloomIntensityMultiplier: 0.42,
        chromaticOffsetMultiplier: 0,
      },
    },
  },
];

export const ACT_HERO_LABELS = ACT_VIEWPORT_PROFILES.map(
  (profile) => profile.heroLabel
) as readonly string[];
