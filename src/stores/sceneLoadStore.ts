import { create } from "zustand";
import {
  STARTUP_CRITICAL_ASSET_IDS,
  STARTUP_WARMUP_ACT_SEQUENCE,
  type StartupCriticalAsset,
} from "@/canvas/assetManifest";

export type StartupPhase =
  | "asset-preload"
  | "warmup"
  | "stabilizing"
  | "ready"
  | "fallback";

interface SceneLoadState {
  startupStartedAt: number;
  criticalAssets: Record<StartupCriticalAsset, boolean>;
  assetManifestReady: boolean;
  warmupActIndex: number | null;
  warmedActs: number[];
  warmupReady: boolean;
  stableFrameReady: boolean;
  readyAt: number | null;
  hasFallbackTriggered: boolean;
  lateRequestUrls: string[];
  resetStartup: () => void;
  markCriticalAssetReady: (asset: StartupCriticalAsset) => void;
  markAssetManifestReady: () => void;
  setWarmupActIndex: (actIndex: number | null) => void;
  markWarmupActReady: (actIndex: number) => void;
  markWarmupReady: () => void;
  markStableFrameReady: () => void;
  markStartupReady: () => void;
  markFallbackTriggered: () => void;
  reportLateRequests: (urls: string[]) => void;
}

function buildInitialAssetState(): Record<StartupCriticalAsset, boolean> {
  return STARTUP_CRITICAL_ASSET_IDS.reduce(
    (assets, asset) => {
      assets[asset] = false;
      return assets;
    },
    {} as Record<StartupCriticalAsset, boolean>
  );
}

export const useSceneLoadStore = create<SceneLoadState>((set) => ({
  startupStartedAt: Date.now(),
  criticalAssets: buildInitialAssetState(),
  assetManifestReady: false,
  warmupActIndex: null,
  warmedActs: [],
  warmupReady: false,
  stableFrameReady: false,
  readyAt: null,
  hasFallbackTriggered: false,
  lateRequestUrls: [],
  resetStartup: () =>
    set({
      startupStartedAt: Date.now(),
      criticalAssets: buildInitialAssetState(),
      assetManifestReady: false,
      warmupActIndex: null,
      warmedActs: [],
      warmupReady: false,
      stableFrameReady: false,
      readyAt: null,
      hasFallbackTriggered: false,
      lateRequestUrls: [],
    }),
  markCriticalAssetReady: (asset) =>
    set((state) => ({
      criticalAssets: {
        ...state.criticalAssets,
        [asset]: true,
      },
    })),
  markAssetManifestReady: () =>
    set((state) =>
      state.assetManifestReady ? {} : { assetManifestReady: true }
    ),
  setWarmupActIndex: (actIndex) =>
    set((state) =>
      state.warmupActIndex === actIndex ? {} : { warmupActIndex: actIndex }
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
        : { warmupReady: true, warmupActIndex: null }
    ),
  markStableFrameReady: () =>
    set((state) =>
      state.stableFrameReady ? {} : { stableFrameReady: true }
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
            warmupReady: true,
            warmupActIndex: null,
            stableFrameReady: true,
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
  return STARTUP_CRITICAL_ASSET_IDS.every((asset) => state.criticalAssets[asset]);
}

export function getSceneWarmupProgress(state: SceneLoadState): number {
  if (state.hasFallbackTriggered) return 1;
  return state.warmedActs.length / STARTUP_WARMUP_ACT_SEQUENCE.length;
}

export function getSceneStartupProgress(state: SceneLoadState): number {
  if (state.hasFallbackTriggered) return 1;
  const loadedAssets = STARTUP_CRITICAL_ASSET_IDS.filter(
    (asset) => state.criticalAssets[asset]
  ).length;
  const assetProgress = loadedAssets / STARTUP_CRITICAL_ASSET_IDS.length;
  const manifestProgress = state.assetManifestReady ? 1 : assetProgress;
  const warmupProgress = state.warmupReady ? 1 : getSceneWarmupProgress(state);
  const stableFrameProgress = state.stableFrameReady ? 1 : 0;

  return Math.min(
    1,
    manifestProgress * 0.68 + warmupProgress * 0.2 + stableFrameProgress * 0.12
  );
}

export function getSceneStartupPhase(state: SceneLoadState): StartupPhase {
  if (state.hasFallbackTriggered) return "fallback";
  if (!state.assetManifestReady || !areCriticalAssetsReady(state)) {
    return "asset-preload";
  }
  if (!state.warmupReady) {
    return "warmup";
  }
  if (!state.stableFrameReady) {
    return "stabilizing";
  }
  return "ready";
}

export function isSceneStartupReady(state: SceneLoadState): boolean {
  return (
    areCriticalAssetsReady(state) &&
    state.assetManifestReady &&
    state.warmupReady &&
    state.stableFrameReady
  );
}
