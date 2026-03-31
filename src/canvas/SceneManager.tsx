"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Environment } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useCapsStore, type QualityTier } from "@/stores/capsStore";
import { useSceneLoadStore } from "@/stores/sceneLoadStore";
import { useScrollStore } from "@/stores/scrollStore";
import { useViewportAuditStore } from "@/stores/viewportAuditStore";
import { SeamlessWorld } from "./SeamlessWorld";
import { resolveMountedActs } from "./runtimeMounting";
import { WORLD_PHASES, type AmbientParticleMode, type WorldPhaseProfile } from "./viewportProfiles";
import { computeCrossfadeBlend } from "@/lib/transition";

function resolveAmbientParticleMode(
  profile: WorldPhaseProfile,
  tier: QualityTier
): AmbientParticleMode {
  return profile.tierOverrides[tier]?.ambientParticleMode ?? profile.ambientParticleMode;
}

function nextPhaseIndex(index: number) {
  return (index + 1) % WORLD_PHASES.length;
}

export function SceneManager() {
  const fogRef = useRef<THREE.FogExp2>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const hemisphereRef = useRef<THREE.HemisphereLight>(null);
  const keyLightRef = useRef<THREE.DirectionalLight>(null);
  const keyTargetRef = useRef<THREE.Object3D>(null);
  const fillLightRef = useRef<THREE.PointLight>(null);
  const rimLightRef = useRef<THREE.SpotLight>(null);
  const rimTargetRef = useRef<THREE.Object3D>(null);
  const practicalLightRef = useRef<THREE.PointLight>(null);

  const activeAct = useScrollStore((state) => state.activeAct);
  const caps = useCapsStore((state) => state.caps);
  const warmupActIndex = useSceneLoadStore((state) => state.warmupActIndex);
  const warmupReady = useSceneLoadStore((state) => state.warmupReady);
  const environmentReady = useSceneLoadStore(
    (state) => state.loadedAssets["environment-kloppenheim"] ?? false
  );
  const tier = caps?.tier ?? "low";
  const auditMode = useMemo(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return new URLSearchParams(window.location.search).get("audit") === "1";
  }, []);
  const environmentMode =
    tier === "high" && environmentReady
      ? "hdri-kloppenheim-4k"
      : tier !== "low"
        ? "preset-studio"
        : "disabled";
  const mountedActLookahead = auditMode ? 0 : 1;
  const currentProfile = WORLD_PHASES[activeAct];
  const mountedHeroActs = useMemo(
    () =>
      resolveMountedActs({
        activeAct,
        totalActs: WORLD_PHASES.length,
        warmupActIndex,
        warmupReady,
        lookahead: mountedActLookahead,
      }),
    [
      activeAct,
      mountedActLookahead,
      warmupActIndex,
      warmupReady,
    ]
  );
  const mountedFxActs = useMemo(
    () =>
      resolveMountedActs({
        activeAct,
        totalActs: WORLD_PHASES.length,
        warmupActIndex,
        warmupReady,
        lookahead: mountedActLookahead,
      }),
    [
      activeAct,
      mountedActLookahead,
      warmupActIndex,
      warmupReady,
    ]
  );

  const fogColor = useMemo(() => new THREE.Color(), []);
  const keyColor = useMemo(() => new THREE.Color(), []);
  const hemiSkyColor = useMemo(() => new THREE.Color(), []);
  const hemiGroundColor = useMemo(() => new THREE.Color(), []);
  const fillColor = useMemo(() => new THREE.Color(), []);
  const rimColor = useMemo(() => new THREE.Color(), []);
  const practicalColor = useMemo(() => new THREE.Color(), []);
  const vectorFocus = useMemo(() => new THREE.Vector3(), []);
  const scratchColorA = useMemo(() => new THREE.Color(), []);
  const lastSceneStateKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (keyLightRef.current && keyTargetRef.current) {
      keyLightRef.current.target = keyTargetRef.current;
    }
    if (rimLightRef.current && rimTargetRef.current) {
      rimLightRef.current.target = rimTargetRef.current;
    }
  }, []);

  // Scene-state and prune must only re-fire when the act actually changes —
  // not when caps settle — so prune doesn't wipe heroModels right after heroes
  // start reporting on a new act.
  useEffect(() => {
    const ambientParticleMode = resolveAmbientParticleMode(currentProfile, tier);
    const audit = useViewportAuditStore.getState();
    audit.reportSceneState({
      mountedActs: mountedHeroActs,
      activeHeroLabel: currentProfile.heroLabel,
      activeHeroAsset: currentProfile.heroAsset,
      overlayMode: currentProfile.overlayMode,
      ambientParticleMode,
    });
    audit.pruneHeroModels([currentProfile.heroLabel]);
    audit.pruneFxLayers(
      activeAct === WORLD_PHASES.length - 1
        ? ["apotheosis-core"]
        : []
    );
  }, [
    activeAct,
    currentProfile,
    currentProfile.overlayMode,
    currentProfile.heroAsset,
    currentProfile.heroLabel,
    mountedHeroActs,
    tier,
  ]);

  // Lighting pipeline report is safe to re-fire on caps/tier changes because it
  // does not mutate hero model records.
  useEffect(() => {
    useViewportAuditStore.getState().reportLightingPipeline({
      exposure: currentProfile.lightingRig.exposure,
      environmentMode,
      shadowMapSize: tier === "high" && Boolean(caps?.enableShadows) ? 2048 : 0,
      ambientIntensity: currentProfile.lightingRig.ambientIntensity,
      hemisphereIntensity: Math.max(0.08, currentProfile.lightingRig.ambientIntensity * 0.9),
      keyIntensity: currentProfile.lightingRig.key.intensity,
      fillIntensity: currentProfile.lightingRig.fill.intensity,
      rimIntensity: currentProfile.lightingRig.rim.intensity,
      practicalIntensity: currentProfile.lightingRig.practical.intensity,
    });
  }, [
    currentProfile.lightingRig.ambientIntensity,
    currentProfile.lightingRig.exposure,
    currentProfile.lightingRig.fill.intensity,
    currentProfile.lightingRig.key.intensity,
    currentProfile.lightingRig.practical.intensity,
    currentProfile.lightingRig.rim.intensity,
    caps?.enableShadows,
    environmentMode,
    environmentReady,
    tier,
  ]);

  useFrame((state) => {
    const scrollState = useScrollStore.getState();
    const frameActiveAct = scrollState.activeAct;
    const frameCurrentProfile = WORLD_PHASES[frameActiveAct];
    const frameNextProfile = WORLD_PHASES[nextPhaseIndex(frameActiveAct)];
    const frameBlend = scrollState.actProgress;
    const blendT = computeCrossfadeBlend(
      frameBlend,
      frameCurrentProfile.transitionRig
    );
    const rebirthBlend =
      frameActiveAct === WORLD_PHASES.length - 1
        ? THREE.MathUtils.smoothstep(
            frameBlend,
            frameCurrentProfile.transitionRig.rebirth,
            1
          )
        : 0;
    const activeHeroLabel =
      rebirthBlend > 0.45 ? frameNextProfile.heroLabel : frameCurrentProfile.heroLabel;
    const activeHeroAsset =
      rebirthBlend > 0.45 ? frameNextProfile.heroAsset : frameCurrentProfile.heroAsset;
    const ambientParticleMode =
      rebirthBlend > 0.45
        ? resolveAmbientParticleMode(frameNextProfile, tier)
        : resolveAmbientParticleMode(frameCurrentProfile, tier);
    const sceneStateKey = [
      mountedHeroActs.join(","),
      activeHeroLabel,
      activeHeroAsset,
      frameCurrentProfile.overlayMode,
      ambientParticleMode,
    ].join("|");

    if (lastSceneStateKeyRef.current !== sceneStateKey) {
      lastSceneStateKeyRef.current = sceneStateKey;
      const audit = useViewportAuditStore.getState();
      audit.reportSceneState({
        mountedActs: mountedHeroActs,
        activeHeroLabel,
        activeHeroAsset,
        overlayMode: frameCurrentProfile.overlayMode,
        ambientParticleMode,
      });
      audit.pruneHeroModels([activeHeroLabel]);
      audit.pruneFxLayers(
        frameActiveAct === WORLD_PHASES.length - 1 ? ["apotheosis-core"] : []
      );
    }

    fogColor
      .set(frameCurrentProfile.lightingRig.fogColor)
      .lerp(scratchColorA.set(frameNextProfile.lightingRig.fogColor), blendT);
    if (fogRef.current) {
      fogRef.current.color.copy(fogColor);
      fogRef.current.density = THREE.MathUtils.lerp(
        frameCurrentProfile.lightingRig.fogDensity,
        frameNextProfile.lightingRig.fogDensity,
        blendT
      );
    }

    state.gl.toneMappingExposure = THREE.MathUtils.lerp(
      frameCurrentProfile.lightingRig.exposure,
      frameNextProfile.lightingRig.exposure,
      blendT
    );

    if (ambientRef.current) {
      ambientRef.current.intensity = THREE.MathUtils.lerp(
        frameCurrentProfile.lightingRig.ambientIntensity,
        frameNextProfile.lightingRig.ambientIntensity,
        blendT
      );
    }

    hemiSkyColor
      .set(frameCurrentProfile.accent)
      .lerp(scratchColorA.set(frameNextProfile.accent), blendT);
    hemiGroundColor
      .set(frameCurrentProfile.lightingRig.fogColor)
      .lerp(scratchColorA.set(frameNextProfile.lightingRig.fogColor), blendT);
    if (hemisphereRef.current) {
      hemisphereRef.current.color.copy(hemiSkyColor);
      hemisphereRef.current.groundColor.copy(hemiGroundColor);
      hemisphereRef.current.intensity = THREE.MathUtils.lerp(
        Math.max(0.08, frameCurrentProfile.lightingRig.ambientIntensity * 0.9),
        Math.max(0.08, frameNextProfile.lightingRig.ambientIntensity * 0.9),
        blendT
      );
    }

    vectorFocus.set(
      THREE.MathUtils.lerp(
        frameCurrentProfile.worldAnchor[0],
        frameNextProfile.worldAnchor[0],
        blendT
      ),
      THREE.MathUtils.lerp(
        frameCurrentProfile.worldAnchor[1],
        frameNextProfile.worldAnchor[1],
        blendT
      ),
      THREE.MathUtils.lerp(
        frameCurrentProfile.worldAnchor[2],
        frameNextProfile.worldAnchor[2],
        blendT
      )
    );
    if (keyTargetRef.current) {
      keyTargetRef.current.position.copy(vectorFocus);
      keyTargetRef.current.updateMatrixWorld();
    }
    if (rimTargetRef.current) {
      rimTargetRef.current.position.copy(vectorFocus);
      rimTargetRef.current.updateMatrixWorld();
    }

    keyColor
      .set(frameCurrentProfile.lightingRig.key.color)
      .lerp(scratchColorA.set(frameNextProfile.lightingRig.key.color), blendT);
    if (keyLightRef.current) {
      keyLightRef.current.color.copy(keyColor);
      keyLightRef.current.intensity = THREE.MathUtils.lerp(
        frameCurrentProfile.lightingRig.key.intensity,
        frameNextProfile.lightingRig.key.intensity,
        blendT
      );
      keyLightRef.current.position.set(
        THREE.MathUtils.lerp(
          frameCurrentProfile.lightingRig.key.position[0],
          frameNextProfile.lightingRig.key.position[0],
          blendT
        ),
        THREE.MathUtils.lerp(
          frameCurrentProfile.lightingRig.key.position[1],
          frameNextProfile.lightingRig.key.position[1],
          blendT
        ),
        THREE.MathUtils.lerp(
          frameCurrentProfile.lightingRig.key.position[2],
          frameNextProfile.lightingRig.key.position[2],
          blendT
        )
      );
    }

    fillColor
      .set(frameCurrentProfile.lightingRig.fill.color)
      .lerp(scratchColorA.set(frameNextProfile.lightingRig.fill.color), blendT);
    if (fillLightRef.current) {
      fillLightRef.current.color.copy(fillColor);
      fillLightRef.current.intensity = THREE.MathUtils.lerp(
        frameCurrentProfile.lightingRig.fill.intensity,
        frameNextProfile.lightingRig.fill.intensity,
        blendT
      );
      fillLightRef.current.position.set(
        THREE.MathUtils.lerp(
          frameCurrentProfile.lightingRig.fill.position[0],
          frameNextProfile.lightingRig.fill.position[0],
          blendT
        ),
        THREE.MathUtils.lerp(
          frameCurrentProfile.lightingRig.fill.position[1],
          frameNextProfile.lightingRig.fill.position[1],
          blendT
        ),
        THREE.MathUtils.lerp(
          frameCurrentProfile.lightingRig.fill.position[2],
          frameNextProfile.lightingRig.fill.position[2],
          blendT
        )
      );
    }

    rimColor
      .set(frameCurrentProfile.lightingRig.rim.color)
      .lerp(scratchColorA.set(frameNextProfile.lightingRig.rim.color), blendT);
    if (rimLightRef.current) {
      rimLightRef.current.color.copy(rimColor);
      rimLightRef.current.intensity = THREE.MathUtils.lerp(
        frameCurrentProfile.lightingRig.rim.intensity,
        frameNextProfile.lightingRig.rim.intensity,
        blendT
      );
      rimLightRef.current.angle = THREE.MathUtils.lerp(
        frameCurrentProfile.lightingRig.rim.angle,
        frameNextProfile.lightingRig.rim.angle,
        blendT
      );
      rimLightRef.current.position.set(
        THREE.MathUtils.lerp(
          frameCurrentProfile.lightingRig.rim.position[0],
          frameNextProfile.lightingRig.rim.position[0],
          blendT
        ),
        THREE.MathUtils.lerp(
          frameCurrentProfile.lightingRig.rim.position[1],
          frameNextProfile.lightingRig.rim.position[1],
          blendT
        ),
        THREE.MathUtils.lerp(
          frameCurrentProfile.lightingRig.rim.position[2],
          frameNextProfile.lightingRig.rim.position[2],
          blendT
        )
      );
    }

    practicalColor
      .set(frameCurrentProfile.lightingRig.practical.color)
      .lerp(scratchColorA.set(frameNextProfile.lightingRig.practical.color), blendT);
    if (practicalLightRef.current) {
      practicalLightRef.current.color.copy(practicalColor);
      practicalLightRef.current.intensity = THREE.MathUtils.lerp(
        frameCurrentProfile.lightingRig.practical.intensity,
        frameNextProfile.lightingRig.practical.intensity,
        blendT
      );
      practicalLightRef.current.position.set(
        THREE.MathUtils.lerp(
          frameCurrentProfile.lightingRig.practical.position[0],
          frameNextProfile.lightingRig.practical.position[0],
          blendT
        ),
        THREE.MathUtils.lerp(
          frameCurrentProfile.lightingRig.practical.position[1],
          frameNextProfile.lightingRig.practical.position[1],
          blendT
        ),
        THREE.MathUtils.lerp(
          frameCurrentProfile.lightingRig.practical.position[2],
          frameNextProfile.lightingRig.practical.position[2],
          blendT
        )
      );
    }
  });

  return (
    <>
      <fogExp2
        ref={fogRef}
        attach="fog"
        args={[currentProfile.lightingRig.fogColor, currentProfile.lightingRig.fogDensity]}
      />

      <ambientLight
        ref={ambientRef}
        intensity={currentProfile.lightingRig.ambientIntensity}
      />
      <hemisphereLight
        ref={hemisphereRef}
        color={currentProfile.accent}
        groundColor={currentProfile.lightingRig.fogColor}
        intensity={Math.max(0.08, currentProfile.lightingRig.ambientIntensity * 0.9)}
      />
      <object3D ref={keyTargetRef} position={currentProfile.worldAnchor} />
      <directionalLight
        ref={keyLightRef}
        position={currentProfile.lightingRig.key.position}
        intensity={currentProfile.lightingRig.key.intensity}
        color={currentProfile.lightingRig.key.color}
        castShadow={tier === "high" && Boolean(caps?.enableShadows)}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.00015}
        shadow-normalBias={0.03}
        shadow-radius={3}
        shadow-camera-near={1}
        shadow-camera-far={currentProfile.stageVolume.depth + 8}
        shadow-camera-left={-currentProfile.stageVolume.radius}
        shadow-camera-right={currentProfile.stageVolume.radius}
        shadow-camera-top={currentProfile.stageVolume.height}
        shadow-camera-bottom={-currentProfile.stageVolume.height}
      />
      <pointLight
        ref={fillLightRef}
        position={currentProfile.lightingRig.fill.position}
        intensity={currentProfile.lightingRig.fill.intensity}
        color={currentProfile.lightingRig.fill.color}
        distance={28}
        decay={2}
      />
      <object3D ref={rimTargetRef} position={currentProfile.worldAnchor} />
      <spotLight
        ref={rimLightRef}
        position={currentProfile.lightingRig.rim.position}
        intensity={currentProfile.lightingRig.rim.intensity}
        color={currentProfile.lightingRig.rim.color}
        angle={currentProfile.lightingRig.rim.angle}
        penumbra={0.92}
        distance={currentProfile.stageVolume.depth + 18}
        decay={2}
      />
      <pointLight
        ref={practicalLightRef}
        position={currentProfile.lightingRig.practical.position}
        intensity={currentProfile.lightingRig.practical.intensity}
        color={currentProfile.lightingRig.practical.color}
        distance={Math.max(14, currentProfile.stageVolume.radius * 4)}
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
        mountedHeroActIndices={mountedHeroActs}
        mountedFxActIndices={mountedFxActs}
        tier={tier}
        includeActFx={!auditMode}
        showAmbientParticles={!auditMode}
      />
    </>
  );
}
