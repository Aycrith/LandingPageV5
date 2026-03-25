import { create } from "zustand";
import {
  STARTUP_CRITICAL_ASSETS,
  type StartupCriticalAsset,
} from "@/canvas/viewportProfiles";

interface SceneLoadState {
  startupStartedAt: number;
  criticalAssets: Record<StartupCriticalAsset, boolean>;
  stableFrameReady: boolean;
  hasFallbackTriggered: boolean;
  resetStartup: () => void;
  markCriticalAssetReady: (asset: StartupCriticalAsset) => void;
  markStableFrameReady: () => void;
  markFallbackTriggered: () => void;
}

function buildInitialAssetState(): Record<StartupCriticalAsset, boolean> {
  return STARTUP_CRITICAL_ASSETS.reduce(
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
  stableFrameReady: false,
  hasFallbackTriggered: false,
  resetStartup: () =>
    set({
      startupStartedAt: Date.now(),
      criticalAssets: buildInitialAssetState(),
      stableFrameReady: false,
      hasFallbackTriggered: false,
    }),
  markCriticalAssetReady: (asset) =>
    set((state) => ({
      criticalAssets: {
        ...state.criticalAssets,
        [asset]: true,
      },
    })),
  markStableFrameReady: () =>
    set((state) =>
      state.stableFrameReady ? {} : { stableFrameReady: true }
    ),
  markFallbackTriggered: () =>
    set((state) =>
      state.hasFallbackTriggered ? {} : { hasFallbackTriggered: true, stableFrameReady: true }
    ),
}));

export function areCriticalAssetsReady(state: SceneLoadState): boolean {
  if (state.hasFallbackTriggered) return true;
  return STARTUP_CRITICAL_ASSETS.every((asset) => state.criticalAssets[asset]);
}

export function getSceneStartupProgress(state: SceneLoadState): number {
  if (state.hasFallbackTriggered) return 1;
  const loadedAssets = STARTUP_CRITICAL_ASSETS.filter(
    (asset) => state.criticalAssets[asset]
  ).length;
  const assetProgress = loadedAssets / STARTUP_CRITICAL_ASSETS.length;
  const stableFrameProgress = state.stableFrameReady ? 1 : 0;

  return Math.min(1, assetProgress * 0.82 + stableFrameProgress * 0.18);
}

export function isSceneStartupReady(state: SceneLoadState): boolean {
  return areCriticalAssetsReady(state) && state.stableFrameReady;
}
