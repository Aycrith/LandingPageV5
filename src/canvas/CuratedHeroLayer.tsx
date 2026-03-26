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
  useStableSceneClone,
} from "@/lib/scene";
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
  runtimeCaps: RuntimeCaps | null;
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
  };
};

interface PreparedHeroScene {
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
    microTransparencyThreshold: 0.022,
  },
  streamlined: {
    transmissionScale: 0.2,
    iridescenceScale: 0.01,
    clearcoatScale: 0.22,
    envMapScale: 0.58,
    roughnessBias: 0.14,
    microTransparencyThreshold: 0.06,
  },
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

function prepareHeroScene(
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

    mesh.castShadow = true;
    mesh.receiveShadow = assetId !== "hologram";
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
    material.transparent = material.userData.forceTransparent ?? !nearOpaque;
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
    mesh.visible = !(isExpensiveTransparency && detailWeight < threshold);
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
  profile,
  reportMetric,
  weight,
  worldAnchor,
  pointerOffset,
  runtimeCaps,
}: HeroSceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const worldPosRef = useRef(new THREE.Vector3());
  const tempOffset = useRef(new THREE.Vector3());
  const gltf = useGLTF(HERO_ASSET_PATHS.dark_star);
  const sceneClone = useStableSceneClone(gltf.scene);
  const bounds = useSceneBounds(gltf.scene);
  const preparedScene = useMemo(
    () =>
      prepareHeroScene(
        sceneClone,
        profile.heroAsset,
        profile.materialGrade,
        profile.accent
      ),
    [sceneClone, profile]
  );
  const materials = preparedScene.materials;
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
    const fillRatio = computeViewportFillRatio(bounds.height, appliedScale, visibleHeight);
    const lod = resolveDetailLod({
      distance,
      fillRatio,
      tier: runtimeCaps?.tier ?? "low",
      prefersReducedMotion: runtimeCaps?.prefersReducedMotion,
    });
    updateMeshLod(preparedScene.meshes, lod, Boolean(runtimeCaps?.enableShadows));
    updateMaterialState(materials, visibility, 1 + pointerOffset.length() * 1.4, lod);

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
  profile,
  reportMetric,
  weight,
  worldAnchor,
  pointerOffset,
  runtimeCaps,
}: HeroSceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const worldPosRef = useRef(new THREE.Vector3());
  const tempOffset = useRef(new THREE.Vector3());
  const gltf = useGLTF(HERO_ASSET_PATHS.wireframe_globe);
  const sceneClone = useStableSceneClone(gltf.scene);
  const bounds = useSceneBounds(gltf.scene);
  const preparedScene = useMemo(
    () =>
      prepareHeroScene(
        sceneClone,
        profile.heroAsset,
        profile.materialGrade,
        profile.accent
      ),
    [sceneClone, profile]
  );
  const materials = preparedScene.materials;
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
    groupRef.current.scale.setScalar(appliedScale * (1 + pointerOffset.length() * 0.04));
    const fillRatio = computeViewportFillRatio(bounds.height, appliedScale, visibleHeight);
    const lod = resolveDetailLod({
      distance,
      fillRatio,
      tier: runtimeCaps?.tier ?? "low",
      prefersReducedMotion: runtimeCaps?.prefersReducedMotion,
    });
    updateMeshLod(preparedScene.meshes, lod, Boolean(runtimeCaps?.enableShadows));
    updateMaterialState(materials, visibility, 1 + pointerOffset.length() * 0.9, lod);

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
  profile,
  reportMetric,
  weight,
  worldAnchor,
  pointerOffset,
  runtimeCaps,
}: HeroSceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const worldPosRef = useRef(new THREE.Vector3());
  const tempOffset = useRef(new THREE.Vector3());
  const gltf = useGLTF(HERO_ASSET_PATHS.hologram);
  const sceneClone = useStableSceneClone(gltf.scene);
  const bounds = useSceneBounds(gltf.scene);
  const preparedScene = useMemo(
    () =>
      prepareHeroScene(
        sceneClone,
        profile.heroAsset,
        profile.materialGrade,
        profile.accent
      ),
    [sceneClone, profile]
  );
  const materials = preparedScene.materials;
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
      1.2 + pointerOffset.length() * 1.2,
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
  profile,
  reportMetric,
  weight,
  worldAnchor,
  pointerOffset,
  runtimeCaps,
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
  const primaryPreparedScene = useMemo(
    () =>
      prepareHeroScene(
        primaryClone,
        profile.heroAsset,
        profile.materialGrade,
        profile.accent
      ),
    [primaryClone, profile]
  );
  const primaryMaterials = primaryPreparedScene.materials;
  const supportPreparedScene = useMemo(
    () =>
      prepareHeroScene(
        supportClone,
        "paradox_abstract",
        profile.materialGrade,
        "#ffb4dc"
      ),
    [profile.materialGrade, supportClone]
  );
  const supportMaterials = supportPreparedScene.materials;
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

    primaryRef.current.getWorldPosition(worldPosRef.current);
    const camera = state.camera as THREE.PerspectiveCamera;
    const distance = worldPosRef.current.distanceTo(camera.position);
    const visibleHeight = getViewportHeightAtDistance(distance, camera.fov);
    const appliedScale = Math.min(
      desiredScale,
      (visibleHeight * profile.maxModelViewportFill) /
        Math.max(primaryBounds.height, 0.0001)
    );
    const fillRatio = computeViewportFillRatio(
      primaryBounds.height,
      appliedScale,
      visibleHeight
    );
    const lod = resolveDetailLod({
      distance,
      fillRatio,
      tier: runtimeCaps?.tier ?? "low",
      prefersReducedMotion: runtimeCaps?.prefersReducedMotion,
    });
    updateMeshLod(primaryPreparedScene.meshes, lod, Boolean(runtimeCaps?.enableShadows));
    updateMeshLod(supportPreparedScene.meshes, lod, Boolean(runtimeCaps?.enableShadows));
    updateMaterialState(primaryMaterials, visibility, 1.1 + pointerOffset.length(), lod);
    updateMaterialState(
      supportMaterials,
      visibility * 0.8,
      0.85 + pointerOffset.length(),
      lod
    );
    primaryRef.current.scale.setScalar(appliedScale);
    supportRef.current.scale.setScalar(appliedScale * 3.4);
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
  runtimeCaps,
}: HeroSceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const orbitDiskRef = useRef<THREE.Mesh>(null);
  const worldPosRef = useRef(new THREE.Vector3());
  const tempOffset = useRef(new THREE.Vector3());
  const gltf = useGLTF(HERO_ASSET_PATHS.black_hole);
  const sceneClone = useStableSceneClone(gltf.scene);
  const bounds = useSceneBounds(gltf.scene);
  const preparedScene = useMemo(
    () =>
      prepareHeroScene(
        sceneClone,
        profile.heroAsset,
        profile.materialGrade,
        profile.accent
      ),
    [sceneClone, profile]
  );
  const materials = preparedScene.materials;
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
    const fillRatio = computeViewportFillRatio(bounds.height, appliedScale, visibleHeight);
    const lod = resolveDetailLod({
      distance,
      fillRatio,
      tier: runtimeCaps?.tier ?? "low",
      prefersReducedMotion: runtimeCaps?.prefersReducedMotion,
    });
    updateMeshLod(preparedScene.meshes, lod, Boolean(runtimeCaps?.enableShadows));
    updateMaterialState(materials, visibility, 1.15 + pointerOffset.length() * 0.6, lod);
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
  activeMetricIndex,
  weights,
  rebirthBlend,
  worldAnchor,
  pointerOffset,
}: CuratedHeroLayerProps) {
  const runtimeCaps = useCapsStore((state) => state.caps);

  // Progressive asset preloading: only load the current act and the next two so
  // assets for acts 3-5 are not downloaded until the user scrolls toward them.
  useEffect(() => {
    const ASSETS_BY_ACT: string[][] = [
      [HERO_ASSET_PATHS.dark_star],
      [HERO_ASSET_PATHS.wireframe_globe],
      [HERO_ASSET_PATHS.hologram],
      [HERO_ASSET_PATHS.quantum_leap, HERO_ASSET_PATHS.paradox_abstract],
      [HERO_ASSET_PATHS.black_hole],
    ];
    const limit = Math.min(activeMetricIndex + 2, ASSETS_BY_ACT.length - 1);
    for (let i = activeMetricIndex; i <= limit; i++) {
      ASSETS_BY_ACT[i].forEach((path) => useGLTF.preload(path));
    }
  }, [activeMetricIndex]);

  return (
    <>
      {/* Each hero has its own Suspense boundary so they mount independently as their
          GLTFs resolve. Without this, a single shared boundary blocks all heroes until
          every model is loaded — preventing SeedHero from marking seed-core ready. */}
      <Suspense fallback={null}>
        <SeedHero
          profile={WORLD_PHASES[0]}
          reportMetric={activeMetricIndex === 0}
          weight={weights[0] + rebirthBlend}
          worldAnchor={worldAnchor}
          pointerOffset={pointerOffset}
          runtimeCaps={runtimeCaps}
        />
      </Suspense>
      <Suspense fallback={null}>
        <Act1Emergence
          progress={weights[0] + rebirthBlend}
          visible={(weights[0] + rebirthBlend) > 0.01}
        />
      </Suspense>
      <Suspense fallback={null}>
        <ScaffoldHero
          profile={WORLD_PHASES[1]}
          reportMetric={activeMetricIndex === 1}
          weight={weights[1]}
          worldAnchor={worldAnchor}
          pointerOffset={pointerOffset}
          runtimeCaps={runtimeCaps}
        />
      </Suspense>
      <Suspense fallback={null}>
        <Act2Structure
          progress={weights[1]}
          visible={weights[1] > 0.01}
        />
      </Suspense>
      <Suspense fallback={null}>
        <CirculationHero
          profile={WORLD_PHASES[2]}
          reportMetric={activeMetricIndex === 2}
          weight={weights[2]}
          worldAnchor={worldAnchor}
          pointerOffset={pointerOffset}
          runtimeCaps={runtimeCaps}
        />
      </Suspense>
      <Suspense fallback={null}>
        <Act3Flow
          progress={weights[2]}
          visible={weights[2] > 0.01}
        />
      </Suspense>
      <Suspense fallback={null}>
        <SentienceHero
          profile={WORLD_PHASES[3]}
          reportMetric={activeMetricIndex === 3}
          weight={weights[3]}
          worldAnchor={worldAnchor}
          pointerOffset={pointerOffset}
          runtimeCaps={runtimeCaps}
        />
      </Suspense>
      <Suspense fallback={null}>
        <Act4Quantum
          progress={weights[3]}
          visible={weights[3] > 0.01}
        />
      </Suspense>
      <Suspense fallback={null}>
        <ApotheosisHero
          profile={WORLD_PHASES[4]}
          reportMetric={activeMetricIndex === 4}
          weight={weights[4]}
          worldAnchor={worldAnchor}
          pointerOffset={pointerOffset}
          runtimeCaps={runtimeCaps}
        />
      </Suspense>
      <Suspense fallback={null}>
        <Act5Convergence
          progress={weights[4]}
          visible={weights[4] > 0.01}
        />
      </Suspense>
      <Suspense fallback={null}>
        <Act6QuantumConsciousness
          progress={weights[5] ?? 0}
          visible={(weights[5] ?? 0) > 0.01}
        />
      </Suspense>
    </>
  );
}

// Preload only the first-act hero immediately; remaining heroes are loaded
// progressively via CuratedHeroLayer as the user scrolls into each act.
useGLTF.preload(HERO_ASSET_PATHS.dark_star);
