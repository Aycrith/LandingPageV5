"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useCapsStore, type RuntimeCaps } from "@/stores/capsStore";
import { useSceneLoadStore } from "@/stores/sceneLoadStore";
import { useViewportAuditStore } from "@/stores/viewportAuditStore";
import {
  computeViewportFillRatio,
  fitScaleToViewportFill,
  getViewportHeightAtDistance,
  measureSceneBounds,
  resolveDetailLod,
  type DetailLod,
  useSceneBounds,
} from "@/lib/scene";
import { usePreparedSceneLease } from "@/lib/preparedSceneCache";
import { HERO_ASSET_PATHS } from "./assetManifest";
import {
  WORLD_PHASES,
  type HeroAssetId,
  type MaterialGradeProfile,
  type WorldPhaseProfile,
} from "./viewportProfiles";
import { Act6QuantumConsciousness } from "./acts/Act6QuantumConsciousness";
import { Act1Emergence } from "./acts/Act1Emergence";
import { Act2Structure } from "./acts/Act2Structure";
import { Act3Flow } from "./acts/Act3Flow";
import { Act4Quantum } from "./acts/Act4Quantum";
import { Act5Convergence } from "./acts/Act5Convergence";
import { getActWeight, useWorldMotionRef } from "./worldMotion";

interface CuratedHeroLayerProps {
  mountedActIndices: number[];
  mountedFxActIndices?: number[];
  includeWarmedHeroActs?: boolean;
  auditEnabled?: boolean;
  includeActFx?: boolean;
}

interface HeroSceneProps {
  actIndex: number;
  profile: WorldPhaseProfile;
  runtimeCaps: RuntimeCaps | null;
  auditEnabled?: boolean;
}

type CuratedMaterial = THREE.MeshPhysicalMaterial & {
  userData: THREE.MeshPhysicalMaterial["userData"] & {
    baseOpacity?: number;
    baseEmissiveIntensity?: number;
    prefersDepthWrite?: boolean;
    forceTransparent?: boolean;
    baseRoughness?: number;
    baseMetalness?: number;
    baseTransmission?: number;
    baseThickness?: number;
    baseIridescence?: number;
    baseClearcoat?: number;
    baseClearcoatRoughness?: number;
    baseEnvMapIntensity?: number;
  };
};

type CuratedMesh = THREE.Mesh & {
  userData: THREE.Mesh["userData"] & {
    baseCastShadow?: boolean;
    baseReceiveShadow?: boolean;
    detailWeight?: number;
    hasExpensiveTransparency?: boolean;
    forceHide?: boolean;
  };
};

const DARK_STAR_OUTER_SHELL_PARENTS = new Set([
  "Sph01001_23",
  "Sph02001_24",
  "Sph03001_25",
  "Sph05001_26",
]);

export interface PreparedHeroScene {
  materials: CuratedMaterial[];
  meshes: CuratedMesh[];
}

const HERO_LOD_PROFILES: Record<
  DetailLod,
  {
    transmissionScale: number;
    iridescenceScale: number;
    clearcoatScale: number;
    envMapScale: number;
    roughnessBias: number;
    microTransparencyThreshold: number;
  }
> = {
  cinematic: {
    transmissionScale: 1,
    iridescenceScale: 1,
    clearcoatScale: 1,
    envMapScale: 1,
    roughnessBias: 0,
    microTransparencyThreshold: 0,
  },
  balanced: {
    transmissionScale: 0.68,
    iridescenceScale: 0.56,
    clearcoatScale: 0.74,
    envMapScale: 0.88,
    roughnessBias: 0.05,
    microTransparencyThreshold: 0.12,
  },
  streamlined: {
    transmissionScale: 0.2,
    iridescenceScale: 0.01,
    clearcoatScale: 0.22,
    envMapScale: 0.58,
    roughnessBias: 0.14,
    microTransparencyThreshold: 0.18,
  },
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
      material.metalness = 0.06;
      material.transmission = 0.82;
      material.thickness = 0.64;
      material.ior = 1.08;
      material.iridescence = 0.56;
      material.iridescenceIOR = 1.8;
      (material as unknown as Record<string, unknown>).iridescenceThicknessRange = [80, 400];
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
  material.userData.baseRoughness = material.roughness;
  material.userData.baseMetalness = material.metalness;
  material.userData.baseTransmission = material.transmission;
  material.userData.baseThickness = material.thickness;
  material.userData.baseIridescence = material.iridescence;
  material.userData.baseClearcoat = material.clearcoat;
  material.userData.baseClearcoatRoughness = material.clearcoatRoughness;
  material.userData.baseEnvMapIntensity = material.envMapIntensity;

  return material;
}

export function buildHeroSceneCacheKey({
  assetId,
  grade,
  accent,
}: {
  assetId: HeroAssetId;
  grade: MaterialGradeProfile;
  accent: string;
}) {
  return [
    "hero",
    assetId,
    accent,
    grade.coreColor,
    grade.coreEmissive,
    grade.shellColor,
    grade.shellEmissive,
    grade.conduitColor,
    grade.membraneColor,
    grade.uiColor,
    grade.alloyMetalness,
    grade.alloyRoughness,
    grade.glassTransmission,
    grade.membraneTransmission,
    grade.emissiveBoost,
  ].join("|");
}

export function prepareHeroScene(
  scene: THREE.Object3D,
  assetId: HeroAssetId,
  grade: MaterialGradeProfile,
  accent: string
) : PreparedHeroScene {
  const materials: CuratedMaterial[] = [];
  const meshes: CuratedMesh[] = [];
  const sceneRadius = measureSceneBounds(scene).radius;

  scene.traverse((node) => {
    const mesh = node as CuratedMesh;
    if (!mesh.isMesh) {
      return;
    }

    // The hero assets are already strongly emissive. Keeping them out of the
    // shadow pipeline removes a large hidden draw-call multiplier during sweeps.
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.userData.baseCastShadow = mesh.castShadow;
    mesh.userData.baseReceiveShadow = mesh.receiveShadow;

    if (!mesh.geometry.boundingSphere) {
      mesh.geometry.computeBoundingSphere();
    }

    mesh.userData.detailWeight = THREE.MathUtils.clamp(
      (mesh.geometry.boundingSphere?.radius ?? sceneRadius) /
        Math.max(sceneRadius, 0.0001),
      0,
      1
    );
    mesh.userData.forceHide =
      assetId === "dark_star" &&
      DARK_STAR_OUTER_SHELL_PARENTS.has(
        (mesh.parent?.name ?? "").replaceAll(".", "")
      );

    const assignMaterial = (source: THREE.Material) => {
      const nextMaterial = createCuratedMaterial(source, assetId, grade, accent);
      materials.push(nextMaterial);
      return nextMaterial;
    };

    const assignedMaterials = Array.isArray(mesh.material)
      ? mesh.material.map(assignMaterial)
      : assignMaterial(mesh.material);
    mesh.material = assignedMaterials;
    mesh.userData.hasExpensiveTransparency = Array.isArray(assignedMaterials)
      ? assignedMaterials.some((material) => material.userData.forceTransparent)
      : assignedMaterials.userData.forceTransparent;
    meshes.push(mesh);
  });

  return { materials, meshes };
}

function usePreparedHeroSceneLease({
  sourceScene,
  assetId,
  grade,
  accent,
}: {
  sourceScene: THREE.Object3D;
  assetId: HeroAssetId;
  grade: MaterialGradeProfile;
  accent: string;
}) {
  const cacheKey = useMemo(
    () => buildHeroSceneCacheKey({ assetId, grade, accent }),
    [accent, assetId, grade]
  );
  const prepareLease = useMemo(
    () => (scene: THREE.Object3D) => prepareHeroScene(scene, assetId, grade, accent),
    [accent, assetId, grade]
  );

  return usePreparedSceneLease(cacheKey, sourceScene, prepareLease);
}

function updateMaterialState(
  materials: CuratedMaterial[],
  opacity: number,
  emissiveScale: number,
  lod: DetailLod
) {
  const lodProfile = HERO_LOD_PROFILES[lod];

  for (const material of materials) {
    const baseOpacity = material.userData.baseOpacity ?? 1;
    const baseEmissiveIntensity = material.userData.baseEmissiveIntensity ?? 0;
    const baseRoughness = material.userData.baseRoughness ?? material.roughness;
    const baseMetalness = material.userData.baseMetalness ?? material.metalness;
    const baseTransmission = material.userData.baseTransmission ?? material.transmission;
    const baseThickness = material.userData.baseThickness ?? material.thickness;
    const baseIridescence = material.userData.baseIridescence ?? material.iridescence;
    const baseClearcoat = material.userData.baseClearcoat ?? material.clearcoat;
    const baseClearcoatRoughness =
      material.userData.baseClearcoatRoughness ?? material.clearcoatRoughness;
    const baseEnvMapIntensity =
      material.userData.baseEnvMapIntensity ?? material.envMapIntensity;
    const nearOpaque = opacity > 0.72;
    const resolvedOpacity = nearOpaque
      ? 1
      : THREE.MathUtils.clamp(opacity / 0.72, 0, 1);
    material.opacity = baseOpacity * resolvedOpacity;
    material.transparent = true;
    material.depthWrite =
      (material.userData.prefersDepthWrite ?? true) &&
      !(material.userData.forceTransparent ?? false) &&
      nearOpaque;
    material.roughness = THREE.MathUtils.clamp(
      baseRoughness + lodProfile.roughnessBias,
      0,
      1
    );
    material.metalness = baseMetalness;
    material.transmission = baseTransmission * lodProfile.transmissionScale;
    material.thickness = baseThickness * Math.max(lodProfile.transmissionScale, 0.24);
    material.iridescence = baseIridescence * lodProfile.iridescenceScale;
    material.clearcoat = baseClearcoat * lodProfile.clearcoatScale;
    material.clearcoatRoughness = THREE.MathUtils.clamp(
      baseClearcoatRoughness + (lod === "streamlined" ? 0.18 : lod === "balanced" ? 0.08 : 0),
      0,
      1
    );
    material.envMapIntensity = baseEnvMapIntensity * lodProfile.envMapScale;
    material.emissiveIntensity =
      baseEmissiveIntensity * (0.45 + opacity * 0.9) * emissiveScale;
  }
}

function updateMeshLod(
  meshes: CuratedMesh[],
  lod: DetailLod,
  enableShadows: boolean
) {
  const threshold = HERO_LOD_PROFILES[lod].microTransparencyThreshold;

  for (const mesh of meshes) {
    const detailWeight = mesh.userData.detailWeight ?? 1;
    const isExpensiveTransparency = mesh.userData.hasExpensiveTransparency ?? false;
    const forceHide = mesh.userData.forceHide ?? false;
    mesh.visible =
      !forceHide && !(isExpensiveTransparency && detailWeight < threshold);
    mesh.castShadow =
      enableShadows && lod === "cinematic" && Boolean(mesh.userData.baseCastShadow);
    mesh.receiveShadow =
      enableShadows && lod !== "streamlined" && Boolean(mesh.userData.baseReceiveShadow);
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
  actIndex,
  profile,
  runtimeCaps,
  auditEnabled = true,
}: HeroSceneProps) {
  const motionRef = useWorldMotionRef();
  const groupRef = useRef<THREE.Group>(null);
  const worldPosRef = useRef(new THREE.Vector3());
  const tempOffset = useRef(new THREE.Vector3());
  const heroOffset = useMemo(
    () => new THREE.Vector3(...profile.compositionZone.heroOffset),
    [profile]
  );
  const gltf = useGLTF(HERO_ASSET_PATHS.dark_star);
  const heroLease = usePreparedHeroSceneLease({
    sourceScene: gltf.scene,
    assetId: profile.heroAsset,
    grade: profile.materialGrade,
    accent: profile.accent,
  });
  const sceneClone = heroLease.object;
  const bounds = useSceneBounds(gltf.scene);
  const preparedScene = heroLease.meta;
  const materials = preparedScene.materials;
  const fittedMaxScale = useHeroScale(profile, bounds.height);

  useEffect(() => {
    if (!auditEnabled) {
      return;
    }
    return () => {
      useViewportAuditStore.getState().clearHeroModel(profile.heroLabel);
    };
  }, [auditEnabled, profile.heroLabel]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const motion = motionRef.current;
    const visibility = THREE.MathUtils.clamp(getActWeight(motion, actIndex) * 1.25, 0, 1);
    const reportMetric = auditEnabled && motion.metricActIndex === actIndex;
    groupRef.current.visible = visibility > 0.01;
    if (!groupRef.current.visible) return;

    const t = state.clock.elapsedTime;
    tempOffset.current
      .copy(motion.pointerOffset)
      .multiplyScalar(0.42)
      .add(heroOffset);
    groupRef.current.position.copy(motion.worldAnchor).add(tempOffset.current);
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
    const fillRatio = computeViewportFillRatio(bounds.height, appliedScale, visibleHeight);
    const lod = resolveDetailLod({
      distance,
      fillRatio,
      tier: runtimeCaps?.tier ?? "low",
      prefersReducedMotion: runtimeCaps?.prefersReducedMotion,
    });
    updateMeshLod(preparedScene.meshes, lod, Boolean(runtimeCaps?.enableShadows));
    updateMaterialState(
      materials,
      visibility,
      1 + motion.pointerOffset.length() * 1.4,
      lod
    );

    if (reportMetric) {
      useViewportAuditStore.getState().reportSceneState({ activeHeroLod: lod });
      useViewportAuditStore.getState().reportHeroModel(profile.heroLabel, {
        desiredScale,
        appliedScale,
        fillRatio,
        maxFill: profile.maxModelViewportFill,
        lod,
        distanceToCamera: distance,
        screenCoverage: fillRatio,
      });
    }
  });

  return <primitive ref={groupRef} object={sceneClone} />;
}

function ScaffoldHero({
  actIndex,
  profile,
  runtimeCaps,
  auditEnabled = true,
}: HeroSceneProps) {
  const motionRef = useWorldMotionRef();
  const groupRef = useRef<THREE.Group>(null);
  const worldPosRef = useRef(new THREE.Vector3());
  const tempOffset = useRef(new THREE.Vector3());
  const heroOffset = useMemo(
    () => new THREE.Vector3(...profile.compositionZone.heroOffset),
    [profile]
  );
  const gltf = useGLTF(HERO_ASSET_PATHS.wireframe_globe);
  const heroLease = usePreparedHeroSceneLease({
    sourceScene: gltf.scene,
    assetId: profile.heroAsset,
    grade: profile.materialGrade,
    accent: profile.accent,
  });
  const sceneClone = heroLease.object;
  const bounds = useSceneBounds(gltf.scene);
  const preparedScene = heroLease.meta;
  const materials = preparedScene.materials;
  const fittedMaxScale = useHeroScale(profile, bounds.height);

  useEffect(
    () =>
      auditEnabled
        ? () => useViewportAuditStore.getState().clearHeroModel(profile.heroLabel)
        : undefined,
    [auditEnabled, profile.heroLabel]
  );

  useFrame((state) => {
    if (!groupRef.current) return;
    const motion = motionRef.current;
    const visibility = THREE.MathUtils.clamp(getActWeight(motion, actIndex) * 1.2, 0, 1);
    const reportMetric = auditEnabled && motion.metricActIndex === actIndex;
    groupRef.current.visible = visibility > 0.01;
    if (!groupRef.current.visible) return;

    const t = state.clock.elapsedTime;
    tempOffset.current
      .copy(motion.pointerOffset)
      .multiplyScalar(0.28)
      .add(heroOffset);
    groupRef.current.position.copy(motion.worldAnchor).add(tempOffset.current);
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
    groupRef.current.scale.setScalar(
      appliedScale * (1 + motion.pointerOffset.length() * 0.04)
    );
    const fillRatio = computeViewportFillRatio(bounds.height, appliedScale, visibleHeight);
    const lod = resolveDetailLod({
      distance,
      fillRatio,
      tier: runtimeCaps?.tier ?? "low",
      prefersReducedMotion: runtimeCaps?.prefersReducedMotion,
    });
    updateMeshLod(preparedScene.meshes, lod, Boolean(runtimeCaps?.enableShadows));
    updateMaterialState(
      materials,
      visibility,
      1 + motion.pointerOffset.length() * 0.9,
      lod
    );

    if (reportMetric) {
      useViewportAuditStore.getState().reportSceneState({ activeHeroLod: lod });
      useViewportAuditStore.getState().reportHeroModel(profile.heroLabel, {
        desiredScale,
        appliedScale,
        fillRatio,
        maxFill: profile.maxModelViewportFill,
        lod,
        distanceToCamera: distance,
        screenCoverage: fillRatio,
      });
    }
  });

  return <primitive ref={groupRef} object={sceneClone} />;
}

function CirculationHero({
  actIndex,
  profile,
  runtimeCaps,
  auditEnabled = true,
}: HeroSceneProps) {
  const motionRef = useWorldMotionRef();
  const groupRef = useRef<THREE.Group>(null);
  const worldPosRef = useRef(new THREE.Vector3());
  const tempOffset = useRef(new THREE.Vector3());
  const heroOffset = useMemo(
    () => new THREE.Vector3(...profile.compositionZone.heroOffset),
    [profile]
  );
  const gltf = useGLTF(HERO_ASSET_PATHS.hologram);
  const heroLease = usePreparedHeroSceneLease({
    sourceScene: gltf.scene,
    assetId: profile.heroAsset,
    grade: profile.materialGrade,
    accent: profile.accent,
  });
  const sceneClone = heroLease.object;
  const bounds = useSceneBounds(gltf.scene);
  const preparedScene = heroLease.meta;
  const materials = preparedScene.materials;
  const fittedMaxScale = useHeroScale(profile, bounds.height);

  useEffect(
    () =>
      auditEnabled
        ? () => useViewportAuditStore.getState().clearHeroModel(profile.heroLabel)
        : undefined,
    [auditEnabled, profile.heroLabel]
  );

  useFrame((state) => {
    if (!groupRef.current) return;
    const motion = motionRef.current;
    const visibility = THREE.MathUtils.clamp(getActWeight(motion, actIndex) * 1.15, 0, 1);
    const reportMetric = auditEnabled && motion.metricActIndex === actIndex;
    groupRef.current.visible = visibility > 0.01;
    if (!groupRef.current.visible) return;

    const t = state.clock.elapsedTime;
    tempOffset.current
      .copy(motion.pointerOffset)
      .multiplyScalar(0.2)
      .add(heroOffset);
    groupRef.current.position.copy(motion.worldAnchor).add(tempOffset.current);
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
    const fillRatio = computeViewportFillRatio(bounds.height, appliedScale, visibleHeight);
    const lod = resolveDetailLod({
      distance,
      fillRatio,
      tier: runtimeCaps?.tier ?? "low",
      prefersReducedMotion: runtimeCaps?.prefersReducedMotion,
    });
    updateMeshLod(preparedScene.meshes, lod, Boolean(runtimeCaps?.enableShadows));
    updateMaterialState(
      materials,
      visibility * 0.94,
      1.2 + motion.pointerOffset.length() * 1.2,
      lod
    );

    if (reportMetric) {
      useViewportAuditStore.getState().reportSceneState({ activeHeroLod: lod });
      useViewportAuditStore.getState().reportHeroModel(profile.heroLabel, {
        desiredScale,
        appliedScale,
        fillRatio,
        maxFill: profile.maxModelViewportFill,
        lod,
        distanceToCamera: distance,
        screenCoverage: fillRatio,
      });
    }
  });

  return <primitive ref={groupRef} object={sceneClone} />;
}

function SentienceHero({
  actIndex,
  profile,
  runtimeCaps,
  auditEnabled = true,
}: HeroSceneProps) {
  const motionRef = useWorldMotionRef();
  const groupRef = useRef<THREE.Group>(null);
  const bridgeRef = useRef<THREE.Mesh>(null);
  const primaryRef = useRef<THREE.Group>(null);
  const supportRef = useRef<THREE.Group>(null);
  const primaryCoreRef = useRef<THREE.Mesh>(null);
  const primaryShellRef = useRef<THREE.Mesh>(null);
  const primaryOrbitRef = useRef<THREE.Mesh>(null);
  const supportCoreRef = useRef<THREE.Mesh>(null);
  const supportHaloRef = useRef<THREE.Mesh>(null);
  const supportOrbRef = useRef<THREE.Mesh>(null);
  const primaryCoreMaterialRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const primaryShellMaterialRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const primaryOrbitMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const supportCoreMaterialRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const supportHaloMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const supportOrbMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const worldPosRef = useRef(new THREE.Vector3());
  const tempOffset = useRef(new THREE.Vector3());
  const proceduralRawHeight = 3.1;
  const heroOffset = useMemo(
    () => new THREE.Vector3(...profile.compositionZone.heroOffset),
    [profile]
  );
  const fittedMaxScale = useHeroScale(profile, proceduralRawHeight);

  useEffect(
    () =>
      auditEnabled
        ? () => useViewportAuditStore.getState().clearHeroModel(profile.heroLabel)
        : undefined,
    [auditEnabled, profile.heroLabel]
  );

  useFrame((state) => {
    if (!groupRef.current || !primaryRef.current || !supportRef.current) return;
    const motion = motionRef.current;
    const visibility = THREE.MathUtils.clamp(getActWeight(motion, actIndex) * 1.2, 0, 1);
    const reportMetric = auditEnabled && motion.metricActIndex === actIndex;
    groupRef.current.visible = visibility > 0.01;
    if (!groupRef.current.visible) return;

    const t = state.clock.elapsedTime;
    tempOffset.current.copy(motion.pointerOffset).multiplyScalar(0.12).add(heroOffset);
    groupRef.current.position
      .copy(motion.worldAnchor)
      .add(tempOffset.current);
    const split = profile.heroRig.splitDistance * (0.35 + visibility * 0.52);
    const desiredScale =
      THREE.MathUtils.lerp(
        profile.heroModelBehavior.baseScale,
        fittedMaxScale,
        0.48 + visibility * 0.2
      ) * 0.72;
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

    primaryRef.current.getWorldPosition(worldPosRef.current);
    const camera = state.camera as THREE.PerspectiveCamera;
    const distance = worldPosRef.current.distanceTo(camera.position);
    const visibleHeight = getViewportHeightAtDistance(distance, camera.fov);
    const appliedScale = Math.min(
      desiredScale,
      (visibleHeight * profile.maxModelViewportFill) /
        Math.max(proceduralRawHeight, 0.0001)
    );
    const fillRatio = computeViewportFillRatio(
      proceduralRawHeight,
      appliedScale,
      visibleHeight
    );
    const lod = resolveDetailLod({
      distance,
      fillRatio,
      tier: runtimeCaps?.tier ?? "low",
      prefersReducedMotion: runtimeCaps?.prefersReducedMotion,
    });
    primaryRef.current.scale.setScalar(appliedScale);
    supportRef.current.scale.setScalar(appliedScale * 1.1);
    if (primaryCoreRef.current) {
      primaryCoreRef.current.rotation.y = t * 0.16;
      primaryCoreRef.current.rotation.x = Math.sin(t * 0.22) * 0.08;
    }
    if (primaryShellRef.current) {
      primaryShellRef.current.rotation.z = -t * 0.18;
      primaryShellRef.current.scale.setScalar(1 + Math.sin(t * 0.8) * 0.04);
    }
    if (primaryOrbitRef.current) {
      const orbitRadius = 1.14 + Math.sin(t * 0.42) * 0.08;
      primaryOrbitRef.current.position.set(
        Math.cos(t * 0.62) * orbitRadius,
        Math.sin(t * 0.48) * 0.26,
        Math.sin(t * 0.62) * orbitRadius
      );
      primaryOrbitRef.current.rotation.y = t * 0.3;
    }
    if (primaryCoreMaterialRef.current) {
      primaryCoreMaterialRef.current.opacity = visibility * 0.82;
      primaryCoreMaterialRef.current.emissiveIntensity =
        0.44 + visibility * 0.76;
    }
    if (primaryShellMaterialRef.current) {
      primaryShellMaterialRef.current.opacity = visibility * 0.42;
      primaryShellMaterialRef.current.emissiveIntensity =
        0.2 + visibility * 0.42;
      primaryShellMaterialRef.current.transmission =
        lod === "streamlined" ? 0.18 : lod === "balanced" ? 0.28 : 0.4;
    }
    if (primaryOrbitMaterialRef.current) {
      primaryOrbitMaterialRef.current.opacity = visibility * 0.28;
    }
    if (supportCoreMaterialRef.current) {
      supportCoreMaterialRef.current.opacity = visibility * 0.76;
      supportCoreMaterialRef.current.emissiveIntensity =
        0.32 + visibility * 0.58;
    }
    if (supportHaloMaterialRef.current) {
      supportHaloMaterialRef.current.opacity = visibility * 0.24;
    }
    if (supportOrbMaterialRef.current) {
      supportOrbMaterialRef.current.opacity = visibility * 0.34;
    }
    if (supportCoreRef.current) {
      supportCoreRef.current.rotation.y = t * 0.16;
      supportCoreRef.current.rotation.x = Math.sin(t * 0.18) * 0.1;
    }
    if (supportHaloRef.current) {
      supportHaloRef.current.rotation.z = -t * 0.18;
    }
    if (supportOrbRef.current) {
      supportOrbRef.current.rotation.x = t * 0.24;
      supportOrbRef.current.rotation.z = -t * 0.12;
    }
    if (reportMetric) {
      useViewportAuditStore.getState().reportSceneState({ activeHeroLod: lod });
      useViewportAuditStore.getState().reportHeroModel(profile.heroLabel, {
        desiredScale,
        appliedScale,
        fillRatio,
        maxFill: profile.maxModelViewportFill,
        lod,
        distanceToCamera: distance,
        screenCoverage: fillRatio,
      });
    }
  });

  return (
    <group ref={groupRef}>
      <group ref={primaryRef}>
        <mesh ref={primaryCoreRef}>
          <icosahedronGeometry args={[0.82, 2]} />
          <meshPhysicalMaterial
            ref={primaryCoreMaterialRef}
            color="#101522"
            emissive="#f6d7aa"
            emissiveIntensity={0.82}
            transparent
            opacity={0.82}
            transmission={0.18}
            thickness={0.28}
            roughness={0.18}
            metalness={0.74}
            depthWrite={false}
          />
        </mesh>
        <mesh ref={primaryShellRef} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.32, 0.09, 16, 88]} />
          <meshPhysicalMaterial
            ref={primaryShellMaterialRef}
            color="#f3d6a2"
            emissive="#ffd9b2"
            emissiveIntensity={0.36}
            transparent
            opacity={0.38}
            transmission={0.4}
            thickness={0.22}
            roughness={0.14}
            metalness={0.12}
            depthWrite={false}
          />
        </mesh>
        <mesh ref={primaryOrbitRef}>
          <octahedronGeometry args={[0.22, 0]} />
          <meshBasicMaterial
            ref={primaryOrbitMaterialRef}
            color="#fff3df"
            transparent
            opacity={0.26}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
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
        <mesh ref={supportCoreRef}>
          <icosahedronGeometry args={[0.58, 2]} />
          <meshPhysicalMaterial
            ref={supportCoreMaterialRef}
            color="#f0c3ff"
            emissive="#ffd2f0"
            emissiveIntensity={0.72}
            transparent
            opacity={0.72}
            transmission={0.48}
            thickness={0.42}
            roughness={0.12}
            metalness={0.12}
            depthWrite={false}
          />
        </mesh>
        <mesh ref={supportHaloRef} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.92, 0.05, 12, 72]} />
          <meshBasicMaterial
            ref={supportHaloMaterialRef}
            color="#ffb4dc"
            transparent
            opacity={0.24}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        <mesh ref={supportOrbRef}>
          <octahedronGeometry args={[0.28, 0]} />
          <meshBasicMaterial
            ref={supportOrbMaterialRef}
            color="#ffe7f4"
            transparent
            opacity={0.32}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
}

function ApotheosisHero({
  actIndex,
  profile,
  runtimeCaps,
  auditEnabled = true,
}: HeroSceneProps) {
  const motionRef = useWorldMotionRef();
  const groupRef = useRef<THREE.Group>(null);
  const orbitDiskRef = useRef<THREE.Mesh>(null);
  const worldPosRef = useRef(new THREE.Vector3());
  const tempOffset = useRef(new THREE.Vector3());
  const heroOffset = useMemo(
    () => new THREE.Vector3(...profile.compositionZone.heroOffset),
    [profile]
  );
  const gltf = useGLTF(HERO_ASSET_PATHS.black_hole);
  const heroLease = usePreparedHeroSceneLease({
    sourceScene: gltf.scene,
    assetId: profile.heroAsset,
    grade: profile.materialGrade,
    accent: profile.accent,
  });
  const sceneClone = heroLease.object;
  const bounds = useSceneBounds(gltf.scene);
  const preparedScene = heroLease.meta;
  const materials = preparedScene.materials;
  const fittedMaxScale = useHeroScale(profile, bounds.height);

  useEffect(() => {
    if (!auditEnabled) {
      return;
    }
    return () => {
      const audit = useViewportAuditStore.getState();
      audit.clearHeroModel(profile.heroLabel);
      audit.clearFxLayer("apotheosis-core");
    };
  }, [auditEnabled, profile.heroLabel]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const motion = motionRef.current;
    const visibility = THREE.MathUtils.clamp(getActWeight(motion, actIndex) * 1.24, 0, 1);
    const reportMetric = auditEnabled && motion.metricActIndex === actIndex;
    groupRef.current.visible = visibility > 0.01;
    if (!groupRef.current.visible) return;

    const t = state.clock.elapsedTime;
    tempOffset.current
      .copy(motion.pointerOffset)
      .multiplyScalar(0.12)
      .add(heroOffset);
    groupRef.current.position.copy(motion.worldAnchor).add(tempOffset.current);
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
    const fillRatio = computeViewportFillRatio(bounds.height, appliedScale, visibleHeight);
    const lod = resolveDetailLod({
      distance,
      fillRatio,
      tier: runtimeCaps?.tier ?? "low",
      prefersReducedMotion: runtimeCaps?.prefersReducedMotion,
    });
    updateMeshLod(preparedScene.meshes, lod, Boolean(runtimeCaps?.enableShadows));
    updateMaterialState(
      materials,
      visibility,
      1.15 + motion.pointerOffset.length() * 0.6,
      lod
    );
    if (reportMetric) {
      useViewportAuditStore.getState().reportSceneState({ activeHeroLod: lod });
      useViewportAuditStore.getState().reportHeroModel(profile.heroLabel, {
        desiredScale,
        appliedScale,
        fillRatio,
        maxFill: profile.maxModelViewportFill,
        lod,
        distanceToCamera: distance,
        screenCoverage: fillRatio,
      });
      useViewportAuditStore.getState().reportFxLayer("apotheosis-core", {
        opacity: visibility * 0.58,
        scale: 0.78 + visibility * 0.9,
        lod,
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
  mountedActIndices,
  mountedFxActIndices,
  includeWarmedHeroActs = true,
  auditEnabled = true,
  includeActFx = true,
}: CuratedHeroLayerProps) {
  const runtimeCaps = useCapsStore((state) => state.caps);
  const warmedActs = useSceneLoadStore((state) => state.warmedActs);
  const mountedActSet = useMemo(
    () => new Set(mountedFxActIndices ?? mountedActIndices),
    [mountedActIndices, mountedFxActIndices]
  );
  const mountedHeroActSet = useMemo(
    () =>
      new Set(
        includeWarmedHeroActs
          ? [...mountedActIndices, ...warmedActs]
          : mountedActIndices
      ),
    [includeWarmedHeroActs, mountedActIndices, warmedActs]
  );

  return (
    <>
      {/* Each hero has its own Suspense boundary so they mount independently as their
          GLTFs resolve. Without this, a single shared boundary blocks all heroes until
          every model is loaded, which defeats the warmup pass and delays first input. */}
      {mountedHeroActSet.has(0) ? (
        <Suspense fallback={null}>
          <SeedHero
            actIndex={0}
            profile={WORLD_PHASES[0]}
            runtimeCaps={runtimeCaps}
            auditEnabled={auditEnabled}
          />
        </Suspense>
      ) : null}
      {includeActFx && mountedActSet.has(0) ? (
        <Suspense fallback={null}>
          <Act1Emergence auditEnabled={auditEnabled} />
        </Suspense>
      ) : null}
      {mountedHeroActSet.has(1) ? (
        <Suspense fallback={null}>
          <ScaffoldHero
            actIndex={1}
            profile={WORLD_PHASES[1]}
            runtimeCaps={runtimeCaps}
            auditEnabled={auditEnabled}
          />
        </Suspense>
      ) : null}
      {includeActFx && mountedActSet.has(1) ? (
        <Suspense fallback={null}>
          <Act2Structure />
        </Suspense>
      ) : null}
      {mountedHeroActSet.has(2) ? (
        <Suspense fallback={null}>
          <CirculationHero
            actIndex={2}
            profile={WORLD_PHASES[2]}
            runtimeCaps={runtimeCaps}
            auditEnabled={auditEnabled}
          />
        </Suspense>
      ) : null}
      {includeActFx && mountedActSet.has(2) ? (
        <Suspense fallback={null}>
          <Act3Flow />
        </Suspense>
      ) : null}
      {mountedHeroActSet.has(3) ? (
        <Suspense fallback={null}>
          <SentienceHero
            actIndex={3}
            profile={WORLD_PHASES[3]}
            runtimeCaps={runtimeCaps}
            auditEnabled={auditEnabled}
          />
        </Suspense>
      ) : null}
      {includeActFx && mountedActSet.has(3) ? (
        <Suspense fallback={null}>
          <Act4Quantum />
        </Suspense>
      ) : null}
      {mountedHeroActSet.has(4) ? (
        <Suspense fallback={null}>
          <ApotheosisHero
            actIndex={4}
            profile={WORLD_PHASES[4]}
            runtimeCaps={runtimeCaps}
            auditEnabled={auditEnabled}
          />
        </Suspense>
      ) : null}
      {includeActFx && mountedActSet.has(4) ? (
        <Suspense fallback={null}>
          <Act5Convergence auditEnabled={auditEnabled} />
        </Suspense>
      ) : null}
      {includeActFx && mountedActSet.has(5) ? (
        <Suspense fallback={null}>
          <Act6QuantumConsciousness />
        </Suspense>
      ) : null}
    </>
  );
}
