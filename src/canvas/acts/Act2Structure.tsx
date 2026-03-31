"use client";

import { Suspense, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { WireframePulseMaterial } from "@/canvas/materials/WireframePulse";
import { ACT_VIEWPORT_PROFILES } from "@/canvas/viewportProfiles";
import { resolveTextureVariantUrl } from "@/canvas/assetManifest";
import {
  getTextureSamplingOptions,
  useActMaterialTierConfig,
} from "@/canvas/acts/materialTierConfig";
import { seededUnit } from "@/lib/random";
import { DynamicShaderBg } from "@/canvas/environment/DynamicShaderBg";
import {
  fitScaleToViewportFill,
  useSceneBounds,
} from "@/lib/scene";
import { usePreparedSceneLease } from "@/lib/preparedSceneCache";
import { useOptionalRepeatingTexture } from "@/lib/textures";
import { getActWeight, useWorldMotionRef } from "@/canvas/worldMotion";

const ACT_PROFILE = ACT_VIEWPORT_PROFILES[1];
const ACT_INDEX = 1;

interface PreparedSupportScene {
  meshCount: number;
}

function buildSupportSceneCacheKey(
  tierConfig: ReturnType<typeof useActMaterialTierConfig>
) {
  return [
    "support:satellites",
    tierConfig.mesh.detail,
    tierConfig.texture.resolution,
    tierConfig.material.emissiveScale,
  ].join("|");
}

function prepareSupportScene(scene: THREE.Object3D): PreparedSupportScene {
  let meshCount = 0;

  scene.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (!mesh.isMesh) {
      return;
    }

    meshCount += 1;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    mesh.frustumCulled = true;
    mesh.geometry.computeBoundingSphere();
  });

  return { meshCount };
}

function SatellitesModel({
  tierConfig,
}: {
  tierConfig: ReturnType<typeof useActMaterialTierConfig>;
}) {
  const motionRef = useWorldMotionRef();
  const groupRef = useRef<THREE.Group>(null);
  const gltf = useGLTF("/models/satellites/scene.gltf");
  const cacheKey = useMemo(
    () => buildSupportSceneCacheKey(tierConfig),
    [tierConfig]
  );
  const sceneLease = usePreparedSceneLease(
    cacheKey,
    gltf.scene,
    prepareSupportScene
  );
  const sceneClone = sceneLease.object;
  const bounds = useSceneBounds(gltf.scene);

  const fittedMaxScale = useMemo(
    () =>
      fitScaleToViewportFill({
        desiredScale: 0.01,
        rawHeight: bounds.height,
        maxFill: ACT_PROFILE.maxModelViewportFill * 0.9,
        previewCamera: ACT_PROFILE.previewCamera,
        settleCamera: ACT_PROFILE.settleCamera,
      }),
    [bounds.height]
  );

  useFrame((state) => {
    if (!groupRef.current) return;
    const progress = getActWeight(motionRef.current, ACT_INDEX);
    const visible = progress > 0.01;
    groupRef.current.visible = visible;
    if (!visible) return;
    groupRef.current.rotation.y = -state.clock.elapsedTime * 0.08;
    const appear = Math.max(0, (progress - 0.3) / 0.4);
    groupRef.current.scale.setScalar(
      Math.min(Math.min(appear, 1) * 0.014, fittedMaxScale)
    );
  });

  return (
    <group ref={groupRef} position={[4.6, 1.2, -2.8]}>
      <primitive object={sceneClone} />
    </group>
  );
}

export function Act2Structure() {
  const motionRef = useWorldMotionRef();
  const groupRef = useRef<THREE.Group>(null);
  const globeRef = useRef<THREE.Mesh>(null);
  const instanceRef = useRef<THREE.InstancedMesh>(null);
  const pointLightRef = useRef<THREE.PointLight>(null);
  const fillLightRef = useRef<THREE.PointLight>(null);

  const tierConfig = useActMaterialTierConfig(1);
  const bodyCount = tierConfig.mesh.bodyCount;
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const orbits = useMemo(() => {
    return Array.from({ length: bodyCount }, (_, i) => ({
      radius: 2.5 + seededUnit(i * 17 + 1) * 3.8,
      speed: 0.12 + seededUnit(i * 17 + 2) * 0.22,
      tilt: seededUnit(i * 17 + 3) * Math.PI,
      phase: (i / bodyCount) * Math.PI * 2,
      scale: 0.04 + seededUnit(i * 17 + 4) * 0.12,
      yOffset: seededUnit(i * 17 + 5) * 2.2 - 1.1,
    }));
  }, [bodyCount]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const progress = getActWeight(motionRef.current, ACT_INDEX);
    const visible = progress > 0.01;
    groupRef.current.visible = visible;
    if (!visible) return;
    const t = state.clock.elapsedTime;
    groupRef.current.position.set(0.9, -0.1, 0);

    if (globeRef.current) {
      globeRef.current.rotation.y = t * 0.12;
      globeRef.current.rotation.x = Math.sin(t * 0.08) * 0.1;
      const scaleIn = Math.min(progress / 0.25, 1);
      globeRef.current.scale.setScalar(scaleIn * 1.35);
      globeRef.current.position.set(2.2, 0.1, 0);
    }

    if (instanceRef.current) {
      for (let i = 0; i < bodyCount; i++) {
        const orbit = orbits[i];
        const angle = t * orbit.speed + orbit.phase;
        const bodyProgress = Math.max(0, (progress - 0.08 - i * 0.015) / 0.35);
        const appear = Math.min(1, bodyProgress);
        const fadeOut = progress > 0.85 ? 1 - (progress - 0.85) / 0.15 : 1;

        dummy.position.set(
          2.1 + Math.cos(angle) * orbit.radius * Math.cos(orbit.tilt),
          orbit.yOffset + Math.sin(t * 0.5 + orbit.phase) * 0.35,
          Math.sin(angle) * orbit.radius
        );
        dummy.scale.setScalar(orbit.scale * appear * fadeOut);
        dummy.rotation.set(
          t * orbit.speed * 0.5,
          t * orbit.speed * 0.3,
          t * orbit.speed * 0.7
        );
        dummy.updateMatrix();
        instanceRef.current.setMatrixAt(i, dummy.matrix);
      }
      instanceRef.current.instanceMatrix.needsUpdate = true;
    }

    const fadeIn = Math.min(progress / 0.15, 1);
    const fadeOut = progress > 0.85 ? 1 - (progress - 0.85) / 0.15 : 1;
    groupRef.current.visible = visible && fadeIn * fadeOut > 0.01;
    if (pointLightRef.current) {
      pointLightRef.current.intensity = progress * 10;
    }
    if (fillLightRef.current) {
      fillLightRef.current.intensity = progress * 2;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      <DynamicShaderBg actIndex={ACT_INDEX} />

      <mesh ref={globeRef}>
        <icosahedronGeometry args={[2, 4]} />
        <WireframePulseMaterial color="#6dc7ff" pulseSpeed={1.5} />
      </mesh>

      <instancedMesh
        ref={instanceRef}
        args={[undefined, undefined, bodyCount]}
        castShadow
      >
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color="#6dc7ff"
          emissive="#6dc7ff"
          emissiveIntensity={0.22}
          metalness={0.95}
          roughness={0.18}
        />
      </instancedMesh>

      <Suspense fallback={null}>
        <SatellitesModel tierConfig={tierConfig} />
      </Suspense>

      <Rock063Ground tierConfig={tierConfig} />

      <pointLight
        ref={pointLightRef}
        color="#6dc7ff"
        intensity={0}
        distance={25}
        decay={2}
      />
      <pointLight
        ref={fillLightRef}
        color="#ffffff"
        intensity={0}
        distance={12}
        decay={2}
        position={[2.2, 4.4, 0]}
      />
    </group>
  );
}

function Rock063Ground({
  tierConfig,
}: {
  tierConfig: ReturnType<typeof useActMaterialTierConfig>;
}) {
  const motionRef = useWorldMotionRef();
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const colorMap = useOptionalRepeatingTexture(
    tierConfig.texture.useColorMap
      ? resolveTextureVariantUrl(
          "/textures/pbr/rock063/Rock063_2K-PNG_Color.png",
          tierConfig.texture.resolution
        )
      : null,
    getTextureSamplingOptions(tierConfig.texture, {
      repeat: 8,
      colorSpace: THREE.SRGBColorSpace,
    })
  );
  const normalMap = useOptionalRepeatingTexture(
    tierConfig.texture.useNormalMap
      ? "/textures/pbr/rock063/Rock063_2K-PNG_NormalGL.png"
      : null,
    getTextureSamplingOptions(tierConfig.texture, { repeat: 8 })
  );
  const roughnessMap = useOptionalRepeatingTexture(
    tierConfig.texture.useRoughnessMap
      ? "/textures/pbr/rock063/Rock063_2K-PNG_Roughness.png"
      : null,
    getTextureSamplingOptions(tierConfig.texture, { repeat: 8 })
  );

  useFrame(() => {
    const progress = getActWeight(motionRef.current, ACT_INDEX);
    if (progress <= 0.01) return;
    if (matRef.current) {
      matRef.current.opacity = Math.min(progress / 0.4, 1) * 0.34;
    }
  });

  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, -5.2, 0]}>
      <circleGeometry args={[25, 64]} />
      <meshStandardMaterial
        ref={matRef}
        map={tierConfig.texture.useColorMap ? colorMap : null}
        normalMap={tierConfig.texture.useNormalMap ? normalMap : null}
        roughnessMap={tierConfig.texture.useRoughnessMap ? roughnessMap : null}
        roughness={1}
        metalness={0}
        transparent
        opacity={0}
        envMapIntensity={0.45}
        depthWrite={false}
      />
    </mesh>
  );
}
useGLTF.preload("/models/satellites/scene.gltf");
