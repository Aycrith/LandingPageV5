"use client";

import { Suspense, useEffect, useLayoutEffect, useMemo } from "react";
import { useEnvironment, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import {
  STARTUP_BACKGROUND_PRELOAD_GROUPS,
  STARTUP_BACKGROUND_TEXTURE_PRELOADS,
  STARTUP_CRITICAL_ASSET_IDS,
  STARTUP_INTERACTIVE_ASSET_PATHS,
  STARTUP_INTERACTIVE_PRELOAD_GROUPS,
  STARTUP_INTERACTIVE_TEXTURE_PRELOADS,
  STARTUP_WARMUP_ACT_SEQUENCE,
  type StartupAssetId,
  type StartupCriticalAsset,
} from "./assetManifest";
import {
  getTextureSamplingOptions,
  resolveActMaterialTierConfig,
} from "./acts/materialTierConfig";
import { useCapsStore } from "@/stores/capsStore";
import { useSceneLoadStore } from "@/stores/sceneLoadStore";
import { preloadRepeatingTexture, useRepeatingTexture } from "@/lib/textures";

const WARMUP_FRAME_COUNT = 1;
const WARMUP_FRAME_WAIT_CAP_MS = 180;
const WARMUP_SETTLE_MS = 120;

function collectLoadedManifestPaths() {
  if (typeof performance.getEntriesByType !== "function") {
    return new Set<string>();
  }

  return new Set(
    performance
      .getEntriesByType("resource")
      .flatMap((entry) => {
        if (!(entry instanceof PerformanceResourceTiming)) {
          return [];
        }

        const pathname = new URL(entry.name, window.location.href).pathname;
        return entry.responseEnd > 0 ? [pathname] : [];
      })
  );
}

function waitForManifestRequests(timeoutMs: number) {
  return new Promise<void>((resolve, reject) => {
    const startedAt = performance.now();

    function tick() {
      const loadedPaths = collectLoadedManifestPaths();
      const missingPaths = STARTUP_INTERACTIVE_ASSET_PATHS.filter(
        (pathname) => !loadedPaths.has(pathname)
      );

      if (missingPaths.length === 0) {
        resolve();
        return;
      }

      if (performance.now() - startedAt > timeoutMs) {
        reject(
          new Error(
            `Startup manifest did not resolve before timeout: ${missingPaths.join(", ")}`
          )
        );
        return;
      }

      window.setTimeout(tick, 60);
    }

    tick();
  });
}

function waitForFrames(frameCount: number) {
  return new Promise<void>((resolve) => {
    let frames = 0;

    function step() {
      frames += 1;
      if (frames >= frameCount) {
        resolve();
        return;
      }
      requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  });
}

function waitForFramesOrMs(frameCount: number, maxMs: number) {
  return Promise.race([waitForFrames(frameCount), waitForMs(maxMs)]);
}

function waitForMs(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function scheduleIdleTask(task: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  if ("requestIdleCallback" in window) {
    const idleWindow = window as Window & {
      requestIdleCallback: (
        callback: (deadline: IdleDeadline) => void,
        options?: IdleRequestOptions
      ) => number;
      cancelIdleCallback: (handle: number) => void;
    };

    const handle = idleWindow.requestIdleCallback(() => task(), {
      timeout: 1000,
    });

    return () => idleWindow.cancelIdleCallback(handle);
  }

  const handle = globalThis.setTimeout(task, 0);
  return () => globalThis.clearTimeout(handle);
}

function preloadBackgroundStartupAssets(tier: "high" | "medium" | "low") {
  for (const group of STARTUP_BACKGROUND_PRELOAD_GROUPS) {
    if (group.kind === "environment") {
      useEnvironment.preload({ files: group.url });
      continue;
    }

    useGLTF.preload(group.url);
  }

  for (const texture of STARTUP_BACKGROUND_TEXTURE_PRELOADS) {
    const options =
      texture.actIndex == null
        ? texture.colorSpace
          ? { repeat: texture.repeat, colorSpace: THREE.SRGBColorSpace }
          : { repeat: texture.repeat }
        : getTextureSamplingOptions(resolveActMaterialTierConfig(texture.actIndex, tier).texture, {
            repeat: texture.repeat,
            colorSpace: texture.colorSpace === "srgb" ? THREE.SRGBColorSpace : undefined,
          });
    preloadRepeatingTexture(texture.url, options);
  }
}

function markAssetsReady(ids: readonly StartupAssetId[]) {
  const store = useSceneLoadStore.getState();
  ids.forEach((id) => store.markCriticalAssetReady(id as StartupCriticalAsset));
}

function StartupModelPreloader({
  path,
  readinessIds,
}: {
  path: string;
  readinessIds: readonly StartupAssetId[];
}) {
  useGLTF(path);

  useEffect(() => {
    markAssetsReady(readinessIds);
  }, [readinessIds]);

  return null;
}

function StartupTexturePreloader({
  assetId,
  url,
  repeat,
  colorSpace,
  actIndex,
}: {
  assetId: StartupAssetId;
  url: string;
  repeat: number;
  colorSpace?: THREE.ColorSpace;
  actIndex?: number;
}) {
  const tier = useCapsStore((state) => state.caps?.tier ?? "low");
  const options = useMemo(() => {
    if (actIndex == null) {
      return colorSpace ? { repeat, colorSpace } : { repeat };
    }

    const config = resolveActMaterialTierConfig(actIndex, tier);
    return getTextureSamplingOptions(config.texture, { repeat, colorSpace });
  }, [actIndex, colorSpace, repeat, tier]);

  const texture = useRepeatingTexture(url, options);

  useEffect(() => {
    let cancelled = false;

    function isTextureResolved() {
      const sourceData = texture.source?.data;
      const imageData = texture.image;
      return Boolean(sourceData ?? imageData);
    }

    function markWhenResolved() {
      if (cancelled) return;
      if (isTextureResolved()) {
        if (STARTUP_CRITICAL_ASSET_IDS.includes(assetId as StartupCriticalAsset)) {
          useSceneLoadStore.getState().markCriticalAssetReady(
            assetId as StartupCriticalAsset
          );
        }
        return;
      }
      window.setTimeout(markWhenResolved, 16);
    }

    markWhenResolved();

    return () => {
      cancelled = true;
    };
  }, [assetId, texture]);

  return null;
}

export function SceneStartupController() {
  const caps = useCapsStore((state) => state.caps);

  useLayoutEffect(() => {
    if (!caps) return;
    useSceneLoadStore.getState().resetStartup();
  }, [caps]);

  useEffect(() => {
    if (!caps) return;

    let cancelled = false;
    const loadBudgetMs = caps.budgets.loadTimeMs;
    const tier = caps.tier;
    let cancelBackgroundPreloads = () => {};

    async function runWarmupSweep() {
      for (const actIndex of STARTUP_WARMUP_ACT_SEQUENCE) {
        const current = useSceneLoadStore.getState();
        if (cancelled || current.hasFallbackTriggered) {
          return;
        }

        current.setWarmupActIndex(actIndex);
        await waitForFramesOrMs(WARMUP_FRAME_COUNT, WARMUP_FRAME_WAIT_CAP_MS);
        await waitForMs(WARMUP_SETTLE_MS);

        if (cancelled) return;
        useSceneLoadStore.getState().markWarmupActReady(actIndex);
      }
    }

    async function runStartupPipeline() {
      try {
        const manifestTimeoutMs = Math.max(loadBudgetMs - 1000, 1000);
        const manifestRequests = waitForManifestRequests(manifestTimeoutMs);
        const warmupSweep = runWarmupSweep();

        await manifestRequests;

        if (cancelled) return;

        useSceneLoadStore.getState().markAssetManifestReady();

        await warmupSweep;

        if (cancelled) return;

        useSceneLoadStore.getState().setWarmupActIndex(null);
        useSceneLoadStore.getState().markWarmupReady();
        cancelBackgroundPreloads = scheduleIdleTask(() => {
          if (cancelled || useSceneLoadStore.getState().hasFallbackTriggered) {
            return;
          }
          preloadBackgroundStartupAssets(tier);
        });
      } catch (error) {
        console.warn("[SceneStartupController] Startup preload failed.", error);
        if (!cancelled) {
          useSceneLoadStore.getState().markFallbackTriggered();
        }
      }
    }

    void runStartupPipeline();

    return () => {
      cancelled = true;
      cancelBackgroundPreloads();
      useSceneLoadStore.getState().setWarmupActIndex(null);
    };
  }, [caps]);

  if (!caps) {
    return null;
  }

  return (
    <>
      {STARTUP_INTERACTIVE_PRELOAD_GROUPS.map((group) => (
        <Suspense key={group.url} fallback={null}>
          <StartupModelPreloader path={group.url} readinessIds={group.readinessIds} />
        </Suspense>
      ))}
      {STARTUP_INTERACTIVE_TEXTURE_PRELOADS.map((texture) => (
        <StartupTexturePreloader
          key={texture.id}
          assetId={texture.id}
          url={texture.url}
          repeat={texture.repeat}
          colorSpace={
            texture.colorSpace === "srgb" ? THREE.SRGBColorSpace : undefined
          }
          actIndex={texture.actIndex}
        />
      ))}
    </>
  );
}
