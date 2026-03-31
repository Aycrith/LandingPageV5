"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { resolveTextureVariantUrl } from "@/canvas/assetManifest";
import { CrystalMaterial } from "@/canvas/materials/CrystalMaterial";
import { seededSigned, seededUnit } from "@/lib/random";
import { useOptionalRepeatingTexture } from "@/lib/textures";
import { useActMaterialTierConfig, getTextureSamplingOptions } from "./materialTierConfig";
import { DottedWave } from "@/canvas/environment/DottedWave";
import { getActWeight, useWorldMotionRef } from "@/canvas/worldMotion";

const ACT_INDEX = 3;

export function Act4Quantum() {
  const motionRef = useWorldMotionRef();
  const groupRef = useRef<THREE.Group>(null);
  const attractor1Ref = useRef<THREE.Mesh>(null);
  const attractor2Ref = useRef<THREE.Mesh>(null);
  const orbitalsRef = useRef<THREE.InstancedMesh>(null);
  const keyLightRef = useRef<THREE.PointLight>(null);
  const fillLightRef = useRef<THREE.PointLight>(null);

  const tierConfig = useActMaterialTierConfig(3);
  const orbitalCount = tierConfig.mesh.orbitalCount;
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const orbitalData = useMemo(() => {
    return Array.from({ length: orbitalCount }, (_, i) => ({
      angle: (i / orbitalCount) * Math.PI * 2,
      radius: 0.9 + seededUnit(i * 29 + 1) * 3.2,
      speed: 0.25 + seededUnit(i * 29 + 2) * 1.5,
      axis: new THREE.Vector3(
        seededSigned(i * 29 + 3),
        seededSigned(i * 29 + 4),
        seededSigned(i * 29 + 5)
      ).normalize(),
      scale: 0.014 + seededUnit(i * 29 + 6) * 0.032,
      attractorBias: seededUnit(i * 29 + 7),
    }));
  }, [orbitalCount]);

  const quatTempRef = useRef(new THREE.Quaternion());
  const posTempRef = useRef(new THREE.Vector3());

  useFrame((state) => {
    if (!groupRef.current) return;
    const progress = getActWeight(motionRef.current, ACT_INDEX);
    const visible = progress > 0.01;
    groupRef.current.visible = visible;
    if (!visible) return;
    const t = state.clock.elapsedTime;

    const separation = Math.sin(progress * Math.PI) * 3.2;
    groupRef.current.position.y = -0.4;

    if (attractor1Ref.current) {
      attractor1Ref.current.position.x = -separation;
      attractor1Ref.current.rotation.y = t * 0.5;
      attractor1Ref.current.rotation.x = t * 0.3;
      const scale = 0.62 + Math.sin(t * 3) * 0.06;
      attractor1Ref.current.scale.setScalar(scale);
    }

    if (attractor2Ref.current) {
      attractor2Ref.current.position.x = separation;
      attractor2Ref.current.rotation.y = -t * 0.4;
      attractor2Ref.current.rotation.z = t * 0.2;
      const scale = 0.62 + Math.cos(t * 3) * 0.06;
      attractor2Ref.current.scale.setScalar(scale);
    }

    if (orbitalsRef.current) {
      const quatTemp = quatTempRef.current;
      const posTemp = posTempRef.current;

      for (let i = 0; i < orbitalCount; i++) {
        const data = orbitalData[i];
        const angle = t * data.speed + data.angle;

        const oscillation =
          Math.sin(progress * Math.PI * 4 + data.angle) * 0.5 + 0.5;
        const bias = data.attractorBias * 0.6 + oscillation * 0.4;
        const centerX = THREE.MathUtils.lerp(-separation, separation, bias);

        quatTemp.setFromAxisAngle(data.axis, angle);
        posTemp.set(data.radius, 0, 0).applyQuaternion(quatTemp);
        posTemp.set(posTemp.x + centerX, posTemp.y, posTemp.z);

        const appear = Math.min(progress / 0.15, 1);
        const fadeOut = progress > 0.85 ? 1 - (progress - 0.85) / 0.15 : 1;

        dummy.position.copy(posTemp);
        dummy.scale.setScalar(data.scale * appear * fadeOut);
        dummy.updateMatrix();
        orbitalsRef.current.setMatrixAt(i, dummy.matrix);
      }
      orbitalsRef.current.instanceMatrix.needsUpdate = true;
    }

    groupRef.current.visible = progress > 0.01;
    if (keyLightRef.current) {
      keyLightRef.current.intensity =
        progress * 10 * tierConfig.material.emissiveScale;
    }
    if (fillLightRef.current) {
      fillLightRef.current.intensity =
        progress * 10 * tierConfig.material.emissiveScale;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      <DottedWave actIndex={ACT_INDEX} color="#ffd06f" yOffset={-4.1} />

      <mesh ref={attractor1Ref}>
        <dodecahedronGeometry args={[0.5, tierConfig.mesh.primaryDetail]} />
        <CrystalMaterial
          color="#ffd06f"
          fresnelPower={tierConfig.shader.crystalFresnel}
          iridescenceStrength={tierConfig.shader.crystalIridescence}
        />
      </mesh>

      <mesh ref={attractor2Ref}>
        <dodecahedronGeometry args={[0.5, tierConfig.mesh.primaryDetail]} />
        <CrystalMaterial
          color="#ff7eb3"
          fresnelPower={tierConfig.shader.crystalFresnel}
          iridescenceStrength={tierConfig.shader.crystalIridescence}
        />
      </mesh>

      <mesh position={[-3, 0, 0]}>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshBasicMaterial
          color="#ffd06f"
          transparent
          opacity={0.26}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      <mesh position={[3, 0, 0]}>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshBasicMaterial
          color="#ff7eb3"
          transparent
          opacity={0.26}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      <instancedMesh ref={orbitalsRef} args={[undefined, undefined, orbitalCount]}>
        <sphereGeometry args={[1, 4, 4]} />
        <meshBasicMaterial
          color="#ffd06f"
          transparent
          opacity={0.72}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </instancedMesh>

      <EnergyBeam
        beamPoints={tierConfig.mesh.beamPoints}
      />
      <Ground103Floor />
      <pointLight
        ref={keyLightRef}
        color="#ffd06f"
        intensity={0}
        distance={18}
        decay={2}
        position={[-3, 0, 0]}
      />
      <pointLight
        ref={fillLightRef}
        color="#ff7eb3"
        intensity={0}
        distance={18}
        decay={2}
        position={[3, 0, 0]}
      />
    </group>
  );
}

function EnergyBeam({
  beamPoints,
}: {
  beamPoints: number;
}) {
  const motionRef = useWorldMotionRef();
  const positionAttrRef = useRef<THREE.BufferAttribute>(null);
  const materialRef = useRef<THREE.LineBasicMaterial>(null);
  const positions = useMemo(() => {
    const data = new Float32Array(beamPoints * 3);
    for (let i = 0; i < beamPoints; i++) {
      const t = i / (beamPoints - 1);
      data[i * 3] = t * 2 - 1;
      data[i * 3 + 1] = 0;
      data[i * 3 + 2] = 0;
    }
    return data;
  }, [beamPoints]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pos = positionAttrRef.current;
    if (!pos) return;
    const progress = getActWeight(motionRef.current, ACT_INDEX);
    const visible = progress > 0.01;
    if (!visible) return;
    const separation = Math.sin(progress * Math.PI) * 3.5;
    const array = pos.array as Float32Array;

    for (let i = 0; i < pos.count; i++) {
      const frac = i / (pos.count - 1);
      array[i * 3] = THREE.MathUtils.lerp(-separation, separation, frac);
      array[i * 3 + 1] =
        Math.sin(frac * Math.PI * 4 + t * 5) * 0.22 * progress;
      array[i * 3 + 2] =
        Math.cos(frac * Math.PI * 3 + t * 4) * 0.14 * progress;
    }
    pos.needsUpdate = true;
    if (materialRef.current) {
      materialRef.current.opacity = progress * 0.6;
    }
  });

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          ref={positionAttrRef}
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial
        ref={materialRef}
        color="#ffffff"
        transparent
        opacity={0}
        blending={THREE.AdditiveBlending}
      />
    </line>
  );
}

function Ground103Floor() {
  const motionRef = useWorldMotionRef();
  const tierConfig = useActMaterialTierConfig(3);
  const colorOpts = getTextureSamplingOptions(tierConfig.texture, { repeat: 8, colorSpace: THREE.SRGBColorSpace });
  const mapOpts = getTextureSamplingOptions(tierConfig.texture, { repeat: 8 });
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const colorMap = useOptionalRepeatingTexture(
    tierConfig.texture.useColorMap
      ? resolveTextureVariantUrl(
          "/textures/pbr/ground103/Ground103_2K-PNG_Color.png",
          tierConfig.texture.resolution
        )
      : null,
    colorOpts
  );
  const normalMap = useOptionalRepeatingTexture(
    tierConfig.texture.useNormalMap
      ? "/textures/pbr/ground103/Ground103_2K-PNG_NormalGL.png"
      : null,
    mapOpts
  );
  const roughnessMap = useOptionalRepeatingTexture(
    tierConfig.texture.useRoughnessMap
      ? "/textures/pbr/ground103/Ground103_2K-PNG_Roughness.png"
      : null,
    mapOpts
  );

  useFrame(() => {
    const progress = getActWeight(motionRef.current, ACT_INDEX);
    if (progress <= 0.01) return;
    if (matRef.current) {
      matRef.current.opacity = Math.min(progress / 0.35, 1) * 0.68;
    }
  });

  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, -6, 0]}>
      <circleGeometry args={[28, tierConfig.mesh.circleSegments]} />
      <meshStandardMaterial
        ref={matRef}
        map={tierConfig.texture.useColorMap ? colorMap : null}
        normalMap={tierConfig.texture.useNormalMap ? normalMap : null}
        roughnessMap={tierConfig.texture.useRoughnessMap ? roughnessMap : null}
        roughness={0.9}
        metalness={0.05}
        transparent
        opacity={0}
        envMapIntensity={0.7 * tierConfig.material.envMapScale}
        depthWrite={false}
      />
    </mesh>
  );
}
