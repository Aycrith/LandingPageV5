"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useSceneLoadStore } from "@/stores/sceneLoadStore";
import { useViewportAuditStore } from "@/stores/viewportAuditStore";
import {
  fitScaleToViewportFill,
  getViewportHeightAtDistance,
  useSceneBounds,
  useStableSceneClone,
} from "@/lib/scene";
import {
  WORLD_PHASES,
  type HeroAssetId,
  type MaterialGradeProfile,
  type WorldPhaseProfile,
} from "./viewportProfiles";

interface CuratedHeroLayerProps {
  activeMetricIndex: number;
  weights: number[];
  rebirthBlend: number;
  worldAnchor: THREE.Vector3;
  pointerOffset: THREE.Vector3;
}

interface HeroSceneProps {
  profile: WorldPhaseProfile;
  reportMetric: boolean;
  weight: number;
  worldAnchor: THREE.Vector3;
  pointerOffset: THREE.Vector3;
}

type CuratedMaterial = THREE.MeshPhysicalMaterial & {
  userData: THREE.MeshPhysicalMaterial["userData"] & {
    baseOpacity?: number;
    baseEmissiveIntensity?: number;
    prefersDepthWrite?: boolean;
    forceTransparent?: boolean;
  };
};

const HERO_ASSET_PATHS: Record<HeroAssetId, string> = {
  dark_star: "/models/dark_star/scene.gltf",
  wireframe_globe: "/models/wireframe_3d_globe.glb",
  hologram: "/models/hologram.glb",
  quantum_leap: "/models/quantum_leap/scene.gltf",
  paradox_abstract: "/models/paradox_abstract_art_of_python.glb",
  black_hole: "/models/black_hole/scene.gltf",
};

function createCuratedMaterial(
  source: THREE.Material,
  assetId: HeroAssetId,
  grade: MaterialGradeProfile,
  accent: string
): CuratedMaterial {
  const sourceWithMaps = source as THREE.MeshStandardMaterial;
  const accentColor = new THREE.Color(accent);
  const material = new THREE.MeshPhysicalMaterial({
    map: sourceWithMaps.map ?? null,
    normalMap: sourceWithMaps.normalMap ?? null,
    emissiveMap: sourceWithMaps.emissiveMap ?? null,
    alphaMap: sourceWithMaps.alphaMap ?? null,
    aoMap: sourceWithMaps.aoMap ?? null,
    roughnessMap: sourceWithMaps.roughnessMap ?? null,
    metalnessMap: sourceWithMaps.metalnessMap ?? null,
    side: source.side,
    transparent: false,
    opacity: 1,
    color: new THREE.Color(grade.coreColor),
    emissive: new THREE.Color(grade.coreEmissive),
    emissiveIntensity: 0.3,
    roughness: grade.alloyRoughness,
    metalness: grade.alloyMetalness,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    envMapIntensity: 1.25,
  }) as CuratedMaterial;

  switch (assetId) {
    case "dark_star":
      material.color.set("#04070a");
      material.emissive.set(grade.coreEmissive);
      material.emissiveIntensity = 0.62 * grade.emissiveBoost;
      material.roughness = 0.16;
      material.metalness = 0.82;
      material.transmission = 0.08;
      material.thickness = 0.22;
      break;
    case "wireframe_globe":
      material.color.set(grade.shellColor);
      material.emissive.set(grade.shellEmissive);
      material.emissiveIntensity = 0.46 * grade.emissiveBoost;
      material.roughness = 0.1;
      material.metalness = 0.14;
      material.transmission = 0.82;
      material.thickness = 0.64;
      material.ior = 1.08;
      material.iridescence = 0.34;
      break;
    case "hologram":
      material.color.set("#8fcfff");
      material.emissive.set("#dff5ff");
      material.emissiveIntensity = 0.92;
      material.roughness = 0.08;
      material.metalness = 0.08;
      material.transmission = 0.96;
      material.thickness = 0.36;
      material.ior = 1.04;
      material.iridescence = 0.58;
      material.opacity = 0.84;
      break;
    case "quantum_leap":
      material.color.set("#0b1018");
      material.emissive.copy(accentColor).lerp(new THREE.Color("#e5f1ff"), 0.3);
      material.emissiveIntensity = 0.44;
      material.roughness = 0.2;
      material.metalness = 0.76;
      material.transmission = 0.18;
      material.thickness = 0.3;
      break;
    case "paradox_abstract":
      material.color.set("#f3b2df");
      material.emissive.set("#f9d5f0");
      material.emissiveIntensity = 0.34;
      material.roughness = 0.12;
      material.metalness = 0.18;
      material.transmission = 0.72;
      material.thickness = 0.72;
      material.iridescence = 0.48;
      material.opacity = 0.7;
      break;
    case "black_hole":
      material.color.set("#05060a");
      material.emissive.set("#ffd4ee");
      material.emissiveIntensity = 1.05 * grade.emissiveBoost;
      material.roughness = 0.12;
      material.metalness = 0.88;
      material.transmission = 0.04;
      material.thickness = 0.22;
      break;
  }

  material.userData.baseOpacity = material.opacity;
  material.userData.baseEmissiveIntensity = material.emissiveIntensity;
  material.userData.prefersDepthWrite = assetId !== "hologram";
  material.userData.forceTransparent =
    assetId === "wireframe_globe" ||
    assetId === "hologram" ||
    assetId === "paradox_abstract";

  return material;
}

function prepareHeroScene(
  scene: THREE.Object3D,
  assetId: HeroAssetId,
  grade: MaterialGradeProfile,
  accent: string
) {
  const materials: CuratedMaterial[] = [];

  scene.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (!mesh.isMesh) {
      return;
    }

    mesh.castShadow = true;
    mesh.receiveShadow = assetId !== "hologram";

    const assignMaterial = (source: THREE.Material) => {
      const nextMaterial = createCuratedMaterial(source, assetId, grade, accent);
      materials.push(nextMaterial);
      return nextMaterial;
    };

    mesh.material = Array.isArray(mesh.material)
      ? mesh.material.map(assignMaterial)
      : assignMaterial(mesh.material);
  });

  return materials;
}

function updateMaterialState(
  materials: CuratedMaterial[],
  opacity: number,
  emissiveScale: number
) {
  for (const material of materials) {
    const baseOpacity = material.userData.baseOpacity ?? 1;
    const baseEmissiveIntensity = material.userData.baseEmissiveIntensity ?? 0;
    const nearOpaque = opacity > 0.72;
    const resolvedOpacity = nearOpaque
      ? 1
      : THREE.MathUtils.clamp(opacity / 0.72, 0, 1);
    material.opacity = baseOpacity * resolvedOpacity;
    material.transparent = material.userData.forceTransparent ?? !nearOpaque;
    material.depthWrite =
      (material.userData.prefersDepthWrite ?? true) &&
      !(material.userData.forceTransparent ?? false) &&
      nearOpaque;
    material.emissiveIntensity =
      baseEmissiveIntensity * (0.45 + opacity * 0.9) * emissiveScale;
  }
}

function useHeroScale(profile: WorldPhaseProfile, rawHeight: number) {
  return useMemo(
    () =>
      fitScaleToViewportFill({
        desiredScale: profile.heroModelBehavior.maxScale,
        rawHeight,
        maxFill:
          profile.maxModelViewportFill * profile.heroModelBehavior.fitPadding,
        previewCamera: profile.previewCamera,
        settleCamera: profile.settleCamera,
      }),
    [profile, rawHeight]
  );
}

function SeedHero({
  profile,
  reportMetric,
  weight,
  worldAnchor,
  pointerOffset,
}: HeroSceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const worldPosRef = useRef(new THREE.Vector3());
  const tempOffset = useRef(new THREE.Vector3());
  const gltf = useGLTF(HERO_ASSET_PATHS.dark_star);
  const sceneClone = useStableSceneClone(gltf.scene);
  const bounds = useSceneBounds(gltf.scene);
  const materials = useMemo(
    () =>
      prepareHeroScene(
        sceneClone,
        profile.heroAsset,
        profile.materialGrade,
        profile.accent
      ),
    [sceneClone, profile]
  );
  const fittedMaxScale = useHeroScale(profile, bounds.height);

  useEffect(() => {
    useSceneLoadStore.getState().markCriticalAssetReady("seed-core");
    return () => {
      useViewportAuditStore.getState().clearHeroModel(profile.heroLabel);
    };
  }, [profile.heroLabel]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const visibility = THREE.MathUtils.clamp(weight * 1.25, 0, 1);
    groupRef.current.visible = visibility > 0.01;
    if (!groupRef.current.visible) return;

    const t = state.clock.elapsedTime;
    tempOffset.current
      .copy(pointerOffset)
      .multiplyScalar(0.42)
      .add(new THREE.Vector3(...profile.compositionZone.heroOffset));
    groupRef.current.position.copy(worldAnchor).add(tempOffset.current);
    groupRef.current.rotation.y = t * 0.14;
    groupRef.current.rotation.x = Math.sin(t * 0.12) * 0.05;
    const desiredScale =
      THREE.MathUtils.lerp(
        profile.heroModelBehavior.baseScale,
        fittedMaxScale,
        0.7 + visibility * 0.22
      ) * 0.7;
    groupRef.current.getWorldPosition(worldPosRef.current);
    const camera = state.camera as THREE.PerspectiveCamera;
    const distance = worldPosRef.current.distanceTo(camera.position);
    const visibleHeight = getViewportHeightAtDistance(distance, camera.fov);
    const appliedScale = Math.min(
      desiredScale,
      (visibleHeight * profile.maxModelViewportFill) / Math.max(bounds.height, 0.0001)
    );
    groupRef.current.scale.setScalar(appliedScale);
    updateMaterialState(materials, visibility, 1 + pointerOffset.length() * 1.4);

    if (reportMetric) {
      useViewportAuditStore.getState().reportHeroModel(profile.heroLabel, {
        desiredScale,
        appliedScale,
        fillRatio: (bounds.height * appliedScale) / visibleHeight,
        maxFill: profile.maxModelViewportFill,
      });
    }
  });

  return <primitive ref={groupRef} object={sceneClone} />;
}

function ScaffoldHero({
  profile,
  reportMetric,
  weight,
  worldAnchor,
  pointerOffset,
}: HeroSceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const worldPosRef = useRef(new THREE.Vector3());
  const tempOffset = useRef(new THREE.Vector3());
  const gltf = useGLTF(HERO_ASSET_PATHS.wireframe_globe);
  const sceneClone = useStableSceneClone(gltf.scene);
  const bounds = useSceneBounds(gltf.scene);
  const materials = useMemo(
    () =>
      prepareHeroScene(
        sceneClone,
        profile.heroAsset,
        profile.materialGrade,
        profile.accent
      ),
    [sceneClone, profile]
  );
  const fittedMaxScale = useHeroScale(profile, bounds.height);

  useEffect(
    () => () => useViewportAuditStore.getState().clearHeroModel(profile.heroLabel),
    [profile.heroLabel]
  );

  useFrame((state) => {
    if (!groupRef.current) return;
    const visibility = THREE.MathUtils.clamp(weight * 1.2, 0, 1);
    groupRef.current.visible = visibility > 0.01;
    if (!groupRef.current.visible) return;

    const t = state.clock.elapsedTime;
    tempOffset.current
      .copy(pointerOffset)
      .multiplyScalar(0.28)
      .add(new THREE.Vector3(...profile.compositionZone.heroOffset));
    groupRef.current.position.copy(worldAnchor).add(tempOffset.current);
    groupRef.current.rotation.y = t * 0.09;
    groupRef.current.rotation.x = Math.sin(t * 0.08) * 0.04;
    const desiredScale =
      THREE.MathUtils.lerp(
        profile.heroModelBehavior.baseScale,
        fittedMaxScale,
        0.64 + visibility * 0.22
      ) * 0.86;
    groupRef.current.getWorldPosition(worldPosRef.current);
    const camera = state.camera as THREE.PerspectiveCamera;
    const distance = worldPosRef.current.distanceTo(camera.position);
    const visibleHeight = getViewportHeightAtDistance(distance, camera.fov);
    const appliedScale = Math.min(
      desiredScale,
      (visibleHeight * profile.maxModelViewportFill) / Math.max(bounds.height, 0.0001)
    );
    groupRef.current.scale.setScalar(appliedScale);
    updateMaterialState(materials, visibility, 1 + pointerOffset.length() * 0.9);

    if (reportMetric) {
      useViewportAuditStore.getState().reportHeroModel(profile.heroLabel, {
        desiredScale,
        appliedScale,
        fillRatio: (bounds.height * appliedScale) / visibleHeight,
        maxFill: profile.maxModelViewportFill,
      });
    }
  });

  return <primitive ref={groupRef} object={sceneClone} />;
}

function CirculationHero({
  profile,
  reportMetric,
  weight,
  worldAnchor,
  pointerOffset,
}: HeroSceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const worldPosRef = useRef(new THREE.Vector3());
  const tempOffset = useRef(new THREE.Vector3());
  const gltf = useGLTF(HERO_ASSET_PATHS.hologram);
  const sceneClone = useStableSceneClone(gltf.scene);
  const bounds = useSceneBounds(gltf.scene);
  const materials = useMemo(
    () =>
      prepareHeroScene(
        sceneClone,
        profile.heroAsset,
        profile.materialGrade,
        profile.accent
      ),
    [sceneClone, profile]
  );
  const fittedMaxScale = useHeroScale(profile, bounds.height);

  useEffect(
    () => () => useViewportAuditStore.getState().clearHeroModel(profile.heroLabel),
    [profile.heroLabel]
  );

  useFrame((state) => {
    if (!groupRef.current) return;
    const visibility = THREE.MathUtils.clamp(weight * 1.15, 0, 1);
    groupRef.current.visible = visibility > 0.01;
    if (!groupRef.current.visible) return;

    const t = state.clock.elapsedTime;
    tempOffset.current
      .copy(pointerOffset)
      .multiplyScalar(0.2)
      .add(new THREE.Vector3(...profile.compositionZone.heroOffset));
    groupRef.current.position.copy(worldAnchor).add(tempOffset.current);
    groupRef.current.rotation.y = t * 0.18;
    groupRef.current.rotation.z = Math.sin(t * 0.16) * 0.06;
    const desiredScale =
      THREE.MathUtils.lerp(
        profile.heroModelBehavior.baseScale,
        fittedMaxScale,
        0.58 + visibility * 0.26
      ) * 0.82;
    groupRef.current.getWorldPosition(worldPosRef.current);
    const camera = state.camera as THREE.PerspectiveCamera;
    const distance = worldPosRef.current.distanceTo(camera.position);
    const visibleHeight = getViewportHeightAtDistance(distance, camera.fov);
    const appliedScale = Math.min(
      desiredScale,
      (visibleHeight * profile.maxModelViewportFill) / Math.max(bounds.height, 0.0001)
    );
    groupRef.current.scale.setScalar(appliedScale);
    updateMaterialState(
      materials,
      visibility * 0.94,
      1.2 + pointerOffset.length() * 1.2
    );

    if (reportMetric) {
      useViewportAuditStore.getState().reportHeroModel(profile.heroLabel, {
        desiredScale,
        appliedScale,
        fillRatio: (bounds.height * appliedScale) / visibleHeight,
        maxFill: profile.maxModelViewportFill,
      });
    }
  });

  return <primitive ref={groupRef} object={sceneClone} />;
}

function SentienceHero({
  profile,
  reportMetric,
  weight,
  worldAnchor,
  pointerOffset,
}: HeroSceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const bridgeRef = useRef<THREE.Mesh>(null);
  const primaryRef = useRef<THREE.Group>(null);
  const supportRef = useRef<THREE.Group>(null);
  const worldPosRef = useRef(new THREE.Vector3());
  const gltfPrimary = useGLTF(HERO_ASSET_PATHS.quantum_leap);
  const gltfSupport = useGLTF(HERO_ASSET_PATHS.paradox_abstract);
  const primaryClone = useStableSceneClone(gltfPrimary.scene);
  const supportClone = useStableSceneClone(gltfSupport.scene);
  const primaryBounds = useSceneBounds(gltfPrimary.scene);
  const primaryMaterials = useMemo(
    () =>
      prepareHeroScene(
        primaryClone,
        profile.heroAsset,
        profile.materialGrade,
        profile.accent
      ),
    [primaryClone, profile]
  );
  const supportMaterials = useMemo(
    () =>
      prepareHeroScene(
        supportClone,
        "paradox_abstract",
        profile.materialGrade,
        "#ffb4dc"
      ),
    [profile.materialGrade, supportClone]
  );
  const fittedMaxScale = useHeroScale(profile, primaryBounds.height);

  useEffect(
    () => () => useViewportAuditStore.getState().clearHeroModel(profile.heroLabel),
    [profile.heroLabel]
  );

  useFrame((state) => {
    if (!groupRef.current || !primaryRef.current || !supportRef.current) return;
    const visibility = THREE.MathUtils.clamp(weight * 1.2, 0, 1);
    groupRef.current.visible = visibility > 0.01;
    if (!groupRef.current.visible) return;

    const t = state.clock.elapsedTime;
    groupRef.current.position
      .copy(worldAnchor)
      .add(pointerOffset.clone().multiplyScalar(0.12))
      .add(new THREE.Vector3(...profile.compositionZone.heroOffset));
    const split = profile.heroRig.splitDistance * (0.35 + visibility * 0.52);
    const desiredScale =
      THREE.MathUtils.lerp(
        profile.heroModelBehavior.baseScale,
        fittedMaxScale,
        0.48 + visibility * 0.2
      ) * 0.032;
    primaryRef.current.position.set(-split * 0.38, 0.06, -0.05);
    primaryRef.current.rotation.y = t * 0.12;
    supportRef.current.position.set(split * 0.42, -0.08, 0.18);
    supportRef.current.rotation.y = -t * 0.1;
    supportRef.current.rotation.z = Math.sin(t * 0.22) * 0.12;

    if (bridgeRef.current) {
      bridgeRef.current.position.set(0, -0.02, 0.08);
      bridgeRef.current.scale.set(split * 0.86, 1, 1);
      const bridgeMaterial =
        bridgeRef.current.material as THREE.MeshPhysicalMaterial;
      bridgeMaterial.opacity = visibility * 0.68;
      bridgeMaterial.emissiveIntensity = 0.28 + visibility * 0.56;
    }

    updateMaterialState(primaryMaterials, visibility, 1.1 + pointerOffset.length());
    updateMaterialState(supportMaterials, visibility * 0.8, 0.85 + pointerOffset.length());

    primaryRef.current.getWorldPosition(worldPosRef.current);
    const camera = state.camera as THREE.PerspectiveCamera;
    const distance = worldPosRef.current.distanceTo(camera.position);
    const visibleHeight = getViewportHeightAtDistance(distance, camera.fov);
    const appliedScale = Math.min(
      desiredScale,
      (visibleHeight * profile.maxModelViewportFill) /
        Math.max(primaryBounds.height, 0.0001)
    );
    primaryRef.current.scale.setScalar(appliedScale);
    supportRef.current.scale.setScalar(appliedScale * 3.4);
    if (reportMetric) {
      useViewportAuditStore.getState().reportHeroModel(profile.heroLabel, {
        desiredScale,
        appliedScale,
        fillRatio: (primaryBounds.height * appliedScale) / visibleHeight,
        maxFill: profile.maxModelViewportFill,
      });
    }
  });

  return (
    <group ref={groupRef}>
      <group ref={primaryRef}>
        <primitive object={primaryClone} />
      </group>
      <mesh ref={bridgeRef} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.05, 1, 18]} />
        <meshPhysicalMaterial
          color="#f5d1a0"
          emissive="#ffd2f0"
          emissiveIntensity={0.4}
          transparent
          opacity={0.6}
          transmission={0.58}
          thickness={0.6}
          roughness={0.14}
          depthWrite={false}
        />
      </mesh>
      <group ref={supportRef}>
        <primitive object={supportClone} />
      </group>
    </group>
  );
}

function ApotheosisHero({
  profile,
  reportMetric,
  weight,
  worldAnchor,
  pointerOffset,
}: HeroSceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const orbitDiskRef = useRef<THREE.Mesh>(null);
  const worldPosRef = useRef(new THREE.Vector3());
  const tempOffset = useRef(new THREE.Vector3());
  const gltf = useGLTF(HERO_ASSET_PATHS.black_hole);
  const sceneClone = useStableSceneClone(gltf.scene);
  const bounds = useSceneBounds(gltf.scene);
  const materials = useMemo(
    () =>
      prepareHeroScene(
        sceneClone,
        profile.heroAsset,
        profile.materialGrade,
        profile.accent
      ),
    [sceneClone, profile]
  );
  const fittedMaxScale = useHeroScale(profile, bounds.height);

  useEffect(() => {
    return () => {
      const audit = useViewportAuditStore.getState();
      audit.clearHeroModel(profile.heroLabel);
      audit.clearFxLayer("apotheosis-core");
    };
  }, [profile.heroLabel]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const visibility = THREE.MathUtils.clamp(weight * 1.24, 0, 1);
    groupRef.current.visible = visibility > 0.01;
    if (!groupRef.current.visible) return;

    const t = state.clock.elapsedTime;
    tempOffset.current
      .copy(pointerOffset)
      .multiplyScalar(0.12)
      .add(new THREE.Vector3(...profile.compositionZone.heroOffset));
    groupRef.current.position.copy(worldAnchor).add(tempOffset.current);
    groupRef.current.rotation.y = t * 0.08;
    const desiredScale =
      THREE.MathUtils.lerp(
        profile.heroModelBehavior.baseScale,
        fittedMaxScale,
        0.64 + visibility * 0.2
      ) * 0.64;
    if (orbitDiskRef.current) {
      orbitDiskRef.current.rotation.z = t * 0.22;
      const diskMaterial =
        orbitDiskRef.current.material as THREE.MeshBasicMaterial;
      diskMaterial.opacity = visibility * 0.32;
    }

    groupRef.current.getWorldPosition(worldPosRef.current);
    const camera = state.camera as THREE.PerspectiveCamera;
    const distance = worldPosRef.current.distanceTo(camera.position);
    const visibleHeight = getViewportHeightAtDistance(distance, camera.fov);
    const appliedScale = Math.min(
      desiredScale,
      (visibleHeight * profile.maxModelViewportFill) / Math.max(bounds.height, 0.0001)
    );
    groupRef.current.scale.setScalar(appliedScale);
    updateMaterialState(materials, visibility, 1.15 + pointerOffset.length() * 0.6);
    if (reportMetric) {
      useViewportAuditStore.getState().reportHeroModel(profile.heroLabel, {
        desiredScale,
        appliedScale,
        fillRatio: (bounds.height * appliedScale) / visibleHeight,
        maxFill: profile.maxModelViewportFill,
      });
      useViewportAuditStore.getState().reportFxLayer("apotheosis-core", {
        opacity: visibility * 0.58,
        scale: 0.78 + visibility * 0.9,
      });
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={orbitDiskRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.1, 0.09, 18, 96]} />
        <meshBasicMaterial
          color="#ffd5f1"
          transparent
          opacity={0.22}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>
      <primitive object={sceneClone} />
    </group>
  );
}

export function CuratedHeroLayer({
  activeMetricIndex,
  weights,
  rebirthBlend,
  worldAnchor,
  pointerOffset,
}: CuratedHeroLayerProps) {
  return (
    <>
      <SeedHero
        profile={WORLD_PHASES[0]}
        reportMetric={activeMetricIndex === 0}
        weight={weights[0] + rebirthBlend}
        worldAnchor={worldAnchor}
        pointerOffset={pointerOffset}
      />
      <ScaffoldHero
        profile={WORLD_PHASES[1]}
        reportMetric={activeMetricIndex === 1}
        weight={weights[1]}
        worldAnchor={worldAnchor}
        pointerOffset={pointerOffset}
      />
      <CirculationHero
        profile={WORLD_PHASES[2]}
        reportMetric={activeMetricIndex === 2}
        weight={weights[2]}
        worldAnchor={worldAnchor}
        pointerOffset={pointerOffset}
      />
      <SentienceHero
        profile={WORLD_PHASES[3]}
        reportMetric={activeMetricIndex === 3}
        weight={weights[3]}
        worldAnchor={worldAnchor}
        pointerOffset={pointerOffset}
      />
      <ApotheosisHero
        profile={WORLD_PHASES[4]}
        reportMetric={activeMetricIndex === 4}
        weight={weights[4]}
        worldAnchor={worldAnchor}
        pointerOffset={pointerOffset}
      />
    </>
  );
}

useGLTF.preload(HERO_ASSET_PATHS.dark_star);
useGLTF.preload(HERO_ASSET_PATHS.wireframe_globe);
useGLTF.preload(HERO_ASSET_PATHS.hologram);
useGLTF.preload(HERO_ASSET_PATHS.quantum_leap);
useGLTF.preload(HERO_ASSET_PATHS.paradox_abstract);
useGLTF.preload(HERO_ASSET_PATHS.black_hole);
