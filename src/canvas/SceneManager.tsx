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
  const keyLightRef = useRef<THREE.DirectionalLight>(null);
  const fillLightRef = useRef<THREE.PointLight>(null);
  const rimLightRef = useRef<THREE.SpotLight>(null);
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
  const fillColor = useMemo(() => new THREE.Color(), []);
  const rimColor = useMemo(() => new THREE.Color(), []);
  const practicalColor = useMemo(() => new THREE.Color(), []);
  const vectorA = useMemo(() => new THREE.Vector3(), []);
  const vectorB = useMemo(() => new THREE.Vector3(), []);
  const vectorC = useMemo(() => new THREE.Vector3(), []);
  const vectorD = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    const audit = useViewportAuditStore.getState();
    audit.reportSceneState({
      mountedActs,
      activeHeroLabel,
      overlayMode: currentProfile.overlayMode,
      ambientParticleMode,
    });
    audit.pruneHeroModels([activeHeroLabel]);
    audit.pruneFxLayers(activeAct === WORLD_PHASES.length - 1 ? ["apotheosis-core"] : []);
  }, [activeAct, activeHeroLabel, ambientParticleMode, currentProfile.overlayMode, mountedActs]);

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
      <directionalLight
        ref={keyLightRef}
        position={currentProfile.lightingRig.key.position}
        intensity={currentProfile.lightingRig.key.intensity}
        color={currentProfile.lightingRig.key.color}
        castShadow={tier === "high" && Boolean(caps?.enableShadows)}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.00015}
      />
      <pointLight
        ref={fillLightRef}
        position={currentProfile.lightingRig.fill.position}
        intensity={currentProfile.lightingRig.fill.intensity}
        color={currentProfile.lightingRig.fill.color}
        distance={28}
        decay={2}
      />
      <spotLight
        ref={rimLightRef}
        position={currentProfile.lightingRig.rim.position}
        intensity={currentProfile.lightingRig.rim.intensity}
        color={currentProfile.lightingRig.rim.color}
        angle={currentProfile.lightingRig.rim.angle}
        penumbra={0.92}
        distance={32}
        decay={2}
      />
      <pointLight
        ref={practicalLightRef}
        position={currentProfile.lightingRig.practical.position}
        intensity={currentProfile.lightingRig.practical.intensity}
        color={currentProfile.lightingRig.practical.color}
        distance={14}
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
