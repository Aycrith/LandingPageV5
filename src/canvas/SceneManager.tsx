"use client";

import { useEffect, useMemo, Suspense, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";
import { useScrollStore } from "@/stores/scrollStore";
import { useCapsStore, type QualityTier } from "@/stores/capsStore";
import { useViewportAuditStore } from "@/stores/viewportAuditStore";
import { ParticleField } from "./particles/ParticleField";
import { SkyBox } from "./environment/SkyBox";
import { Act1Emergence } from "./acts/Act1Emergence";
import { Act2Structure } from "./acts/Act2Structure";
import { Act3Flow } from "./acts/Act3Flow";
import { Act4Quantum } from "./acts/Act4Quantum";
import { Act5Convergence } from "./acts/Act5Convergence";
import {
  ACT_VIEWPORT_PROFILES,
  type AmbientParticleMode,
  type ActViewportProfile,
} from "./viewportProfiles";
import { tupleToVector3 } from "@/lib/scene";

const ACT_FX_LABELS: ReadonlyArray<readonly string[]> = [
  ["act1-glow"],
  [],
  [],
  [],
  ["act5-inner-core"],
];

function resolveRenderRange(profile: ActViewportProfile, tier: QualityTier): number {
  return profile.tierOverrides[tier]?.renderRange ?? (tier === "high" ? 1 : 0);
}

function resolveAmbientParticleMode(
  profile: ActViewportProfile,
  tier: QualityTier
): AmbientParticleMode {
  return profile.tierOverrides[tier]?.ambientParticleMode ?? profile.ambientParticleMode;
}

export function SceneManager() {
  const fogRef = useRef<THREE.FogExp2>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const keyLightRef = useRef<THREE.DirectionalLight>(null);
  const fillLightRef = useRef<THREE.PointLight>(null);
  const rimLightRef = useRef<THREE.SpotLight>(null);

  const activeAct = useScrollStore((state) => state.activeAct);
  const actProgress = useScrollStore((state) => state.actProgress);
  const caps = useCapsStore((state) => state.caps);

  const tier = caps?.tier ?? "low";
  const activeProfile = ACT_VIEWPORT_PROFILES[activeAct];
  const renderRange = resolveRenderRange(activeProfile, tier);
  const mountedActs = useMemo(
    () =>
      ACT_VIEWPORT_PROFILES.filter((profile) =>
        Math.abs(profile.id - activeAct) <= renderRange
      ).map((profile) => profile.id),
    [activeAct, renderRange]
  );
  const mountedActsKey = mountedActs.join(",");
  const ambientParticleMode = resolveAmbientParticleMode(activeProfile, tier);

  const fogColors = useMemo(
    () =>
      ACT_VIEWPORT_PROFILES.map((profile) => new THREE.Color(profile.lightRig.fogColor)),
    []
  );
  const keyColors = useMemo(
    () =>
      ACT_VIEWPORT_PROFILES.map((profile) => new THREE.Color(profile.lightRig.key.color)),
    []
  );
  const fillColors = useMemo(
    () =>
      ACT_VIEWPORT_PROFILES.map((profile) => new THREE.Color(profile.lightRig.fill.color)),
    []
  );
  const rimColors = useMemo(
    () =>
      ACT_VIEWPORT_PROFILES.map((profile) => new THREE.Color(profile.lightRig.rim.color)),
    []
  );
  const blendFog = useMemo(() => new THREE.Color(), []);
  const blendKey = useMemo(() => new THREE.Color(), []);
  const blendFill = useMemo(() => new THREE.Color(), []);
  const blendRim = useMemo(() => new THREE.Color(), []);
  const vectorA = useMemo(() => new THREE.Vector3(), []);
  const vectorB = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    const store = useViewportAuditStore.getState();
    store.reportSceneState({
      mountedActs,
      activeHeroLabel: activeProfile.heroLabel,
      overlayMode: activeProfile.overlayMode,
      ambientParticleMode,
    });
    store.pruneHeroModels([activeProfile.heroLabel]);
    store.pruneFxLayers([...ACT_FX_LABELS[activeAct]]);
  }, [
    activeAct,
    activeProfile.heroLabel,
    activeProfile.overlayMode,
    ambientParticleMode,
    mountedActs,
    mountedActsKey,
  ]);

  useFrame(() => {
    const nextAct = Math.min(activeAct + 1, ACT_VIEWPORT_PROFILES.length - 1);
    const currentProfile = ACT_VIEWPORT_PROFILES[activeAct];
    const nextProfile = ACT_VIEWPORT_PROFILES[nextAct];
    const blendT = actProgress;

    blendFog.copy(fogColors[activeAct]).lerp(fogColors[nextAct], blendT);
    if (fogRef.current) {
      fogRef.current.color.copy(blendFog);
      fogRef.current.density = THREE.MathUtils.lerp(
        currentProfile.lightRig.fogDensity,
        nextProfile.lightRig.fogDensity,
        blendT
      );
    }

    if (ambientRef.current) {
      ambientRef.current.intensity = THREE.MathUtils.lerp(
        currentProfile.lightRig.ambientIntensity,
        nextProfile.lightRig.ambientIntensity,
        blendT
      );
    }

    blendKey.copy(keyColors[activeAct]).lerp(keyColors[nextAct], blendT);
    if (keyLightRef.current) {
      keyLightRef.current.color.copy(blendKey);
      keyLightRef.current.intensity = THREE.MathUtils.lerp(
        currentProfile.lightRig.key.intensity,
        nextProfile.lightRig.key.intensity,
        blendT
      );
      keyLightRef.current.position.copy(
        vectorA
          .copy(tupleToVector3(currentProfile.lightRig.key.position))
          .lerp(tupleToVector3(nextProfile.lightRig.key.position), blendT)
      );
    }

    blendFill.copy(fillColors[activeAct]).lerp(fillColors[nextAct], blendT);
    if (fillLightRef.current) {
      fillLightRef.current.color.copy(blendFill);
      fillLightRef.current.intensity = THREE.MathUtils.lerp(
        currentProfile.lightRig.fill.intensity,
        nextProfile.lightRig.fill.intensity,
        blendT
      );
      fillLightRef.current.position.copy(
        vectorB
          .copy(tupleToVector3(currentProfile.lightRig.fill.position))
          .lerp(tupleToVector3(nextProfile.lightRig.fill.position), blendT)
      );
    }

    blendRim.copy(rimColors[activeAct]).lerp(rimColors[nextAct], blendT);
    if (rimLightRef.current) {
      rimLightRef.current.color.copy(blendRim);
      rimLightRef.current.intensity = THREE.MathUtils.lerp(
        currentProfile.lightRig.rim.intensity,
        nextProfile.lightRig.rim.intensity,
        blendT
      );
      rimLightRef.current.angle = THREE.MathUtils.lerp(
        currentProfile.lightRig.rim.angle,
        nextProfile.lightRig.rim.angle,
        blendT
      );
      rimLightRef.current.position.lerpVectors(
        tupleToVector3(currentProfile.lightRig.rim.position),
        tupleToVector3(nextProfile.lightRig.rim.position),
        blendT
      );
    }
  });

  const shouldRenderAct = (actIndex: number): boolean =>
    Math.abs(activeAct - actIndex) <= renderRange;

  return (
    <>
      <fogExp2
        ref={fogRef}
        attach="fog"
        args={[activeProfile.lightRig.fogColor, activeProfile.lightRig.fogDensity]}
      />

      <ambientLight ref={ambientRef} intensity={activeProfile.lightRig.ambientIntensity} />
      <directionalLight
        ref={keyLightRef}
        position={activeProfile.lightRig.key.position}
        intensity={activeProfile.lightRig.key.intensity}
        color={activeProfile.lightRig.key.color}
        castShadow={caps?.enableShadows}
        shadow-mapSize-width={tier === "high" ? 2048 : 1024}
        shadow-mapSize-height={tier === "high" ? 2048 : 1024}
        shadow-bias={-0.00012}
      />
      <pointLight
        ref={fillLightRef}
        position={activeProfile.lightRig.fill.position}
        intensity={activeProfile.lightRig.fill.intensity}
        color={activeProfile.lightRig.fill.color}
        distance={34}
        decay={2}
      />
      <spotLight
        ref={rimLightRef}
        position={activeProfile.lightRig.rim.position}
        intensity={activeProfile.lightRig.rim.intensity}
        color={activeProfile.lightRig.rim.color}
        angle={activeProfile.lightRig.rim.angle}
        penumbra={0.85}
        distance={42}
        decay={2}
      />

      <SkyBox />

      <Suspense fallback={null}>
        {tier === "high" ? (
          <Environment files="/env/hdri/kloppenheim_07_4k.exr" background={false} />
        ) : tier === "medium" ? (
          <Environment preset="city" background={false} />
        ) : null}
      </Suspense>

      {caps?.tier !== "low" && ambientParticleMode !== "none" ? (
        <ParticleField mode={ambientParticleMode} />
      ) : null}

      {shouldRenderAct(0) ? (
        <Act1Emergence
          progress={activeAct === 0 ? actProgress : 0}
          visible={true}
        />
      ) : null}
      {shouldRenderAct(1) ? (
        <Act2Structure
          progress={activeAct === 1 ? actProgress : activeAct > 1 ? 1 : 0}
          visible={true}
        />
      ) : null}
      {shouldRenderAct(2) ? (
        <Act3Flow
          progress={activeAct === 2 ? actProgress : activeAct > 2 ? 1 : 0}
          visible={true}
        />
      ) : null}
      {shouldRenderAct(3) ? (
        <Act4Quantum
          progress={activeAct === 3 ? actProgress : activeAct > 3 ? 1 : 0}
          visible={true}
        />
      ) : null}
      {shouldRenderAct(4) ? (
        <Act5Convergence
          progress={activeAct === 4 ? actProgress : 0}
          visible={true}
        />
      ) : null}
    </>
  );
}
