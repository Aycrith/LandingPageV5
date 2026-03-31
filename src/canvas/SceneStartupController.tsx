"use client";

import { Suspense, useEffect, useLayoutEffect, useMemo } from "react";
import { useEnvironment, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import {
  ENTRY_WARMUP_ACT_SEQUENCE,
  STARTUP_DEFERRED_PRELOAD_GROUPS,
  STARTUP_DEFERRED_TEXTURE_PRELOADS,
  STARTUP_ENTRY_CRITICAL_PRELOAD_GROUPS,
  STARTUP_ENTRY_CRITICAL_TEXTURE_PRELOADS,
  STARTUP_NEAR_SCROLL_PRELOAD_GROUPS,
  STARTUP_NEAR_SCROLL_TEXTURE_PRELOADS,
  resolveTextureVariantUrl,
  type StartupAssetId,
} from "./assetManifest";
import { getEffectiveStartupAssetIdsForStage } from "./startupAssetPolicy";
import {
  DEFERRED_WARMUP_CHECKPOINT_QUEUE,
} from "./warmupCheckpoints";
import {
  getTextureSamplingOptions,
  resolveActMaterialTierConfig,
} from "./acts/materialTierConfig";
import { useCapsStore } from "@/stores/capsStore";
import { useSceneLoadStore } from "@/stores/sceneLoadStore";
import { useScrollStore } from "@/stores/scrollStore";
import { useOptionalRepeatingTexture } from "@/lib/textures";

function waitForLoadedAssets(
  assetIds: readonly StartupAssetId[],
  timeoutMs: number
) {
  return new Promise<void>((resolve, reject) => {
    if (assetIds.length === 0) {
      resolve();
      return;
    }

    const startedAt = performance.now();

    function tick() {
      const { loadedAssets } = useSceneLoadStore.getState();
      const missingAssets = assetIds.filter((assetId) => !loadedAssets[assetId]);

      if (missingAssets.length === 0) {
        resolve();
        return;
      }

      if (performance.now() - startedAt > timeoutMs) {
        reject(
          new Error(
            `Startup asset readiness timed out: ${missingAssets.join(", ")}`
          )
        );
        return;
      }

      window.setTimeout(tick, 40);
    }

    tick();
  });
}

function markAssetsReady(ids: readonly StartupAssetId[]) {
  const store = useSceneLoadStore.getState();
  ids.forEach((id) => store.markStartupAssetReady(id));
}

function waitForAnimationFrames(frameCount: number) {
  return new Promise<void>((resolve) => {
    let framesRemaining = frameCount;
    let settled = false;

    function tick() {
      if (settled) {
        return;
      }
      framesRemaining -= 1;
      if (framesRemaining <= 0) {
        settled = true;
        resolve();
        return;
      }
      window.requestAnimationFrame(tick);
    }

    window.requestAnimationFrame(tick);
    window.setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      resolve();
    }, Math.max(32, frameCount * 32));
  });
}

function waitForTimeout(durationMs: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, durationMs);
  });
}

function waitForWarmupCheckpointReady(
  checkpointId: string,
  timeoutMs: number,
  requestVersion: number,
  baselineScrollSequence: number
) {
  return new Promise<"compiled" | "interrupted">((resolve, reject) => {
    const startedAt = performance.now();

    function tick() {
      const state = useSceneLoadStore.getState();
      const scrollState = useScrollStore.getState();

      if (state.compiledWarmupCheckpointIds.includes(checkpointId)) {
        resolve("compiled");
        return;
      }

      if (
        state.offscreenWarmupRequestVersion !== requestVersion ||
        scrollState.sequence !== baselineScrollSequence
      ) {
        resolve("interrupted");
        return;
      }

      if (state.hasFallbackTriggered) {
        reject(new Error(`Warmup fallback triggered for checkpoint ${checkpointId}.`));
        return;
      }

      if (performance.now() - startedAt > timeoutMs) {
        reject(new Error(`Warmup checkpoint ${checkpointId} timed out.`));
        return;
      }

      window.setTimeout(tick, 40);
    }

    tick();
  });
}

function waitForStableFrameReady(timeoutMs: number) {
  return new Promise<void>((resolve, reject) => {
    const startedAt = performance.now();

    function tick() {
      const state = useSceneLoadStore.getState();

      if (state.stableFrameReady) {
        resolve();
        return;
      }

      if (state.hasFallbackTriggered) {
        reject(new Error("Startup fallback triggered before deferred warmup began."));
        return;
      }

      if (performance.now() - startedAt > timeoutMs) {
        reject(new Error("Timed out waiting for stable frames before deferred warmup."));
        return;
      }

      window.setTimeout(tick, 40);
    }

    tick();
  });
}

function waitForDeferredWarmupWindow(
  timeoutMs: number,
  idleMs = 250
) {
  return new Promise<void>((resolve, reject) => {
    const startedAt = performance.now();

    function tick() {
      const sceneState = useSceneLoadStore.getState();
      const scrollState = useScrollStore.getState();
      const updatedAt = scrollState.updatedAt ?? 0;
      const now = performance.now();
      const idleForMs =
        updatedAt === 0 ? Number.POSITIVE_INFINITY : Math.max(now - updatedAt, 0);
      if (idleForMs >= idleMs) {
        resolve();
        return;
      }

      if (sceneState.hasFallbackTriggered) {
        reject(new Error("Startup fallback triggered while waiting for scroll idle."));
        return;
      }

      if (now - startedAt > timeoutMs) {
        reject(new Error("Timed out waiting for a deferred warmup idle window."));
        return;
      }

      window.setTimeout(tick, 40);
    }

    tick();
  });
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

function StartupEnvironmentPreloader({
  path,
  readinessIds,
}: {
  path: string;
  readinessIds: readonly StartupAssetId[];
}) {
  useEnvironment({ files: path });

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
  const tierConfig = useMemo(
    () => (actIndex != null ? resolveActMaterialTierConfig(actIndex, tier) : null),
    [actIndex, tier]
  );
  const resolvedUrl = useMemo(() => {
    if (!tierConfig) {
      return url;
    }

    if (assetId.endsWith("-color")) {
      return tierConfig.texture.useColorMap
        ? resolveTextureVariantUrl(url, tierConfig.texture.resolution)
        : null;
    }

    if (assetId.endsWith("-normal")) {
      return tierConfig.texture.useNormalMap ? url : null;
    }

    if (assetId.endsWith("-roughness")) {
      return tierConfig.texture.useRoughnessMap ? url : null;
    }

    if (assetId.endsWith("-metalness")) {
      return tierConfig.texture.useMetalnessMap ? url : null;
    }

    return url;
  }, [assetId, tierConfig, url]);
  const options = useMemo(() => {
    if (tierConfig == null) {
      return colorSpace ? { repeat, colorSpace } : { repeat };
    }

    return getTextureSamplingOptions(tierConfig.texture, { repeat, colorSpace });
  }, [colorSpace, repeat, tierConfig]);

  const texture = useOptionalRepeatingTexture(resolvedUrl, options);

  useEffect(() => {
    let cancelled = false;

    if (resolvedUrl == null) {
      useSceneLoadStore.getState().markStartupAssetReady(assetId);
      return;
    }

    function isTextureResolved() {
      if (!texture) {
        return false;
      }
      const sourceData = texture.source?.data;
      const imageData = texture.image;
      return Boolean(sourceData ?? imageData);
    }

    function markWhenResolved() {
      if (cancelled) return;
      if (isTextureResolved()) {
        useSceneLoadStore.getState().markStartupAssetReady(assetId);
        return;
      }
      window.setTimeout(markWhenResolved, 16);
    }

    markWhenResolved();

    return () => {
      cancelled = true;
    };
  }, [assetId, resolvedUrl, texture]);

  return null;
}

export function SceneStartupController() {
  const caps = useCapsStore((state) => state.caps);
  const auditMode = useMemo(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("audit") === "1",
    []
  );

  useLayoutEffect(() => {
    if (!caps) return;
    useSceneLoadStore.getState().resetStartup();
  }, [caps]);

  async function runCheckpointWarmupSweep(
    checkpoints: readonly { id: string; activeAct: number }[],
    timeoutMs: number
  ) {
    for (const checkpoint of checkpoints) {
      const current = useSceneLoadStore.getState();
      if (
        current.hasFallbackTriggered ||
        current.compiledWarmupCheckpointIds.includes(checkpoint.id)
      ) {
        if (current.hasFallbackTriggered) {
          return;
        }
        continue;
      }

      let checkpointCompiled = false;

      while (!checkpointCompiled) {
        const scrollState = useScrollStore.getState();
        const immediateWarmupWindow =
          Math.abs(scrollState.progress) <= 0.001 && scrollState.direction === 0;
        if (!immediateWarmupWindow) {
          await waitForDeferredWarmupWindow(timeoutMs);
        }

        const store = useSceneLoadStore.getState();
        if (
          store.hasFallbackTriggered ||
          store.compiledWarmupCheckpointIds.includes(checkpoint.id)
        ) {
          checkpointCompiled = true;
          break;
        }

        const baselineScrollSequence = useScrollStore.getState().sequence;
        const requestVersion = store.requestOffscreenWarmup(
          checkpoint.id,
          checkpoint.activeAct
        );
        const result = await waitForWarmupCheckpointReady(
          checkpoint.id,
          timeoutMs,
          requestVersion,
          baselineScrollSequence
        );

        if (result === "compiled") {
          checkpointCompiled = true;
          if (!immediateWarmupWindow) {
            await waitForAnimationFrames(1);
            await waitForTimeout(40);
          }
        } else {
          useSceneLoadStore.getState().clearOffscreenWarmupRequest();
          await waitForAnimationFrames(1);
        }
      }
    }

    const store = useSceneLoadStore.getState();
    store.clearOffscreenWarmupRequest();
  }

  useEffect(() => {
    if (!caps) return;

    const runtimeCaps = caps;
    let cancelled = false;
    const loadBudgetMs = runtimeCaps.budgets.loadTimeMs;
    const backgroundWarmupQueue = auditMode
      ? DEFERRED_WARMUP_CHECKPOINT_QUEUE
      : [];

    async function runStartupPipeline() {
      try {
        const [entryActIndex] = ENTRY_WARMUP_ACT_SEQUENCE;
        const manifestTimeoutMs = Math.max(loadBudgetMs - 1000, 1000);
        const effectiveEntryCriticalAssetIds = getEffectiveStartupAssetIdsForStage(
          "entryCritical",
          runtimeCaps.tier
        );
        const effectiveNearScrollAssetIds = getEffectiveStartupAssetIdsForStage(
          "nearScrollCritical",
          runtimeCaps.tier
        );
        const entryManifestRequests = waitForLoadedAssets(
          effectiveEntryCriticalAssetIds,
          manifestTimeoutMs
        );
        const nearScrollRequests = waitForLoadedAssets(
          effectiveNearScrollAssetIds,
          loadBudgetMs + 1500
        )
          .then(() => {
            if (!cancelled) {
              useSceneLoadStore.getState().markNearScrollReady();
            }
          })
          .catch((error) => {
            console.warn("[SceneStartupController] Near-scroll preload lagged.", error);
          });
        const deferredAssetIds = auditMode
          ? getEffectiveStartupAssetIdsForStage("deferred", runtimeCaps.tier)
          : [];
        const deferredWarmupTimeoutMs = Math.max(loadBudgetMs * 6, 30_000);
        const store = useSceneLoadStore.getState();
        if (backgroundWarmupQueue.length > 0 || deferredAssetIds.length > 0) {
          store.markDeferredPreloadStarted();
        }
        void Promise.all([
          deferredAssetIds.length > 0
            ? waitForLoadedAssets(deferredAssetIds, deferredWarmupTimeoutMs)
            : Promise.resolve(),
          backgroundWarmupQueue.length > 0
            ? waitForStableFrameReady(deferredWarmupTimeoutMs).then(() =>
                runCheckpointWarmupSweep(backgroundWarmupQueue, deferredWarmupTimeoutMs)
              )
            : Promise.resolve(),
        ])
          .then(() => {
            if (!cancelled) {
              useSceneLoadStore.getState().markDeferredPreloadReady();
            }
          })
          .catch((error) => {
            console.warn("[SceneStartupController] Deferred preload lagged.", error);
          });

        await Promise.all([entryManifestRequests, nearScrollRequests]);

        if (cancelled) return;

        store.markAssetManifestReady();
        if (entryActIndex != null) {
          store.markActPrepared(entryActIndex);
          store.markActCompiled(entryActIndex);
          store.markWarmupActReady(entryActIndex);
        }
        store.markWarmupActReady(1);
        store.markWarmupReady();
        store.markCompileReady();
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
      useSceneLoadStore.getState().setWarmupActIndex(null);
      useSceneLoadStore.getState().setOffscreenWarmupActIndex(null);
      useSceneLoadStore.getState().setOffscreenWarmupCheckpointId(null);
    };
  }, [auditMode, caps]);

  if (!caps) {
    return null;
  }

  return (
    <>
      {STARTUP_ENTRY_CRITICAL_PRELOAD_GROUPS.map((group) => (
        <Suspense key={group.url} fallback={null}>
          {group.kind === "environment" ? (
            <StartupEnvironmentPreloader
              path={group.url}
              readinessIds={group.readinessIds}
            />
          ) : (
            <StartupModelPreloader path={group.url} readinessIds={group.readinessIds} />
          )}
        </Suspense>
      ))}
      {STARTUP_ENTRY_CRITICAL_TEXTURE_PRELOADS.map((texture) => (
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
      {STARTUP_NEAR_SCROLL_PRELOAD_GROUPS.map((group) => (
        <Suspense key={group.url} fallback={null}>
          {group.kind === "environment" ? (
            <StartupEnvironmentPreloader
              path={group.url}
              readinessIds={group.readinessIds}
            />
          ) : (
            <StartupModelPreloader path={group.url} readinessIds={group.readinessIds} />
          )}
        </Suspense>
      ))}
      {STARTUP_NEAR_SCROLL_TEXTURE_PRELOADS.map((texture) => (
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
      {auditMode
        ? STARTUP_DEFERRED_PRELOAD_GROUPS.map((group) => (
            <Suspense key={group.url} fallback={null}>
              {group.kind === "environment" ? (
                <StartupEnvironmentPreloader
                  path={group.url}
                  readinessIds={group.readinessIds}
                />
              ) : (
                <StartupModelPreloader
                  path={group.url}
                  readinessIds={group.readinessIds}
                />
              )}
            </Suspense>
          ))
        : null}
      {auditMode
        ? STARTUP_DEFERRED_TEXTURE_PRELOADS.map((texture) => (
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
          ))
        : null}
    </>
  );
}
