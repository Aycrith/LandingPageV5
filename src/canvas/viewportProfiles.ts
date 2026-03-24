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

export interface ActViewportProfile {
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
}

export const STARTUP_CRITICAL_ASSETS = ["act1-dark-star"] as const;

export type StartupCriticalAsset = (typeof STARTUP_CRITICAL_ASSETS)[number];

export const ACT_VIEWPORT_PROFILES: readonly ActViewportProfile[] = [
  {
    previewCamera: {
      position: [0, 0.2, 6.8],
      lookAt: [0, 0, 0],
      fov: 46,
    },
    settleCamera: {
      position: [0, 0.15, 3],
      lookAt: [0, 0, 0],
      fov: 40,
    },
    cameraPath: {
      positions: [
        [0, 0, 3],
        [0, 0.5, 6],
        [0, 1, 10],
      ],
      lookAts: [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ],
      fovs: [40, 45, 50],
    },
    maxModelViewportFill: 0.78,
    heroModelBehavior: {
      baseScale: 0.3,
      maxScale: 1.5,
      fitPadding: 0.94,
      focusOffset: [0, 0, -0.4],
    },
    fxLayerBehavior: {
      minimumVeilMs: 900,
      settleDurationMs: 1300,
      stableFrames: 2,
      coreScaleLimit: 0.72,
      coreOpacity: 0.48,
    },
  },
  {
    previewCamera: {
      position: [0, 1, 10],
      lookAt: [0, 0, 0],
      fov: 50,
    },
    settleCamera: {
      position: [6, 2, 6],
      lookAt: [0, 0, 0],
      fov: 48,
    },
    cameraPath: {
      positions: [
        [0, 1, 10],
        [6, 2, 6],
        [0, 3, 8],
      ],
      lookAts: [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ],
      fovs: [50, 48, 52],
    },
    maxModelViewportFill: 0.86,
    heroModelBehavior: {
      baseScale: 0.02,
      maxScale: 0.02,
      fitPadding: 0.96,
      focusOffset: [0, 0, 0],
    },
    fxLayerBehavior: {
      minimumVeilMs: 0,
      settleDurationMs: 0,
      stableFrames: 1,
      coreScaleLimit: 1,
      coreOpacity: 1,
    },
  },
  {
    previewCamera: {
      position: [0, 3, 8],
      lookAt: [0, 0, 0],
      fov: 52,
    },
    settleCamera: {
      position: [-2, 1, 7],
      lookAt: [0, -1, 0],
      fov: 55,
    },
    cameraPath: {
      positions: [
        [0, 3, 8],
        [-2, 1, 7],
        [0, 0, 9],
      ],
      lookAts: [
        [0, 0, 0],
        [0, -1, 0],
        [0, 0, 0],
      ],
      fovs: [52, 55, 50],
    },
    maxModelViewportFill: 0.84,
    heroModelBehavior: {
      baseScale: 0.015,
      maxScale: 0.015,
      fitPadding: 0.95,
      focusOffset: [0, 0, 0],
    },
    fxLayerBehavior: {
      minimumVeilMs: 0,
      settleDurationMs: 0,
      stableFrames: 1,
      coreScaleLimit: 1,
      coreOpacity: 1,
    },
  },
  {
    previewCamera: {
      position: [0, 0, 9],
      lookAt: [0, 0, 0],
      fov: 50,
    },
    settleCamera: {
      position: [4, -2, 5],
      lookAt: [0, 0, 0],
      fov: 60,
    },
    cameraPath: {
      positions: [
        [0, 0, 9],
        [4, -2, 5],
        [-3, 2, 7],
      ],
      lookAts: [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ],
      fovs: [50, 60, 45],
    },
    maxModelViewportFill: 0.82,
    heroModelBehavior: {
      baseScale: 0.02,
      maxScale: 0.8,
      fitPadding: 0.92,
      focusOffset: [0, 0, -0.15],
    },
    fxLayerBehavior: {
      minimumVeilMs: 0,
      settleDurationMs: 0,
      stableFrames: 1,
      coreScaleLimit: 0.55,
      coreOpacity: 0.55,
    },
  },
  {
    previewCamera: {
      position: [-3, 2, 7],
      lookAt: [0, 0, 0],
      fov: 45,
    },
    settleCamera: {
      position: [0, 0, 2.4],
      lookAt: [0, 0, 0],
      fov: 38,
    },
    cameraPath: {
      positions: [
        [-3, 2, 7],
        [0, 0.5, 5],
        [0, 0, 2.4],
      ],
      lookAts: [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ],
      fovs: [45, 42, 38],
    },
    maxModelViewportFill: 0.74,
    heroModelBehavior: {
      baseScale: 0.005,
      maxScale: 0.02,
      fitPadding: 0.9,
      focusOffset: [0, 0, -0.55],
    },
    fxLayerBehavior: {
      minimumVeilMs: 0,
      settleDurationMs: 0,
      stableFrames: 1,
      coreScaleLimit: 0.46,
      coreOpacity: 0.42,
    },
  },
];
