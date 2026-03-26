"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Environment } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useCapsStore, type QualityTier } from "@/stores/capsStore";
import { useScrollStore } from "@/stores/scrollStore";
import { useViewportAuditStore } from "@/stores/viewportAuditStore";
import { SeamlessWorld } from "./SeamlessWorld";
import { WORLD_PHASES, type AmbientParticleMode, type WorldPhaseProfile } from "./viewportProfiles";
import { tupleToVector3 } from "@/lib/scene";

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
  const actProgress = useScrollStore((state) => state.actProgress);
  const caps = useCapsStore((state) => state.caps);
  const tier = caps?.tier ?? "low";
  const currentProfile = WORLD_PHASES[activeAct];
  const nextAct = nextPhaseIndex(activeAct);
  const nextProfile = WORLD_PHASES[nextAct];
  const rebirthBlend =
    activeAct === WORLD_PHASES.length - 1
      ? THREE.MathUtils.smoothstep(
          actProgress,
          currentProfile.transitionRig.rebirth,
          1
        )
      : 0;
  const activeHeroLabel =
    rebirthBlend > 0.45 ? nextProfile.heroLabel : currentProfile.heroLabel;
  const activeHeroAsset =
    rebirthBlend > 0.45 ? nextProfile.heroAsset : currentProfile.heroAsset;
  const mountedActs = useMemo(
    () => Array.from(new Set([activeAct, nextAct])),
    [activeAct, nextAct]
  );
  const ambientParticleMode =
    rebirthBlend > 0.45
      ? resolveAmbientParticleMode(nextProfile, tier)
      : resolveAmbientParticleMode(currentProfile, tier);

  const fogColor = useMemo(() => new THREE.Color(), []);
  const keyColor = useMemo(() => new THREE.Color(), []);
  const hemiSkyColor = useMemo(() => new THREE.Color(), []);
  const hemiGroundColor = useMemo(() => new THREE.Color(), []);
  const fillColor = useMemo(() => new THREE.Color(), []);
  const rimColor = useMemo(() => new THREE.Color(), []);
  const practicalColor = useMemo(() => new THREE.Color(), []);
  const vectorA = useMemo(() => new THREE.Vector3(), []);
  const vectorB = useMemo(() => new THREE.Vector3(), []);
  const vectorC = useMemo(() => new THREE.Vector3(), []);
  const vectorD = useMemo(() => new THREE.Vector3(), []);
  const vectorFocus = useMemo(() => new THREE.Vector3(), []);

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
    const audit = useViewportAuditStore.getState();
    audit.reportSceneState({
      mountedActs,
      activeHeroLabel,
      activeHeroAsset,
      overlayMode: currentProfile.overlayMode,
      ambientParticleMode,
    });
    audit.pruneHeroModels([activeHeroLabel]);
    audit.pruneFxLayers(activeAct === WORLD_PHASES.length - 1 ? ["apotheosis-core"] : []);
  }, [
    activeAct,
    activeHeroAsset,
    activeHeroLabel,
    ambientParticleMode,
    currentProfile.overlayMode,
    mountedActs,
  ]);

  // Lighting pipeline report is safe to re-fire on caps/tier changes because it
  // does not mutate hero model records.
  useEffect(() => {
    useViewportAuditStore.getState().reportLightingPipeline({
      exposure: currentProfile.lightingRig.exposure,
      environmentMode:
        tier === "high"
          ? "hdri-kloppenheim-4k"
          : tier === "medium"
            ? "preset-studio"
            : "disabled",
      shadowMapSize: tier === "high" && Boolean(caps?.enableShadows) ? 2048 : 0,
      ambientIntensity: currentProfile.lightingRig.ambientIntensity,
      hemisphereIntensity: Math.max(0.08, currentProfile.lightingRig.ambientIntensity * 0.9),
      keyIntensity: currentProfile.lightingRig.key.intensity,
      fillIntensity: currentProfile.lightingRig.fill.intensity,
      rimIntensity: currentProfile.lightingRig.rim.intensity,
      practicalIntensity: currentProfile.lightingRig.practical.intensity,
    });
  }, [
    activeAct,
    currentProfile.lightingRig.ambientIntensity,
    currentProfile.lightingRig.exposure,
    currentProfile.lightingRig.fill.intensity,
    currentProfile.lightingRig.key.intensity,
    currentProfile.lightingRig.practical.intensity,
    currentProfile.lightingRig.rim.intensity,
    caps?.enableShadows,
    tier,
  ]);

  useFrame((state) => {
    const blendT = actProgress;

    fogColor
      .set(currentProfile.lightingRig.fogColor)
      .lerp(new THREE.Color(nextProfile.lightingRig.fogColor), blendT);
    if (fogRef.current) {
      fogRef.current.color.copy(fogColor);
      fogRef.current.density = THREE.MathUtils.lerp(
        currentProfile.lightingRig.fogDensity,
        nextProfile.lightingRig.fogDensity,
        blendT
      );
    }

    state.gl.toneMappingExposure = THREE.MathUtils.lerp(
      currentProfile.lightingRig.exposure,
      nextProfile.lightingRig.exposure,
      blendT
    );

    if (ambientRef.current) {
      ambientRef.current.intensity = THREE.MathUtils.lerp(
        currentProfile.lightingRig.ambientIntensity,
        nextProfile.lightingRig.ambientIntensity,
        blendT
      );
    }

    hemiSkyColor
      .set(currentProfile.accent)
      .lerp(new THREE.Color(nextProfile.accent), blendT);
    hemiGroundColor
      .set(currentProfile.lightingRig.fogColor)
      .lerp(new THREE.Color(nextProfile.lightingRig.fogColor), blendT);
    if (hemisphereRef.current) {
      hemisphereRef.current.color.copy(hemiSkyColor);
      hemisphereRef.current.groundColor.copy(hemiGroundColor);
      hemisphereRef.current.intensity = THREE.MathUtils.lerp(
        Math.max(0.08, currentProfile.lightingRig.ambientIntensity * 0.9),
        Math.max(0.08, nextProfile.lightingRig.ambientIntensity * 0.9),
        blendT
      );
    }

    vectorFocus
      .copy(tupleToVector3(currentProfile.worldAnchor))
      .lerp(tupleToVector3(nextProfile.worldAnchor), blendT);
    if (keyTargetRef.current) {
      keyTargetRef.current.position.copy(vectorFocus);
      keyTargetRef.current.updateMatrixWorld();
    }
    if (rimTargetRef.current) {
      rimTargetRef.current.position.copy(vectorFocus);
      rimTargetRef.current.updateMatrixWorld();
    }

    keyColor
      .set(currentProfile.lightingRig.key.color)
      .lerp(new THREE.Color(nextProfile.lightingRig.key.color), blendT);
    if (keyLightRef.current) {
      keyLightRef.current.color.copy(keyColor);
      keyLightRef.current.intensity = THREE.MathUtils.lerp(
        currentProfile.lightingRig.key.intensity,
        nextProfile.lightingRig.key.intensity,
        blendT
      );
      keyLightRef.current.position.copy(
        vectorA
          .copy(tupleToVector3(currentProfile.lightingRig.key.position))
          .lerp(tupleToVector3(nextProfile.lightingRig.key.position), blendT)
      );
    }

    fillColor
      .set(currentProfile.lightingRig.fill.color)
      .lerp(new THREE.Color(nextProfile.lightingRig.fill.color), blendT);
    if (fillLightRef.current) {
      fillLightRef.current.color.copy(fillColor);
      fillLightRef.current.intensity = THREE.MathUtils.lerp(
        currentProfile.lightingRig.fill.intensity,
        nextProfile.lightingRig.fill.intensity,
        blendT
      );
      fillLightRef.current.position.copy(
        vectorB
          .copy(tupleToVector3(currentProfile.lightingRig.fill.position))
          .lerp(tupleToVector3(nextProfile.lightingRig.fill.position), blendT)
      );
    }

    rimColor
      .set(currentProfile.lightingRig.rim.color)
      .lerp(new THREE.Color(nextProfile.lightingRig.rim.color), blendT);
    if (rimLightRef.current) {
      rimLightRef.current.color.copy(rimColor);
      rimLightRef.current.intensity = THREE.MathUtils.lerp(
        currentProfile.lightingRig.rim.intensity,
        nextProfile.lightingRig.rim.intensity,
        blendT
      );
      rimLightRef.current.angle = THREE.MathUtils.lerp(
        currentProfile.lightingRig.rim.angle,
        nextProfile.lightingRig.rim.angle,
        blendT
      );
      rimLightRef.current.position.copy(
        vectorC
          .copy(tupleToVector3(currentProfile.lightingRig.rim.position))
          .lerp(tupleToVector3(nextProfile.lightingRig.rim.position), blendT)
      );
    }

    practicalColor
      .set(currentProfile.lightingRig.practical.color)
      .lerp(new THREE.Color(nextProfile.lightingRig.practical.color), blendT);
    if (practicalLightRef.current) {
      practicalLightRef.current.color.copy(practicalColor);
      practicalLightRef.current.intensity = THREE.MathUtils.lerp(
        currentProfile.lightingRig.practical.intensity,
        nextProfile.lightingRig.practical.intensity,
        blendT
      );
      practicalLightRef.current.position.copy(
        vectorD
          .copy(tupleToVector3(currentProfile.lightingRig.practical.position))
          .lerp(tupleToVector3(nextProfile.lightingRig.practical.position), blendT)
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
        {tier === "high" ? (
          <Environment files="/env/hdri/kloppenheim_07_4k.exr" background={false} />
        ) : tier === "medium" ? (
          <Environment preset="studio" background={false} />
        ) : null}
      </Suspense>

      <SeamlessWorld
        activeAct={activeAct}
        phaseBlend={actProgress}
        tier={tier}
      />
    </>
  );
}
