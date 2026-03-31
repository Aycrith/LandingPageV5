import { create } from "zustand";
import {
  STARTUP_CRITICAL_ASSET_IDS,
  STARTUP_ENTRY_CRITICAL_ASSET_IDS,
  STARTUP_NEAR_SCROLL_ASSET_IDS,
  STARTUP_WARMUP_ACT_SEQUENCE,
  type StartupAssetId,
} from "@/canvas/assetManifest";
import {
  REQUIRED_CHECKPOINT_IDS_BY_ACT,
} from "@/canvas/warmupCheckpoints";

export type StartupPhase =
  | "asset-preload"
  | "warmup"
  | "stabilizing"
  | "ready"
  | "fallback";

interface SceneLoadState {
  startupStartedAt: number;
  loadedAssets: Record<StartupAssetId, boolean>;
  assetManifestReady: boolean;
  assetManifestReadyAt: number | null;
  nearScrollReadyAt: number | null;
  deferredPreloadStartedAt: number | null;
  deferredPreloadReadyAt: number | null;
  shaderWarmupReady: boolean;
  warmupActIndex: number | null;
  warmupActProgress: number;
  offscreenWarmupActIndex: number | null;
  offscreenWarmupCheckpointId: string | null;
  offscreenWarmupRequestActive: boolean;
  offscreenWarmupRequestVersion: number;
  compiledWarmupCheckpointIds: string[];
  warmupCheckpointProgramSignatures: Record<string, string[]>;
  preparedActs: number[];
  compiledActs: number[];
  warmedActs: number[];
  warmupReady: boolean;
  warmupReadyAt: number | null;
  compileReady: boolean;
  compileReadyAt: number | null;
  stableFrameReady: boolean;
  stableFrameReadyAt: number | null;
  readyAt: number | null;
  hasFallbackTriggered: boolean;
  lateRequestUrls: string[];
  resetStartup: () => void;
  markStartupAssetReady: (asset: StartupAssetId) => void;
  markAssetManifestReady: () => void;
  markNearScrollReady: () => void;
  markDeferredPreloadStarted: () => void;
  markDeferredPreloadReady: () => void;
  markShaderWarmupReady: () => void;
  setWarmupActIndex: (actIndex: number | null, progress?: number) => void;
  setOffscreenWarmupActIndex: (actIndex: number | null) => void;
  setOffscreenWarmupCheckpointId: (checkpointId: string | null) => void;
  requestOffscreenWarmup: (checkpointId: string, actIndex: number) => number;
  clearOffscreenWarmupRequest: () => void;
  markWarmupCheckpointCompiled: (
    checkpointId: string,
    programSignatures?: readonly string[]
  ) => void;
  markActPrepared: (actIndex: number) => void;
  markActCompiled: (actIndex: number) => void;
  markWarmupActReady: (actIndex: number) => void;
  markWarmupReady: () => void;
  markCompileReady: () => void;
  markStableFrameReady: () => void;
  markStartupReady: () => void;
  markFallbackTriggered: () => void;
  reportLateRequests: (urls: string[]) => void;
}

function buildInitialAssetState(): Record<StartupAssetId, boolean> {
  return [...STARTUP_ENTRY_CRITICAL_ASSET_IDS, ...STARTUP_NEAR_SCROLL_ASSET_IDS].reduce(
    (assets, asset) => {
      assets[asset] = false;
      return assets;
    },
    {} as Record<StartupAssetId, boolean>
  );
}

function resolveWarmedActs(compiledWarmupCheckpointIds: readonly string[]) {
  return REQUIRED_CHECKPOINT_IDS_BY_ACT.flatMap((requiredCheckpointIds, actIndex) =>
    requiredCheckpointIds.length > 0 &&
    requiredCheckpointIds.every((checkpointId) =>
      compiledWarmupCheckpointIds.includes(checkpointId)
    )
      ? [actIndex]
      : []
  );
}

export const useSceneLoadStore = create<SceneLoadState>((set) => ({
  startupStartedAt: Date.now(),
  loadedAssets: buildInitialAssetState(),
  assetManifestReady: false,
  assetManifestReadyAt: null,
  nearScrollReadyAt: null,
  deferredPreloadStartedAt: null,
  deferredPreloadReadyAt: null,
  shaderWarmupReady: false,
  warmupActIndex: null,
  warmupActProgress: 0.32,
  offscreenWarmupActIndex: null,
  offscreenWarmupCheckpointId: null,
  offscreenWarmupRequestActive: false,
  offscreenWarmupRequestVersion: 0,
  compiledWarmupCheckpointIds: [],
  warmupCheckpointProgramSignatures: {},
  preparedActs: [],
  compiledActs: [],
  warmedActs: [],
  warmupReady: false,
  warmupReadyAt: null,
  compileReady: false,
  compileReadyAt: null,
  stableFrameReady: false,
  stableFrameReadyAt: null,
  readyAt: null,
  hasFallbackTriggered: false,
  lateRequestUrls: [],
  resetStartup: () =>
    set({
      startupStartedAt: Date.now(),
      loadedAssets: buildInitialAssetState(),
      assetManifestReady: false,
      assetManifestReadyAt: null,
      nearScrollReadyAt: null,
      deferredPreloadStartedAt: null,
      deferredPreloadReadyAt: null,
      shaderWarmupReady: false,
      warmupActIndex: null,
      warmupActProgress: 0.32,
      offscreenWarmupActIndex: null,
      offscreenWarmupCheckpointId: null,
      offscreenWarmupRequestActive: false,
      offscreenWarmupRequestVersion: 0,
      compiledWarmupCheckpointIds: [],
      warmupCheckpointProgramSignatures: {},
      preparedActs: [],
      compiledActs: [],
      warmedActs: [],
      warmupReady: false,
      warmupReadyAt: null,
      compileReady: false,
      compileReadyAt: null,
      stableFrameReady: false,
      stableFrameReadyAt: null,
      readyAt: null,
      hasFallbackTriggered: false,
      lateRequestUrls: [],
    }),
  markStartupAssetReady: (asset) =>
    set((state) => ({
      loadedAssets: {
        ...state.loadedAssets,
        [asset]: true,
      },
    })),
  markAssetManifestReady: () =>
    set((state) =>
      state.assetManifestReady
        ? {}
        : { assetManifestReady: true, assetManifestReadyAt: Date.now() }
    ),
  markNearScrollReady: () =>
    set((state) =>
      state.nearScrollReadyAt != null ? {} : { nearScrollReadyAt: Date.now() }
    ),
  markDeferredPreloadStarted: () =>
    set((state) =>
      state.deferredPreloadStartedAt != null
        ? {}
        : { deferredPreloadStartedAt: Date.now() }
    ),
  markDeferredPreloadReady: () =>
    set((state) =>
      state.deferredPreloadReadyAt != null
        ? {}
        : { deferredPreloadReadyAt: Date.now() }
    ),
  markShaderWarmupReady: () =>
    set((state) => (state.shaderWarmupReady ? {} : { shaderWarmupReady: true })),
  setWarmupActIndex: (actIndex, progress = 0.32) =>
    set((state) =>
      state.warmupActIndex === actIndex && state.warmupActProgress === progress
        ? {}
        : { warmupActIndex: actIndex, warmupActProgress: progress }
    ),
  setOffscreenWarmupActIndex: (actIndex) =>
    set((state) =>
      state.offscreenWarmupActIndex === actIndex
        ? {}
        : { offscreenWarmupActIndex: actIndex }
    ),
  setOffscreenWarmupCheckpointId: (checkpointId) =>
    set((state) =>
      state.offscreenWarmupCheckpointId === checkpointId
        ? {}
        : { offscreenWarmupCheckpointId: checkpointId }
    ),
  requestOffscreenWarmup: (checkpointId, actIndex) => {
    let nextVersion = 0;
    set((state) => {
      nextVersion = state.offscreenWarmupRequestVersion + 1;
      return {
        offscreenWarmupActIndex: actIndex,
        offscreenWarmupCheckpointId: checkpointId,
        offscreenWarmupRequestActive: true,
        offscreenWarmupRequestVersion: nextVersion,
      };
    });
    return nextVersion;
  },
  clearOffscreenWarmupRequest: () =>
    set((state) => ({
      offscreenWarmupActIndex: null,
      offscreenWarmupCheckpointId: null,
      offscreenWarmupRequestActive: false,
      offscreenWarmupRequestVersion: state.offscreenWarmupRequestVersion + 1,
    })),
  markWarmupCheckpointCompiled: (checkpointId, programSignatures = []) =>
    set((state) => {
      if (state.compiledWarmupCheckpointIds.includes(checkpointId)) {
        return {};
      }

      const compiledWarmupCheckpointIds = [
        ...state.compiledWarmupCheckpointIds,
        checkpointId,
      ].sort();

      return {
        compiledWarmupCheckpointIds,
        warmupCheckpointProgramSignatures: {
          ...state.warmupCheckpointProgramSignatures,
          [checkpointId]: Array.from(new Set(programSignatures)).sort(),
        },
        warmedActs: Array.from(
          new Set([
            ...state.warmedActs,
            ...resolveWarmedActs(compiledWarmupCheckpointIds),
          ])
        ).sort((a, b) => a - b),
      };
    }),
  markActPrepared: (actIndex) =>
    set((state) =>
      state.preparedActs.includes(actIndex)
        ? {}
        : { preparedActs: [...state.preparedActs, actIndex].sort((a, b) => a - b) }
    ),
  markActCompiled: (actIndex) =>
    set((state) =>
      state.compiledActs.includes(actIndex)
        ? {}
        : { compiledActs: [...state.compiledActs, actIndex].sort((a, b) => a - b) }
    ),
  markWarmupActReady: (actIndex) =>
    set((state) =>
      state.warmedActs.includes(actIndex)
        ? {}
        : { warmedActs: [...state.warmedActs, actIndex].sort((a, b) => a - b) }
    ),
  markWarmupReady: () =>
    set((state) =>
      state.warmupReady
        ? {}
        : { warmupReady: true, warmupReadyAt: Date.now(), warmupActIndex: null }
    ),
  markCompileReady: () =>
    set((state) =>
      state.compileReady ? {} : { compileReady: true, compileReadyAt: Date.now() }
    ),
  markStableFrameReady: () =>
    set((state) =>
      state.stableFrameReady
        ? {}
        : { stableFrameReady: true, stableFrameReadyAt: Date.now() }
    ),
  markStartupReady: () =>
    set((state) =>
      state.readyAt != null ? {} : { readyAt: Date.now() }
    ),
  markFallbackTriggered: () =>
    set((state) =>
      state.hasFallbackTriggered
        ? {}
        : {
            hasFallbackTriggered: true,
            assetManifestReady: true,
            assetManifestReadyAt: Date.now(),
            warmupReady: true,
            warmupReadyAt: Date.now(),
            compileReady: true,
            compileReadyAt: Date.now(),
            warmupActIndex: null,
            offscreenWarmupActIndex: null,
            offscreenWarmupCheckpointId: null,
            offscreenWarmupRequestActive: false,
            stableFrameReady: true,
            stableFrameReadyAt: Date.now(),
          }
    ),
  reportLateRequests: (urls) =>
    set((state) => {
      const nextUrls = Array.from(new Set(urls)).sort();
      if (
        nextUrls.length === state.lateRequestUrls.length &&
        nextUrls.every((url, index) => state.lateRequestUrls[index] === url)
      ) {
        return {};
      }
      return { lateRequestUrls: nextUrls };
    }),
}));

export function areCriticalAssetsReady(state: SceneLoadState): boolean {
  if (state.hasFallbackTriggered) return true;
  return STARTUP_CRITICAL_ASSET_IDS.every((asset) => state.loadedAssets[asset]);
}

export function areNearScrollAssetsReady(state: SceneLoadState): boolean {
  return STARTUP_NEAR_SCROLL_ASSET_IDS.every((asset) => state.loadedAssets[asset]);
}

export function getSceneWarmupProgress(state: SceneLoadState): number {
  if (state.hasFallbackTriggered) return 1;
  return state.warmedActs.length / STARTUP_WARMUP_ACT_SEQUENCE.length;
}

export function getSceneStartupProgress(state: SceneLoadState): number {
  if (state.hasFallbackTriggered) return 1;
  const loadedAssets = STARTUP_CRITICAL_ASSET_IDS.filter(
    (asset) => state.loadedAssets[asset]
  ).length;
  const assetProgress = loadedAssets / STARTUP_CRITICAL_ASSET_IDS.length;
  const manifestProgress = state.assetManifestReady ? 1 : assetProgress;
  const warmupProgress = state.warmupReady ? 1 : getSceneWarmupProgress(state);
  const compileProgress = state.compileReady ? 1 : warmupProgress;
  const stableFrameProgress = state.stableFrameReady ? 1 : 0;

  return Math.min(
    1,
    manifestProgress * 0.45 +
      warmupProgress * 0.3 +
      compileProgress * 0.15 +
      stableFrameProgress * 0.1
  );
}

export function getStartupPhaseTimings(state: SceneLoadState) {
  const assetManifestMs =
    state.assetManifestReadyAt != null
      ? state.assetManifestReadyAt - state.startupStartedAt
      : null;
  const nearScrollMs =
    state.nearScrollReadyAt != null
      ? state.nearScrollReadyAt - state.startupStartedAt
      : null;
  const warmupMs =
    state.warmupReadyAt != null ? state.warmupReadyAt - state.startupStartedAt : null;
  const compileMs =
    state.compileReadyAt != null ? state.compileReadyAt - state.startupStartedAt : null;
  const stableFrameMs =
    state.stableFrameReadyAt != null
      ? state.stableFrameReadyAt - state.startupStartedAt
      : null;
  const deferredStartedMs =
    state.deferredPreloadStartedAt != null
      ? state.deferredPreloadStartedAt - state.startupStartedAt
      : null;
  const deferredReadyMs =
    state.deferredPreloadReadyAt != null
      ? state.deferredPreloadReadyAt - state.startupStartedAt
      : null;
  const readyMs = state.readyAt != null ? state.readyAt - state.startupStartedAt : null;

  return {
    assetManifestMs,
    nearScrollMs,
    warmupMs,
    compileMs,
    stableFrameMs,
    deferredStartedMs,
    deferredReadyMs,
    readyMs,
  };
}

export function getSceneStartupPhase(state: SceneLoadState): StartupPhase {
  if (state.hasFallbackTriggered) return "fallback";
  if (!state.assetManifestReady || !areCriticalAssetsReady(state)) {
    return "asset-preload";
  }
  if (!state.warmupReady) {
    return "warmup";
  }
  if (!state.compileReady || !state.stableFrameReady) {
    return "stabilizing";
  }
  return "ready";
}

export function isSceneStartupReady(state: SceneLoadState): boolean {
  return (
    areCriticalAssetsReady(state) &&
    areNearScrollAssetsReady(state) &&
    state.assetManifestReady &&
    state.warmupReady &&
    state.compileReady &&
    state.stableFrameReady
  );
}
