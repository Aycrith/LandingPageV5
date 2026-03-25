"use client";

export type Vec3Tuple = readonly [number, number, number];

export interface CameraPose {
  position: Vec3Tuple;
  lookAt: Vec3Tuple;
  fov: number;
}

export type AssetDisposition = "keep" | "rebuild" | "replace" | "remove";
export type HeroAssetId =
  | "dark_star"
  | "wireframe_globe"
  | "hologram"
  | "quantum_leap"
  | "paradox_abstract"
  | "black_hole";
export type HeroVariant =
  | "singularity"
  | "orbital-shell"
  | "hologram"
  | "paired-sentience"
  | "event-horizon";
export type SupportFxPreset =
  | "seed-rings"
  | "scaffold-lattice"
  | "circulation-stream"
  | "sentience-bridge"
  | "apotheosis-crown";

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
  | "seed"
  | "scaffold"
  | "circulation"
  | "sentience"
  | "apotheosis";

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
  exposure: number;
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
  practical: {
    color: string;
    intensity: number;
    position: Vec3Tuple;
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

export interface MaterialGradeProfile {
  coreColor: string;
  coreEmissive: string;
  shellColor: string;
  shellEmissive: string;
  conduitColor: string;
  membraneColor: string;
  uiColor: string;
  alloyMetalness: number;
  alloyRoughness: number;
  glassTransmission: number;
  membraneTransmission: number;
  emissiveBoost: number;
}

export interface VolumetricUIRig {
  anchor: Vec3Tuple;
  railOffset: Vec3Tuple;
  titleSize: number;
  subtitleSize: number;
  bodySize: number;
  maxWidth: number;
  depthLimit: number;
  faceCameraStrength: number;
  ctaAnchor: Vec3Tuple;
}

export interface MotionRig {
  metabolism: number;
  pulse: number;
  drift: number;
  pointerInfluence: number;
}

export interface TransitionRig {
  enter: number;
  exit: number;
  rebirth: number;
}

export interface FogProfile {
  color: string;
  secondaryColor: string;
  layerOpacity: number;
  foregroundOpacity: number;
  scale: number;
  drift: number;
}

export interface ShadowProfile {
  enabled: boolean;
  receiverY: number;
  radius: number;
  opacity: number;
}

export interface ReferenceFrame {
  pack: string;
  image: string;
}

export interface CompositionZone {
  heroOffset: Vec3Tuple;
  uiOffset: Vec3Tuple;
  safeRadius: number;
}

export interface VisualQaProfile {
  expectedHeroAsset: HeroAssetId;
  approvedSupportLayers: string[];
  maxTransparentCount: number;
  protectedUiZone: TextLayoutMode;
}

export interface WorldPhaseProfile {
  id: number;
  slug: string;
  heroLabel: string;
  heroAsset: HeroAssetId;
  heroVariant: HeroVariant;
  supportFxPreset: SupportFxPreset;
  accent: string;
  copy: ActCopy;
  previewCamera: CameraPose;
  settleCamera: CameraPose;
  cameraPath: {
    positions: readonly Vec3Tuple[];
    lookAts: readonly Vec3Tuple[];
    fovs: readonly number[];
  };
  worldAnchor: Vec3Tuple;
  stageVolume: {
    radius: number;
    depth: number;
    height: number;
  };
  cameraRailSegment: CameraPose;
  heroRig: {
    rawHeight: number;
    coreScale: number;
    shellRadius: number;
    conduitSpread: number;
    splitDistance: number;
    crownRadius: number;
  };
  materialGrade: MaterialGradeProfile;
  lightingRig: LightRig;
  fogProfile: FogProfile;
  shadowProfile: ShadowProfile;
  uiRig: VolumetricUIRig;
  referenceFrame: ReferenceFrame;
  compositionZone: CompositionZone;
  motionRig: MotionRig;
  transitionRig: TransitionRig;
  assetDisposition: Record<string, AssetDisposition>;
  visualQa: VisualQaProfile;
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

export type ActViewportProfile = WorldPhaseProfile;

const BASE_DISPOSITIONS: Record<string, AssetDisposition> = {
  dark_star: "rebuild",
  black_hole: "rebuild",
  wireframe_globe: "replace",
  satellites: "remove",
  hologram_shell: "replace",
  paradox_lattice: "replace",
  ribbon_tubes: "remove",
  grid_overlay: "remove",
  shader_lines: "remove",
  floor_disk: "remove",
};

function createMaterialGrade(
  partial: Partial<MaterialGradeProfile>
): MaterialGradeProfile {
  return {
    coreColor: "#040506",
    coreEmissive: "#d8fbff",
    shellColor: "#5ec9dd",
    shellEmissive: "#99f0ff",
    conduitColor: "#8ce2ff",
    membraneColor: "#8ef3db",
    uiColor: "#f5fbff",
    alloyMetalness: 0.88,
    alloyRoughness: 0.2,
    glassTransmission: 0.84,
    membraneTransmission: 0.38,
    emissiveBoost: 1,
    ...partial,
  };
}

function createTierOverrides(): Partial<Record<PresentationTier, TierPresentationOverride>> {
  return {
    high: {
      renderRange: 1,
      ambientParticleMode: "sparse",
      bloomIntensityMultiplier: 1,
      chromaticOffsetMultiplier: 0,
    },
    medium: {
      renderRange: 0,
      ambientParticleMode: "sparse",
      bloomIntensityMultiplier: 0.84,
      chromaticOffsetMultiplier: 0,
    },
    low: {
      renderRange: 0,
      ambientParticleMode: "none",
      bloomIntensityMultiplier: 0.52,
      chromaticOffsetMultiplier: 0,
    },
  };
}

export const STARTUP_CRITICAL_ASSETS = ["seed-core"] as const;

export type StartupCriticalAsset = (typeof STARTUP_CRITICAL_ASSETS)[number];

const BASE_WORLD_PHASES = [
  {
    id: 0,
    slug: "seed",
    heroLabel: "seed-core",
    accent: "#8af4dd",
    copy: {
      eyebrow: "Phase I · Seed",
      title: "Seed",
      subtitle: "Silence condenses into intention",
      body: "A singular core hangs in a near-black chamber while the first traces of structure gather around it.",
    },
    previewCamera: {
      position: [0.12, 0.3, 7.4],
      lookAt: [0, 0, 0],
      fov: 36,
    },
    settleCamera: {
      position: [0.08, 0.18, 5.1],
      lookAt: [0, 0, -0.2],
      fov: 30,
    },
    cameraPath: {
      positions: [
        [0.12, 0.3, 7.4],
        [0.24, 0.18, 5.9],
        [0.08, 0.18, 5.1],
      ],
      lookAts: [
        [0, 0, 0],
        [0.06, 0, -0.16],
        [0, 0, -0.2],
      ],
      fovs: [36, 32, 30],
    },
    worldAnchor: [0, 0, -0.2],
    stageVolume: {
      radius: 4.8,
      depth: 11,
      height: 6.4,
    },
    cameraRailSegment: {
      position: [0.08, 0.18, 5.1],
      lookAt: [0, 0, -0.2],
      fov: 30,
    },
    heroRig: {
      rawHeight: 2.1,
      coreScale: 1.12,
      shellRadius: 1.6,
      conduitSpread: 1.8,
      splitDistance: 1.5,
      crownRadius: 2.1,
    },
    materialGrade: createMaterialGrade({
      coreEmissive: "#dfffee",
      shellColor: "#77e8d2",
      shellEmissive: "#9cf7de",
      conduitColor: "#8bf2d6",
      membraneColor: "#6fcfb7",
      emissiveBoost: 0.9,
    }),
    lightingRig: {
      exposure: 0.92,
      fogColor: "#020405",
      fogDensity: 0.028,
      ambientIntensity: 0.1,
      key: {
        color: "#8af4dd",
        intensity: 3.2,
        position: [3.4, 4.8, 5.5],
      },
      fill: {
        color: "#d8fffb",
        intensity: 0.55,
        position: [-4.2, 1.4, 3.8],
      },
      rim: {
        color: "#8af4dd",
        intensity: 2.1,
        position: [0, 4.2, -6.8],
        angle: Math.PI / 6,
      },
      practical: {
        color: "#b2fff1",
        intensity: 5.6,
        position: [0, 0.3, -0.5],
      },
    },
    uiRig: {
      anchor: [0, 1.65, 0.8],
      railOffset: [-2.2, 0.15, 0.3],
      titleSize: 0.5,
      subtitleSize: 0.12,
      bodySize: 0.1,
      maxWidth: 4.2,
      depthLimit: 8.4,
      faceCameraStrength: 0.88,
      ctaAnchor: [0, -1.3, 1.1],
    },
    motionRig: {
      metabolism: 0.34,
      pulse: 0.62,
      drift: 0.12,
      pointerInfluence: 0.1,
    },
    transitionRig: {
      enter: 0.18,
      exit: 0.84,
      rebirth: 0.95,
    },
    assetDisposition: {
      ...BASE_DISPOSITIONS,
      dark_star: "rebuild",
    },
    maxModelViewportFill: 0.64,
    heroModelBehavior: {
      baseScale: 1.02,
      maxScale: 1.22,
      fitPadding: 0.92,
      focusOffset: [0, 0, -0.2],
    },
    fxLayerBehavior: {
      minimumVeilMs: 900,
      settleDurationMs: 1200,
      stableFrames: 2,
      coreScaleLimit: 0.56,
      coreOpacity: 0.2,
    },
    textSafeZone: {
      layout: "top-center",
      align: "center",
      panel: "none",
      maxWidthRem: 0,
      veilOpacity: 0,
      titleScale: "display",
    },
    lightRig: {
      exposure: 0.92,
      fogColor: "#020405",
      fogDensity: 0.028,
      ambientIntensity: 0.1,
      key: {
        color: "#8af4dd",
        intensity: 3.2,
        position: [3.4, 4.8, 5.5],
      },
      fill: {
        color: "#d8fffb",
        intensity: 0.55,
        position: [-4.2, 1.4, 3.8],
      },
      rim: {
        color: "#8af4dd",
        intensity: 2.1,
        position: [0, 4.2, -6.8],
        angle: Math.PI / 6,
      },
      practical: {
        color: "#b2fff1",
        intensity: 5.6,
        position: [0, 0.3, -0.5],
      },
    },
    postFxProfile: {
      bloomThreshold: 0.9,
      bloomSmoothing: 0.035,
      bloomIntensity: 0.42,
      vignetteOffset: 0.2,
      vignetteDarkness: 0.72,
      chromaticOffset: 0,
    },
    overlayMode: "seed",
    ambientParticleMode: "sparse",
    tierOverrides: createTierOverrides(),
  },
  {
    id: 1,
    slug: "scaffold",
    heroLabel: "scaffold-shell",
    accent: "#8cc9ff",
    copy: {
      eyebrow: "Phase II · Scaffold",
      title: "Scaffold",
      subtitle: "Thin structure learns to hold pressure",
      body: "The shell opens around the same core as smoked glass ribs and living alloy begin to frame the volume.",
    },
    previewCamera: {
      position: [0.65, 0.42, 6.1],
      lookAt: [0.2, 0.05, -0.25],
      fov: 31,
    },
    settleCamera: {
      position: [0.82, 0.34, 5.45],
      lookAt: [0.28, 0.02, -0.3],
      fov: 29,
    },
    cameraPath: {
      positions: [
        [0.42, 0.36, 5.9],
        [0.64, 0.38, 5.6],
        [0.82, 0.34, 5.45],
      ],
      lookAts: [
        [0.1, 0.04, -0.24],
        [0.22, 0.03, -0.28],
        [0.28, 0.02, -0.3],
      ],
      fovs: [30, 29.5, 29],
    },
    worldAnchor: [0.18, 0, -0.24],
    stageVolume: {
      radius: 5.4,
      depth: 12.5,
      height: 6.6,
    },
    cameraRailSegment: {
      position: [0.82, 0.34, 5.45],
      lookAt: [0.28, 0.02, -0.3],
      fov: 29,
    },
    heroRig: {
      rawHeight: 3.4,
      coreScale: 1.02,
      shellRadius: 2.4,
      conduitSpread: 2.2,
      splitDistance: 1.8,
      crownRadius: 2.2,
    },
    materialGrade: createMaterialGrade({
      coreEmissive: "#e0f4ff",
      shellColor: "#6da7d6",
      shellEmissive: "#8cc9ff",
      conduitColor: "#8cc9ff",
      membraneColor: "#bde6ff",
      uiColor: "#eef7ff",
    }),
    lightingRig: {
      exposure: 0.98,
      fogColor: "#04070d",
      fogDensity: 0.022,
      ambientIntensity: 0.12,
      key: {
        color: "#8cc9ff",
        intensity: 3.5,
        position: [4.6, 4.4, 5.1],
      },
      fill: {
        color: "#eff7ff",
        intensity: 0.7,
        position: [-3.8, 1.2, 4.5],
      },
      rim: {
        color: "#9bddff",
        intensity: 2.4,
        position: [-1.4, 5.3, -6.4],
        angle: Math.PI / 5.4,
      },
      practical: {
        color: "#9fd6ff",
        intensity: 6.6,
        position: [0.6, 0.2, -0.6],
      },
    },
    uiRig: {
      anchor: [-2.25, 1.22, 1],
      railOffset: [-3.1, 0.28, 0.3],
      titleSize: 0.46,
      subtitleSize: 0.115,
      bodySize: 0.095,
      maxWidth: 3.8,
      depthLimit: 8.6,
      faceCameraStrength: 0.84,
      ctaAnchor: [0, -1.3, 1.2],
    },
    motionRig: {
      metabolism: 0.42,
      pulse: 0.48,
      drift: 0.18,
      pointerInfluence: 0.12,
    },
    transitionRig: {
      enter: 0.12,
      exit: 0.88,
      rebirth: 0,
    },
    assetDisposition: {
      ...BASE_DISPOSITIONS,
      wireframe_globe: "replace",
      satellites: "remove",
    },
    maxModelViewportFill: 0.58,
    heroModelBehavior: {
      baseScale: 1,
      maxScale: 1.18,
      fitPadding: 0.92,
      focusOffset: [0.18, 0, -0.24],
    },
    fxLayerBehavior: {
      minimumVeilMs: 0,
      settleDurationMs: 0,
      stableFrames: 1,
      coreScaleLimit: 0.58,
      coreOpacity: 0.18,
    },
    textSafeZone: {
      layout: "left-column",
      align: "left",
      panel: "none",
      maxWidthRem: 0,
      veilOpacity: 0,
      titleScale: "feature",
    },
    lightRig: {
      exposure: 0.98,
      fogColor: "#04070d",
      fogDensity: 0.022,
      ambientIntensity: 0.12,
      key: {
        color: "#8cc9ff",
        intensity: 3.5,
        position: [4.6, 4.4, 5.1],
      },
      fill: {
        color: "#eff7ff",
        intensity: 0.7,
        position: [-3.8, 1.2, 4.5],
      },
      rim: {
        color: "#9bddff",
        intensity: 2.4,
        position: [-1.4, 5.3, -6.4],
        angle: Math.PI / 5.4,
      },
      practical: {
        color: "#9fd6ff",
        intensity: 6.6,
        position: [0.6, 0.2, -0.6],
      },
    },
    postFxProfile: {
      bloomThreshold: 0.92,
      bloomSmoothing: 0.03,
      bloomIntensity: 0.36,
      vignetteOffset: 0.22,
      vignetteDarkness: 0.68,
      chromaticOffset: 0,
    },
    overlayMode: "scaffold",
    ambientParticleMode: "sparse",
    tierOverrides: createTierOverrides(),
  },
  {
    id: 2,
    slug: "circulation",
    heroLabel: "circulation-core",
    accent: "#83f3f0",
    copy: {
      eyebrow: "Phase III · Circulation",
      title: "Circulation",
      subtitle: "Energy learns to travel with intent",
      body: "A corridor of membrane conduits pulls the world forward while the core remains anchored inside the same living frame.",
    },
    previewCamera: {
      position: [0.2, 0.28, 6.5],
      lookAt: [0.22, 0, -0.9],
      fov: 31,
    },
    settleCamera: {
      position: [0.18, 0.18, 5.8],
      lookAt: [0.28, 0, -1.05],
      fov: 28,
    },
    cameraPath: {
      positions: [
        [0.76, 0.3, 5.5],
        [0.48, 0.24, 5.7],
        [0.18, 0.18, 5.8],
      ],
      lookAts: [
        [0.34, 0.01, -0.42],
        [0.28, 0, -0.72],
        [0.28, 0, -1.05],
      ],
      fovs: [29, 28.5, 28],
    },
    worldAnchor: [0.28, 0, -0.82],
    stageVolume: {
      radius: 6.4,
      depth: 15,
      height: 6.8,
    },
    cameraRailSegment: {
      position: [0.18, 0.18, 5.8],
      lookAt: [0.28, 0, -1.05],
      fov: 28,
    },
    heroRig: {
      rawHeight: 3.2,
      coreScale: 1.04,
      shellRadius: 2.1,
      conduitSpread: 3.2,
      splitDistance: 2.2,
      crownRadius: 2.3,
    },
    materialGrade: createMaterialGrade({
      coreEmissive: "#c9fff9",
      shellColor: "#77cbc7",
      shellEmissive: "#83f3f0",
      conduitColor: "#83f3f0",
      membraneColor: "#75d5d1",
      uiColor: "#efffff",
      alloyRoughness: 0.24,
    }),
    lightingRig: {
      exposure: 0.96,
      fogColor: "#020609",
      fogDensity: 0.02,
      ambientIntensity: 0.1,
      key: {
        color: "#83f3f0",
        intensity: 3.2,
        position: [3.8, 4.1, 5.8],
      },
      fill: {
        color: "#e4fffb",
        intensity: 0.62,
        position: [-3.2, 0.8, 5.2],
      },
      rim: {
        color: "#7af0da",
        intensity: 2.1,
        position: [0, 4.8, -7.6],
        angle: Math.PI / 5.2,
      },
      practical: {
        color: "#9efdfa",
        intensity: 5.8,
        position: [0.2, 0.1, -1.2],
      },
    },
    uiRig: {
      anchor: [-2.4, 1.05, 0.9],
      railOffset: [-3.2, 0.18, 0.22],
      titleSize: 0.44,
      subtitleSize: 0.11,
      bodySize: 0.09,
      maxWidth: 3.7,
      depthLimit: 9.6,
      faceCameraStrength: 0.78,
      ctaAnchor: [0, -1.25, 1.2],
    },
    motionRig: {
      metabolism: 0.48,
      pulse: 0.54,
      drift: 0.26,
      pointerInfluence: 0.14,
    },
    transitionRig: {
      enter: 0.1,
      exit: 0.88,
      rebirth: 0,
    },
    assetDisposition: {
      ...BASE_DISPOSITIONS,
      hologram_shell: "replace",
      ribbon_tubes: "remove",
    },
    maxModelViewportFill: 0.56,
    heroModelBehavior: {
      baseScale: 1,
      maxScale: 1.16,
      fitPadding: 0.92,
      focusOffset: [0.28, 0, -0.82],
    },
    fxLayerBehavior: {
      minimumVeilMs: 0,
      settleDurationMs: 0,
      stableFrames: 1,
      coreScaleLimit: 0.58,
      coreOpacity: 0.16,
    },
    textSafeZone: {
      layout: "left-column",
      align: "left",
      panel: "none",
      maxWidthRem: 0,
      veilOpacity: 0,
      titleScale: "feature",
    },
    lightRig: {
      exposure: 0.96,
      fogColor: "#020609",
      fogDensity: 0.02,
      ambientIntensity: 0.1,
      key: {
        color: "#83f3f0",
        intensity: 3.2,
        position: [3.8, 4.1, 5.8],
      },
      fill: {
        color: "#e4fffb",
        intensity: 0.62,
        position: [-3.2, 0.8, 5.2],
      },
      rim: {
        color: "#7af0da",
        intensity: 2.1,
        position: [0, 4.8, -7.6],
        angle: Math.PI / 5.2,
      },
      practical: {
        color: "#9efdfa",
        intensity: 5.8,
        position: [0.2, 0.1, -1.2],
      },
    },
    postFxProfile: {
      bloomThreshold: 0.93,
      bloomSmoothing: 0.03,
      bloomIntensity: 0.34,
      vignetteOffset: 0.24,
      vignetteDarkness: 0.64,
      chromaticOffset: 0,
    },
    overlayMode: "circulation",
    ambientParticleMode: "sparse",
    tierOverrides: createTierOverrides(),
  },
  {
    id: 3,
    slug: "sentience",
    heroLabel: "sentience-bridge",
    accent: "#c8a8ff",
    copy: {
      eyebrow: "Phase IV · Sentience",
      title: "Sentience",
      subtitle: "The system becomes aware of itself",
      body: "One core becomes two poles, separated with intent and held together by a precise living bridge.",
    },
    previewCamera: {
      position: [-0.26, 0.42, 6.2],
      lookAt: [0, 0.05, -0.55],
      fov: 32,
    },
    settleCamera: {
      position: [-0.32, 0.28, 5.4],
      lookAt: [0, 0.05, -0.58],
      fov: 29,
    },
    cameraPath: {
      positions: [
        [0.12, 0.18, 5.8],
        [-0.12, 0.32, 5.55],
        [-0.32, 0.28, 5.4],
      ],
      lookAts: [
        [0.22, 0, -0.9],
        [0.04, 0.04, -0.66],
        [0, 0.05, -0.58],
      ],
      fovs: [28.4, 29, 29],
    },
    worldAnchor: [0, 0.05, -0.56],
    stageVolume: {
      radius: 5.8,
      depth: 13.5,
      height: 7,
    },
    cameraRailSegment: {
      position: [-0.32, 0.28, 5.4],
      lookAt: [0, 0.05, -0.58],
      fov: 29,
    },
    heroRig: {
      rawHeight: 3.7,
      coreScale: 1.02,
      shellRadius: 2.2,
      conduitSpread: 2.4,
      splitDistance: 2.36,
      crownRadius: 2.45,
    },
    materialGrade: createMaterialGrade({
      coreEmissive: "#f2ddff",
      shellColor: "#9671d4",
      shellEmissive: "#c8a8ff",
      conduitColor: "#f6c86a",
      membraneColor: "#b08ce8",
      uiColor: "#f8f2ff",
      emissiveBoost: 1.06,
    }),
    lightingRig: {
      exposure: 1,
      fogColor: "#07050c",
      fogDensity: 0.024,
      ambientIntensity: 0.11,
      key: {
        color: "#c8a8ff",
        intensity: 3.4,
        position: [4.2, 4.6, 4.4],
      },
      fill: {
        color: "#ffd898",
        intensity: 0.65,
        position: [-3.6, 1.1, 4.8],
      },
      rim: {
        color: "#f6c86a",
        intensity: 2.2,
        position: [0, 4.8, -7.1],
        angle: Math.PI / 5.6,
      },
      practical: {
        color: "#cfb2ff",
        intensity: 6.2,
        position: [0, 0.4, -0.9],
      },
    },
    uiRig: {
      anchor: [0, 1.5, 1.06],
      railOffset: [-2.4, 0.1, 0.28],
      titleSize: 0.45,
      subtitleSize: 0.112,
      bodySize: 0.092,
      maxWidth: 4,
      depthLimit: 8.8,
      faceCameraStrength: 0.82,
      ctaAnchor: [0, -1.22, 1.15],
    },
    motionRig: {
      metabolism: 0.56,
      pulse: 0.58,
      drift: 0.18,
      pointerInfluence: 0.16,
    },
    transitionRig: {
      enter: 0.12,
      exit: 0.9,
      rebirth: 0,
    },
    assetDisposition: {
      ...BASE_DISPOSITIONS,
      paradox_lattice: "replace",
    },
    maxModelViewportFill: 0.58,
    heroModelBehavior: {
      baseScale: 1,
      maxScale: 1.16,
      fitPadding: 0.92,
      focusOffset: [0, 0.05, -0.56],
    },
    fxLayerBehavior: {
      minimumVeilMs: 0,
      settleDurationMs: 0,
      stableFrames: 1,
      coreScaleLimit: 0.6,
      coreOpacity: 0.18,
    },
    textSafeZone: {
      layout: "upper-band",
      align: "center",
      panel: "none",
      maxWidthRem: 0,
      veilOpacity: 0,
      titleScale: "feature",
    },
    lightRig: {
      exposure: 1,
      fogColor: "#07050c",
      fogDensity: 0.024,
      ambientIntensity: 0.11,
      key: {
        color: "#c8a8ff",
        intensity: 3.4,
        position: [4.2, 4.6, 4.4],
      },
      fill: {
        color: "#ffd898",
        intensity: 0.65,
        position: [-3.6, 1.1, 4.8],
      },
      rim: {
        color: "#f6c86a",
        intensity: 2.2,
        position: [0, 4.8, -7.1],
        angle: Math.PI / 5.6,
      },
      practical: {
        color: "#cfb2ff",
        intensity: 6.2,
        position: [0, 0.4, -0.9],
      },
    },
    postFxProfile: {
      bloomThreshold: 0.93,
      bloomSmoothing: 0.03,
      bloomIntensity: 0.38,
      vignetteOffset: 0.22,
      vignetteDarkness: 0.66,
      chromaticOffset: 0,
    },
    overlayMode: "sentience",
    ambientParticleMode: "sparse",
    tierOverrides: createTierOverrides(),
  },
  {
    id: 4,
    slug: "apotheosis",
    heroLabel: "apotheosis-crown",
    accent: "#ffd2f0",
    copy: {
      eyebrow: "Phase V · Apotheosis",
      title: "Apotheosis",
      subtitle: "The world blooms, then folds back into origin",
      body: "The crown opens into an event-horizon bloom, peaks cleanly, and begins its collapse toward rebirth.",
      ctaLabel: "Enter The Signal",
      ctaHref: "https://example.com",
    },
    previewCamera: {
      position: [-0.22, 0.5, 6.4],
      lookAt: [0, 0.08, -0.5],
      fov: 33,
    },
    settleCamera: {
      position: [-0.08, 0.34, 5.2],
      lookAt: [0, 0.08, -0.38],
      fov: 29,
    },
    cameraPath: {
      positions: [
        [-0.36, 0.32, 5.55],
        [-0.24, 0.38, 5.3],
        [-0.08, 0.34, 5.2],
      ],
      lookAts: [
        [0, 0.06, -0.48],
        [0, 0.08, -0.42],
        [0, 0.08, -0.38],
      ],
      fovs: [29.5, 29.2, 29],
    },
    worldAnchor: [0, 0.08, -0.4],
    stageVolume: {
      radius: 6.2,
      depth: 14.2,
      height: 7.2,
    },
    cameraRailSegment: {
      position: [-0.08, 0.34, 5.2],
      lookAt: [0, 0.08, -0.38],
      fov: 29,
    },
    heroRig: {
      rawHeight: 4.4,
      coreScale: 1.08,
      shellRadius: 2.5,
      conduitSpread: 2.6,
      splitDistance: 2.3,
      crownRadius: 3.05,
    },
    materialGrade: createMaterialGrade({
      coreEmissive: "#fff2fa",
      shellColor: "#bf6f9f",
      shellEmissive: "#ffd2f0",
      conduitColor: "#ffd2f0",
      membraneColor: "#f6a9db",
      uiColor: "#fff7fc",
      emissiveBoost: 1.08,
    }),
    lightingRig: {
      exposure: 1.02,
      fogColor: "#08050a",
      fogDensity: 0.026,
      ambientIntensity: 0.1,
      key: {
        color: "#ffd2f0",
        intensity: 3.7,
        position: [3.2, 4.5, 5.6],
      },
      fill: {
        color: "#fff6fb",
        intensity: 0.72,
        position: [-3.8, 1.2, 4.4],
      },
      rim: {
        color: "#f7a4d6",
        intensity: 2.4,
        position: [0, 5.1, -7.2],
        angle: Math.PI / 5.4,
      },
      practical: {
        color: "#ffdff4",
        intensity: 7.2,
        position: [0, 0.55, -0.75],
      },
    },
    uiRig: {
      anchor: [0, -1.2, 1.32],
      railOffset: [-2.2, -1.35, 0.4],
      titleSize: 0.48,
      subtitleSize: 0.112,
      bodySize: 0.094,
      maxWidth: 4.2,
      depthLimit: 8.5,
      faceCameraStrength: 0.86,
      ctaAnchor: [0, -2.05, 1.22],
    },
    motionRig: {
      metabolism: 0.62,
      pulse: 0.68,
      drift: 0.14,
      pointerInfluence: 0.16,
    },
    transitionRig: {
      enter: 0.14,
      exit: 0.9,
      rebirth: 0.82,
    },
    assetDisposition: {
      ...BASE_DISPOSITIONS,
      black_hole: "rebuild",
    },
    maxModelViewportFill: 0.6,
    heroModelBehavior: {
      baseScale: 1.02,
      maxScale: 1.24,
      fitPadding: 0.92,
      focusOffset: [0, 0.08, -0.4],
    },
    fxLayerBehavior: {
      minimumVeilMs: 0,
      settleDurationMs: 0,
      stableFrames: 1,
      coreScaleLimit: 0.62,
      coreOpacity: 0.2,
    },
    textSafeZone: {
      layout: "lower-third",
      align: "center",
      panel: "none",
      maxWidthRem: 0,
      veilOpacity: 0,
      titleScale: "feature",
    },
    lightRig: {
      exposure: 1.02,
      fogColor: "#08050a",
      fogDensity: 0.026,
      ambientIntensity: 0.1,
      key: {
        color: "#ffd2f0",
        intensity: 3.7,
        position: [3.2, 4.5, 5.6],
      },
      fill: {
        color: "#fff6fb",
        intensity: 0.72,
        position: [-3.8, 1.2, 4.4],
      },
      rim: {
        color: "#f7a4d6",
        intensity: 2.4,
        position: [0, 5.1, -7.2],
        angle: Math.PI / 5.4,
      },
      practical: {
        color: "#ffdff4",
        intensity: 7.2,
        position: [0, 0.55, -0.75],
      },
    },
    postFxProfile: {
      bloomThreshold: 0.92,
      bloomSmoothing: 0.028,
      bloomIntensity: 0.4,
      vignetteOffset: 0.24,
      vignetteDarkness: 0.72,
      chromaticOffset: 0,
    },
    overlayMode: "apotheosis",
    ambientParticleMode: "sparse",
    tierOverrides: createTierOverrides(),
  },
  ] as const;

interface PhaseVisualMeta {
  heroAsset: HeroAssetId;
  heroVariant: HeroVariant;
  supportFxPreset: SupportFxPreset;
  fogProfile: FogProfile;
  shadowProfile: ShadowProfile;
  referenceFrame: ReferenceFrame;
  compositionZone: CompositionZone;
  visualQa: VisualQaProfile;
}

const PHASE_VISUAL_META: Record<string, PhaseVisualMeta> = {
  seed: {
    heroAsset: "dark_star",
    heroVariant: "singularity",
    supportFxPreset: "seed-rings",
    fogProfile: {
      color: "#7df2de",
      secondaryColor: "#071015",
      layerOpacity: 0.15,
      foregroundOpacity: 0.08,
      scale: 10.5,
      drift: 0.0035,
    },
    shadowProfile: {
      enabled: false,
      receiverY: -1.7,
      radius: 3.8,
      opacity: 0.12,
    },
    referenceFrame: {
      pack: "Cosmic_Horror_Void_Stitch_Pack",
      image: "A_Hero_Establishing_Void.png",
    },
    compositionZone: {
      heroOffset: [0, -0.28, -0.32],
      uiOffset: [-2.1, 1.55, 1.05],
      safeRadius: 2.4,
    },
    visualQa: {
      expectedHeroAsset: "dark_star",
      approvedSupportLayers: ["seed-rings", "fog-atlas", "spores"],
      maxTransparentCount: 24,
      protectedUiZone: "left-column",
    },
  },
  scaffold: {
    heroAsset: "wireframe_globe",
    heroVariant: "orbital-shell",
    supportFxPreset: "scaffold-lattice",
    fogProfile: {
      color: "#84ccff",
      secondaryColor: "#081019",
      layerOpacity: 0.18,
      foregroundOpacity: 0.1,
      scale: 11.2,
      drift: 0.0042,
    },
    shadowProfile: {
      enabled: true,
      receiverY: -1.55,
      radius: 4.4,
      opacity: 0.16,
    },
    referenceFrame: {
      pack: "Cosmic_Horror_Void_Stitch_Pack",
      image: "C_Microtubule_Lattice.png",
    },
    compositionZone: {
      heroOffset: [0.52, -0.22, -0.34],
      uiOffset: [-2.45, 1.42, 1.15],
      safeRadius: 2.8,
    },
    visualQa: {
      expectedHeroAsset: "wireframe_globe",
      approvedSupportLayers: ["scaffold-lattice", "fog-atlas", "spores"],
      maxTransparentCount: 24,
      protectedUiZone: "left-column",
    },
  },
  circulation: {
    heroAsset: "hologram",
    heroVariant: "hologram",
    supportFxPreset: "circulation-stream",
    fogProfile: {
      color: "#7cf7f1",
      secondaryColor: "#071319",
      layerOpacity: 0.2,
      foregroundOpacity: 0.12,
      scale: 12.2,
      drift: 0.005,
    },
    shadowProfile: {
      enabled: false,
      receiverY: -1.8,
      radius: 4.2,
      opacity: 0.12,
    },
    referenceFrame: {
      pack: "Cosmic_Horror_Void_Stitch_Pack",
      image: "D_Nebula_Tunnel_Traversal.png",
    },
    compositionZone: {
      heroOffset: [0.88, -0.02, -0.62],
      uiOffset: [-2.55, 1.2, 1.22],
      safeRadius: 3.1,
    },
    visualQa: {
      expectedHeroAsset: "hologram",
      approvedSupportLayers: ["circulation-stream", "fog-atlas", "spores"],
      maxTransparentCount: 25,
      protectedUiZone: "left-column",
    },
  },
  sentience: {
    heroAsset: "quantum_leap",
    heroVariant: "paired-sentience",
    supportFxPreset: "sentience-bridge",
    fogProfile: {
      color: "#cf9aff",
      secondaryColor: "#120816",
      layerOpacity: 0.16,
      foregroundOpacity: 0.09,
      scale: 10.8,
      drift: 0.0038,
    },
    shadowProfile: {
      enabled: true,
      receiverY: -1.52,
      radius: 4.8,
      opacity: 0.14,
    },
    referenceFrame: {
      pack: "Cosmic_Horror_Void_Stitch_Pack",
      image: "E_Orbiting_Monolith.png",
    },
    compositionZone: {
      heroOffset: [0, -0.12, -0.38],
      uiOffset: [0, 1.76, 1.3],
      safeRadius: 2.9,
    },
    visualQa: {
      expectedHeroAsset: "quantum_leap",
      approvedSupportLayers: ["sentience-bridge", "fog-atlas", "particle-nervous-system"],
      maxTransparentCount: 24,
      protectedUiZone: "upper-band",
    },
  },
  apotheosis: {
    heroAsset: "black_hole",
    heroVariant: "event-horizon",
    supportFxPreset: "apotheosis-crown",
    fogProfile: {
      color: "#f4a7df",
      secondaryColor: "#12060d",
      layerOpacity: 0.18,
      foregroundOpacity: 0.11,
      scale: 12.8,
      drift: 0.0046,
    },
    shadowProfile: {
      enabled: true,
      receiverY: -1.68,
      radius: 5.4,
      opacity: 0.18,
    },
    referenceFrame: {
      pack: "Cosmic_Horror_Void_Stitch_Pack",
      image: "B_Black_Hole_Close_Up.png",
    },
    compositionZone: {
      heroOffset: [0, 0.08, -0.55],
      uiOffset: [0, -1.28, 1.45],
      safeRadius: 3.2,
    },
    visualQa: {
      expectedHeroAsset: "black_hole",
      approvedSupportLayers: ["apotheosis-crown", "fog-atlas", "particle-nervous-system"],
      maxTransparentCount: 28,
      protectedUiZone: "lower-third",
    },
  },
};

export const WORLD_PHASES: readonly WorldPhaseProfile[] = BASE_WORLD_PHASES.map(
  (phase) => ({
    ...phase,
    ...PHASE_VISUAL_META[phase.slug],
    uiRig: {
      ...phase.uiRig,
      anchor: PHASE_VISUAL_META[phase.slug].compositionZone.uiOffset,
    },
  })
);

export const ACT_VIEWPORT_PROFILES = WORLD_PHASES;

export const ACT_HERO_LABELS = WORLD_PHASES.map((profile) => profile.heroLabel);
