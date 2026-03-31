"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Environment } from "@react-three/drei";
import { createPortal, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { SeamlessWorld } from "./SeamlessWorld";
import { collectSceneProgramSignatures, buildMaterialProgramSignature } from "./programSignatures";
import { getWarmupAssetIdsForCheckpoint } from "./startupAssetPolicy";
import { WORLD_PHASES } from "./viewportProfiles";
import { getWarmupCheckpointDescriptor } from "./warmupCheckpoints";
import { useCapsStore } from "@/stores/capsStore";
import { useSceneLoadStore } from "@/stores/sceneLoadStore";

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

function waitForLoadedAssets(assetIds: readonly string[], timeoutMs: number) {
  return new Promise<void>((resolve, reject) => {
    if (assetIds.length === 0) {
      resolve();
      return;
    }

    const startedAt = performance.now();

    function tick() {
      const { loadedAssets, hasFallbackTriggered } = useSceneLoadStore.getState();
      const missingAssets = assetIds.filter(
        (assetId) => !loadedAssets[assetId as keyof typeof loadedAssets]
      );

      if (missingAssets.length === 0) {
        resolve();
        return;
      }

      if (hasFallbackTriggered) {
        reject(
          new Error(
            `Warmup asset load aborted for checkpoint assets: ${missingAssets.join(", ")}`
          )
        );
        return;
      }

      if (performance.now() - startedAt > timeoutMs) {
        reject(
          new Error(
            `Warmup asset load timed out: ${missingAssets.join(", ")}`
          )
        );
        return;
      }

      window.setTimeout(tick, 40);
    }

    tick();
  });
}

function countRenderableNodes(scene: Readonly<THREE.Scene>) {
  let count = 0;

  scene.traverse((node) => {
    const renderable = node as THREE.Object3D & {
      isMesh?: boolean;
      isPoints?: boolean;
      isLine?: boolean;
    };

    if (renderable.isMesh || renderable.isPoints || renderable.isLine) {
      count += 1;
    }
  });

  return count;
}

function waitForScenePopulation(scene: Readonly<THREE.Scene>, timeoutMs: number) {
  return new Promise<void>((resolve, reject) => {
    const startedAt = performance.now();

    function tick() {
      if (countRenderableNodes(scene) > 0) {
        resolve();
        return;
      }

      if (performance.now() - startedAt > timeoutMs) {
        reject(new Error("Warmup scene population timed out."));
        return;
      }

      window.setTimeout(tick, 20);
    }

    tick();
  });
}

function isWarmupRequestCurrent(requestVersion: number, checkpointId: string) {
  const state = useSceneLoadStore.getState();
  return (
    !state.hasFallbackTriggered &&
    state.offscreenWarmupRequestActive &&
    state.offscreenWarmupRequestVersion === requestVersion &&
    state.offscreenWarmupCheckpointId === checkpointId
  );
}

function collectWarmupSceneSignatures(scene: THREE.Scene) {
  const signatures = new Set(collectSceneProgramSignatures(scene));

  scene.traverse((node) => {
    const renderable = node as THREE.Object3D & {
      isMesh?: boolean;
      isPoints?: boolean;
      isLine?: boolean;
      material?: THREE.Material | THREE.Material[] | null;
    };

    if (!(renderable.isMesh || renderable.isPoints || renderable.isLine)) {
      return;
    }

    const materials = renderable.material
      ? Array.isArray(renderable.material)
        ? renderable.material
        : [renderable.material]
      : [];

    for (const material of materials) {
      if (material) {
        signatures.add(buildMaterialProgramSignature(material));
      }
    }
  });

  return Array.from(signatures).sort();
}

function waitForWarmupSceneReady(
  scene: THREE.Scene,
  checkpointId: string,
  requestVersion: number,
  timeoutMs: number
) {
  return new Promise<void>((resolve, reject) => {
    const startedAt = performance.now();
    let stableSignatureFrames = 0;
    let previousSignatureKey = "";

    function tick() {
      if (!isWarmupRequestCurrent(requestVersion, checkpointId)) {
        resolve();
        return;
      }

      const signatures = collectWarmupSceneSignatures(scene);
      const hasTroikaSignature = signatures.some((signature) =>
        signature.includes("TROIKA_DERIVED_MATERIAL")
      );
      const signatureKey = signatures.join("::");

      if (signatureKey === previousSignatureKey && signatures.length > 0) {
        stableSignatureFrames += 1;
      } else {
        previousSignatureKey = signatureKey;
        stableSignatureFrames = 1;
      }

      if (
        signatures.length > 0 &&
        (hasTroikaSignature || performance.now() - startedAt >= 320) &&
        stableSignatureFrames >= 1
      ) {
        resolve();
        return;
      }

      if (performance.now() - startedAt > timeoutMs) {
        reject(new Error(`Warmup scene signatures did not settle for checkpoint ${checkpointId}.`));
        return;
      }

      window.setTimeout(tick, 32);
    }

    window.setTimeout(tick, 32);
  });
}

function lerpColor(
  current: string,
  next: string,
  blend: number,
  target: THREE.Color
) {
  return target.set(current).lerp(new THREE.Color(next), blend);
}

function WarmupCheckpointStage({
  checkpointId,
  tier,
  environmentReady,
}: {
  checkpointId: string;
  tier: "high" | "medium" | "low";
  environmentReady: boolean;
}) {
  const checkpoint = getWarmupCheckpointDescriptor(checkpointId);
  const keyLightRef = useRef<THREE.DirectionalLight>(null);
  const keyTargetRef = useRef<THREE.Object3D>(null);
  const rimLightRef = useRef<THREE.SpotLight>(null);
  const rimTargetRef = useRef<THREE.Object3D>(null);

  useEffect(() => {
    if (!checkpoint || !keyTargetRef.current || !rimTargetRef.current) {
      return;
    }

    if (keyLightRef.current) {
      keyLightRef.current.target = keyTargetRef.current;
    }
    if (rimLightRef.current) {
      rimLightRef.current.target = rimTargetRef.current;
    }
    keyTargetRef.current.position.copy(checkpoint.snapshot.worldAnchor);
    rimTargetRef.current.position.copy(checkpoint.snapshot.worldAnchor);
  }, [checkpoint]);

  if (!checkpoint) {
    return null;
  }

  const currentProfile = WORLD_PHASES[checkpoint.activeAct];
  const nextProfile = WORLD_PHASES[checkpoint.nextAct];
  const blend = checkpoint.actProgress;
  const environmentMode =
    tier === "high" && environmentReady
      ? "hdri-kloppenheim-4k"
      : tier !== "low"
        ? "preset-studio"
        : "disabled";
  const fogColor = lerpColor(
    currentProfile.lightingRig.fogColor,
    nextProfile.lightingRig.fogColor,
    blend,
    new THREE.Color()
  );
  const hemiSky = lerpColor(
    currentProfile.accent,
    nextProfile.accent,
    blend,
    new THREE.Color()
  );
  const hemiGround = lerpColor(
    currentProfile.lightingRig.fogColor,
    nextProfile.lightingRig.fogColor,
    blend,
    new THREE.Color()
  );
  const keyColor = lerpColor(
    currentProfile.lightingRig.key.color,
    nextProfile.lightingRig.key.color,
    blend,
    new THREE.Color()
  );
  const fillColor = lerpColor(
    currentProfile.lightingRig.fill.color,
    nextProfile.lightingRig.fill.color,
    blend,
    new THREE.Color()
  );
  const rimColor = lerpColor(
    currentProfile.lightingRig.rim.color,
    nextProfile.lightingRig.rim.color,
    blend,
    new THREE.Color()
  );
  const practicalColor = lerpColor(
    currentProfile.lightingRig.practical.color,
    nextProfile.lightingRig.practical.color,
    blend,
    new THREE.Color()
  );
  const worldAnchor = checkpoint.snapshot.worldAnchor.toArray() as [
    number,
    number,
    number,
  ];

  return (
    <>
      <fogExp2
        attach="fog"
        args={[
          fogColor,
          THREE.MathUtils.lerp(
            currentProfile.lightingRig.fogDensity,
            nextProfile.lightingRig.fogDensity,
            blend
          ),
        ]}
      />
      <ambientLight
        intensity={THREE.MathUtils.lerp(
          currentProfile.lightingRig.ambientIntensity,
          nextProfile.lightingRig.ambientIntensity,
          blend
        )}
      />
      <hemisphereLight
        color={hemiSky}
        groundColor={hemiGround}
        intensity={THREE.MathUtils.lerp(
          Math.max(0.08, currentProfile.lightingRig.ambientIntensity * 0.9),
          Math.max(0.08, nextProfile.lightingRig.ambientIntensity * 0.9),
          blend
        )}
      />
      <object3D ref={keyTargetRef} position={worldAnchor} />
      <directionalLight
        ref={keyLightRef}
        position={[
          THREE.MathUtils.lerp(
            currentProfile.lightingRig.key.position[0],
            nextProfile.lightingRig.key.position[0],
            blend
          ),
          THREE.MathUtils.lerp(
            currentProfile.lightingRig.key.position[1],
            nextProfile.lightingRig.key.position[1],
            blend
          ),
          THREE.MathUtils.lerp(
            currentProfile.lightingRig.key.position[2],
            nextProfile.lightingRig.key.position[2],
            blend
          ),
        ]}
        intensity={THREE.MathUtils.lerp(
          currentProfile.lightingRig.key.intensity,
          nextProfile.lightingRig.key.intensity,
          blend
        )}
        color={keyColor}
        castShadow={tier === "high"}
      />
      <pointLight
        position={[
          THREE.MathUtils.lerp(
            currentProfile.lightingRig.fill.position[0],
            nextProfile.lightingRig.fill.position[0],
            blend
          ),
          THREE.MathUtils.lerp(
            currentProfile.lightingRig.fill.position[1],
            nextProfile.lightingRig.fill.position[1],
            blend
          ),
          THREE.MathUtils.lerp(
            currentProfile.lightingRig.fill.position[2],
            nextProfile.lightingRig.fill.position[2],
            blend
          ),
        ]}
        intensity={THREE.MathUtils.lerp(
          currentProfile.lightingRig.fill.intensity,
          nextProfile.lightingRig.fill.intensity,
          blend
        )}
        color={fillColor}
        distance={28}
        decay={2}
      />
      <object3D ref={rimTargetRef} position={worldAnchor} />
      <spotLight
        ref={rimLightRef}
        position={[
          THREE.MathUtils.lerp(
            currentProfile.lightingRig.rim.position[0],
            nextProfile.lightingRig.rim.position[0],
            blend
          ),
          THREE.MathUtils.lerp(
            currentProfile.lightingRig.rim.position[1],
            nextProfile.lightingRig.rim.position[1],
            blend
          ),
          THREE.MathUtils.lerp(
            currentProfile.lightingRig.rim.position[2],
            nextProfile.lightingRig.rim.position[2],
            blend
          ),
        ]}
        intensity={THREE.MathUtils.lerp(
          currentProfile.lightingRig.rim.intensity,
          nextProfile.lightingRig.rim.intensity,
          blend
        )}
        color={rimColor}
        angle={THREE.MathUtils.lerp(
          currentProfile.lightingRig.rim.angle,
          nextProfile.lightingRig.rim.angle,
          blend
        )}
        penumbra={0.92}
        distance={Math.max(
          currentProfile.stageVolume.depth,
          nextProfile.stageVolume.depth
        ) + 18}
        decay={2}
      />
      <pointLight
        position={[
          THREE.MathUtils.lerp(
            currentProfile.lightingRig.practical.position[0],
            nextProfile.lightingRig.practical.position[0],
            blend
          ),
          THREE.MathUtils.lerp(
            currentProfile.lightingRig.practical.position[1],
            nextProfile.lightingRig.practical.position[1],
            blend
          ),
          THREE.MathUtils.lerp(
            currentProfile.lightingRig.practical.position[2],
            nextProfile.lightingRig.practical.position[2],
            blend
          ),
        ]}
        intensity={THREE.MathUtils.lerp(
          currentProfile.lightingRig.practical.intensity,
          nextProfile.lightingRig.practical.intensity,
          blend
        )}
        color={practicalColor}
        distance={Math.max(
          14,
          currentProfile.stageVolume.radius * 4,
          nextProfile.stageVolume.radius * 4
        )}
        decay={2}
      />
      <Suspense fallback={null}>
        {environmentMode === "hdri-kloppenheim-4k" ? (
          <Environment files="/env/hdri/kloppenheim_07_4k.exr" background={false} />
        ) : environmentMode === "preset-studio" ? (
          <Environment preset="studio" background={false} />
        ) : null}
      </Suspense>
      <SeamlessWorld
        mountedHeroActIndices={checkpoint.mountedActIndices}
        mountedFxActIndices={checkpoint.mountedActIndices}
        tier={tier}
        snapshotOverride={checkpoint.snapshot}
        auditEnabled={false}
        warmupVisibleUi
        includeWarmedHeroActs
      />
    </>
  );
}

function WarmupCheckpointCompiler({
  checkpointId,
  requestVersion,
}: {
  checkpointId: string;
  requestVersion: number;
}) {
  const { gl } = useThree();
  const portalScene = useMemo(() => new THREE.Scene(), []);
  const warmupCamera = useMemo(() => new THREE.PerspectiveCamera(), []);
  const midPortalScene = useMemo(() => new THREE.Scene(), []);
  const midWarmupCamera = useMemo(() => new THREE.PerspectiveCamera(), []);
  const tailPortalScene = useMemo(() => new THREE.Scene(), []);
  const tailWarmupCamera = useMemo(() => new THREE.PerspectiveCamera(), []);
  const warmupTargetRef = useRef<THREE.WebGLRenderTarget | null>(null);
  const checkpoint = getWarmupCheckpointDescriptor(checkpointId);
  const tailCheckpoint = useMemo(
    () => (checkpointId === "cp-0.54" ? getWarmupCheckpointDescriptor("cp-0.88") : checkpointId === "cp-0.71" ? getWarmupCheckpointDescriptor("cp-0.88") : null),
    [checkpointId]
  );
  const midCheckpoint = useMemo(
    () => (checkpointId === "cp-0.54" ? getWarmupCheckpointDescriptor("cp-0.71") : null),
    [checkpointId]
  );
  const tier = useCapsStore((state) => state.caps?.tier ?? "low");
  const environmentReady = useSceneLoadStore(
    (state) => state.loadedAssets["environment-kloppenheim"] ?? false
  );

  useEffect(() => {
    const target = new THREE.WebGLRenderTarget(64, 64, {
      depthBuffer: true,
      stencilBuffer: false,
    });
    warmupTargetRef.current = target;

    return () => {
      warmupTargetRef.current?.dispose();
      warmupTargetRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!checkpoint) {
      return;
    }

    let cancelled = false;

    async function compileWarmupScene() {
      const store = useSceneLoadStore.getState();
      if (store.compiledWarmupCheckpointIds.includes(checkpoint.id)) {
        return;
      }

      const requiredAssetIds = Array.from(
        new Set([
          ...getWarmupAssetIdsForCheckpoint(checkpoint.id, tier),
          ...(midCheckpoint
            ? getWarmupAssetIdsForCheckpoint(midCheckpoint.id, tier)
            : []),
          ...(tailCheckpoint
            ? getWarmupAssetIdsForCheckpoint(tailCheckpoint.id, tier)
            : []),
        ])
      );
      await waitForLoadedAssets(requiredAssetIds, 20_000);
      if (cancelled || !isWarmupRequestCurrent(requestVersion, checkpoint.id)) {
        return;
      }

      await waitForScenePopulation(portalScene, 4_000);
      if (midCheckpoint) {
        await waitForScenePopulation(midPortalScene, 4_000);
      }
      if (tailCheckpoint) {
        await waitForScenePopulation(tailPortalScene, 4_000);
      }
      if (cancelled || !isWarmupRequestCurrent(requestVersion, checkpoint.id)) {
        return;
      }

      await waitForAnimationFrames(1);
      if (cancelled || !isWarmupRequestCurrent(requestVersion, checkpoint.id)) {
        return;
      }

      await waitForWarmupSceneReady(
        portalScene,
        checkpoint.id,
        requestVersion,
        1_200
      );
      if (midCheckpoint) {
        await waitForWarmupSceneReady(
          midPortalScene,
          checkpoint.id,
          requestVersion,
          1_200
        );
      }
      if (tailCheckpoint) {
        await waitForWarmupSceneReady(
          tailPortalScene,
          checkpoint.id,
          requestVersion,
          1_200
        );
      }
      if (cancelled || !isWarmupRequestCurrent(requestVersion, checkpoint.id)) {
        return;
      }

      const renderer = gl as THREE.WebGLRenderer;
      const previousTarget = renderer.getRenderTarget();
      const previousExposure = renderer.toneMappingExposure;

      async function compileCheckpointScene(
        targetCheckpoint: NonNullable<typeof checkpoint>,
        scene: THREE.Scene,
        camera: THREE.PerspectiveCamera
      ) {
        const currentProfile = WORLD_PHASES[targetCheckpoint.activeAct];
        const nextProfile = WORLD_PHASES[targetCheckpoint.nextAct];
        const targetExposure = THREE.MathUtils.lerp(
          currentProfile.lightingRig.exposure,
          nextProfile.lightingRig.exposure,
          targetCheckpoint.actProgress
        );

        camera.position.copy(targetCheckpoint.camera.position);
        camera.lookAt(targetCheckpoint.camera.lookAt);
        camera.fov = targetCheckpoint.camera.fov;
        camera.near = 0.1;
        camera.far = 200;
        camera.updateProjectionMatrix();
        camera.updateMatrixWorld();
        scene.updateMatrixWorld(true);
        renderer.toneMappingExposure = targetExposure;

        renderer.compile(scene, camera);

        const warmupTarget = warmupTargetRef.current;
        if (!warmupTarget) {
          return;
        }

        renderer.setRenderTarget(warmupTarget);
        renderer.clear();
        renderer.render(scene, camera);
      }

      try {
        await compileCheckpointScene(checkpoint, portalScene, warmupCamera);
        if (cancelled || !isWarmupRequestCurrent(requestVersion, checkpoint.id)) {
          return;
        }
        if (midCheckpoint) {
          await compileCheckpointScene(
            midCheckpoint,
            midPortalScene,
            midWarmupCamera
          );
          if (cancelled || !isWarmupRequestCurrent(requestVersion, checkpoint.id)) {
            return;
          }
        }
        if (tailCheckpoint) {
          await compileCheckpointScene(
            tailCheckpoint,
            tailPortalScene,
            tailWarmupCamera
          );
        }

        renderer.setRenderTarget(previousTarget);
      } finally {
        renderer.toneMappingExposure = previousExposure;
        renderer.setRenderTarget(previousTarget);
      }

      if (cancelled || !isWarmupRequestCurrent(requestVersion, checkpoint.id)) {
        return;
      }

      for (const actIndex of checkpoint.coverageActIndices) {
        store.markActPrepared(actIndex);
        store.markActCompiled(actIndex);
      }
      store.markWarmupCheckpointCompiled(
        checkpoint.id,
        collectWarmupSceneSignatures(portalScene)
      );
      if (midCheckpoint) {
        for (const actIndex of midCheckpoint.coverageActIndices) {
          store.markActPrepared(actIndex);
          store.markActCompiled(actIndex);
        }
        store.markWarmupCheckpointCompiled(
          midCheckpoint.id,
          collectWarmupSceneSignatures(midPortalScene)
        );
      }
      if (tailCheckpoint) {
        for (const actIndex of tailCheckpoint.coverageActIndices) {
          store.markActPrepared(actIndex);
          store.markActCompiled(actIndex);
        }
        store.markWarmupCheckpointCompiled(
          tailCheckpoint.id,
          collectWarmupSceneSignatures(tailPortalScene)
        );
      }
      store.clearOffscreenWarmupRequest();
    }

    void compileWarmupScene();

    return () => {
      cancelled = true;
    };
  }, [
    checkpoint,
    checkpointId,
    gl,
    midCheckpoint,
    midPortalScene,
    midWarmupCamera,
    portalScene,
    requestVersion,
    tailCheckpoint,
    tailPortalScene,
    tailWarmupCamera,
    tier,
    warmupCamera,
  ]);

  if (!checkpoint) {
    return null;
  }

  return (
    <>
      {createPortal(
        <WarmupCheckpointStage
          checkpointId={checkpoint.id}
          tier={tier}
          environmentReady={environmentReady}
        />,
        portalScene
      )}
      {midCheckpoint
        ? createPortal(
            <WarmupCheckpointStage
              checkpointId={midCheckpoint.id}
              tier={tier}
              environmentReady={environmentReady}
            />,
            midPortalScene
          )
        : null}
      {tailCheckpoint
        ? createPortal(
            <WarmupCheckpointStage
              checkpointId={tailCheckpoint.id}
              tier={tier}
              environmentReady={environmentReady}
            />,
            tailPortalScene
          )
        : null}
    </>
  );
}

export function SceneWarmupHost() {
  const checkpointId = useSceneLoadStore(
    (state) => state.offscreenWarmupCheckpointId
  );
  const requestActive = useSceneLoadStore(
    (state) => state.offscreenWarmupRequestActive
  );
  const requestVersion = useSceneLoadStore(
    (state) => state.offscreenWarmupRequestVersion
  );

  if (!requestActive || checkpointId == null || requestVersion <= 0) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <WarmupCheckpointCompiler
        key={`${checkpointId}-${requestVersion}`}
        checkpointId={checkpointId}
        requestVersion={requestVersion}
      />
    </Suspense>
  );
}
