"use client";

import { useRef, useMemo, Suspense } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { CrystalMaterial } from "@/canvas/materials/CrystalMaterial";
import { ACT_VIEWPORT_PROFILES } from "@/canvas/viewportProfiles";
import { useViewportAuditStore } from "@/stores/viewportAuditStore";
import { seededSigned, seededUnit } from "@/lib/random";
import {
  fitScaleToViewportFill,
  getViewportHeightAtDistance,
  useSceneBounds,
  useStableSceneClone,
} from "@/lib/scene";
import { useRepeatingTexture } from "@/lib/textures";

interface ActProps {
  progress: number;
  visible: boolean;
}

const ACT_PROFILE = ACT_VIEWPORT_PROFILES[3];

function QuantumModel({ progress }: { progress: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const gltf = useGLTF("/models/quantum_leap/scene.gltf");
  const sceneClone = useStableSceneClone(gltf.scene);
  const bounds = useSceneBounds(gltf.scene);

  const fittedMaxScale = useMemo(
    () =>
      fitScaleToViewportFill({
        desiredScale: 0.02,
        rawHeight: bounds.height,
        maxFill: ACT_PROFILE.maxModelViewportFill * 0.95,
        previewCamera: ACT_PROFILE.previewCamera,
        settleCamera: ACT_PROFILE.settleCamera,
      }),
    [bounds.height]
  );

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.rotation.y = t * 0.1;
    const appear = Math.min(progress / 0.3, 1);
    groupRef.current.scale.setScalar(Math.min(appear * 0.02, fittedMaxScale));
  });

  return (
    <group ref={groupRef}>
      <primitive object={sceneClone} />
    </group>
  );
}

function ParadoxModel({ progress }: { progress: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const worldPosRef = useRef(new THREE.Vector3());
  const gltf = useGLTF("/models/paradox_abstract_art_of_python.glb");
  const sceneClone = useStableSceneClone(gltf.scene);
  const bounds = useSceneBounds(gltf.scene);

  const fittedMaxScale = useMemo(
    () =>
      fitScaleToViewportFill({
        desiredScale: ACT_PROFILE.heroModelBehavior.maxScale,
        rawHeight: bounds.height,
        maxFill:
          ACT_PROFILE.maxModelViewportFill *
          ACT_PROFILE.heroModelBehavior.fitPadding,
        previewCamera: ACT_PROFILE.previewCamera,
        settleCamera: ACT_PROFILE.settleCamera,
      }),
    [bounds.height]
  );

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    const camera = state.camera as THREE.PerspectiveCamera;
    groupRef.current.rotation.y = -t * 0.15;
    groupRef.current.rotation.z = Math.sin(t * 0.3) * 0.2;
    const appear = Math.max(0, (progress - 0.15) / 0.3);
    const desiredScale =
      Math.min(appear, 1) * ACT_PROFILE.heroModelBehavior.maxScale;
    const appliedScale = Math.min(desiredScale, fittedMaxScale);
    groupRef.current.scale.setScalar(appliedScale);
    groupRef.current.position.x = Math.sin(t * 0.2) * 2 - 3;
    groupRef.current.position.y = Math.cos(t * 0.15) * 1.5;

    groupRef.current.getWorldPosition(worldPosRef.current);
    const distance = worldPosRef.current.distanceTo(camera.position);
    const visibleHeight = getViewportHeightAtDistance(distance, camera.fov);

    useViewportAuditStore.getState().reportHeroModel("act4-paradox", {
      desiredScale,
      appliedScale,
      fillRatio: (bounds.height * appliedScale) / visibleHeight,
      maxFill: ACT_PROFILE.maxModelViewportFill,
    });
  });

  return (
    <group
      ref={groupRef}
      position={[
        -3 + ACT_PROFILE.heroModelBehavior.focusOffset[0],
        ACT_PROFILE.heroModelBehavior.focusOffset[1],
        ACT_PROFILE.heroModelBehavior.focusOffset[2],
      ]}
    >
      <primitive object={sceneClone} />
    </group>
  );
}

export function Act4Quantum({ progress, visible }: ActProps) {
  const groupRef = useRef<THREE.Group>(null);
  const attractor1Ref = useRef<THREE.Mesh>(null);
  const attractor2Ref = useRef<THREE.Mesh>(null);
  const orbitalsRef = useRef<THREE.InstancedMesh>(null);

  const orbitalCount = 100;
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const orbitalData = useMemo(() => {
    return Array.from({ length: orbitalCount }, (_, i) => ({
      angle: (i / orbitalCount) * Math.PI * 2,
      radius: 0.8 + seededUnit(i * 29 + 1) * 4.5,
      speed: 0.4 + seededUnit(i * 29 + 2) * 2.5,
      axis: new THREE.Vector3(
        seededSigned(i * 29 + 3),
        seededSigned(i * 29 + 4),
        seededSigned(i * 29 + 5)
      ).normalize(),
      scale: 0.02 + seededUnit(i * 29 + 6) * 0.06,
      attractorBias: seededUnit(i * 29 + 7),
    }));
  }, []);

  const quatTempRef = useRef(new THREE.Quaternion());
  const posTempRef = useRef(new THREE.Vector3());

  useFrame((state) => {
    if (!visible || !groupRef.current) return;
    const t = state.clock.elapsedTime;

    const separation = Math.sin(progress * Math.PI) * 3.5;

    if (attractor1Ref.current) {
      attractor1Ref.current.position.x = -separation;
      attractor1Ref.current.rotation.y = t * 0.5;
      attractor1Ref.current.rotation.x = t * 0.3;
      const scale = 0.5 + Math.sin(t * 3) * 0.08;
      attractor1Ref.current.scale.setScalar(scale);
    }

    if (attractor2Ref.current) {
      attractor2Ref.current.position.x = separation;
      attractor2Ref.current.rotation.y = -t * 0.4;
      attractor2Ref.current.rotation.z = t * 0.2;
      const scale = 0.5 + Math.cos(t * 3) * 0.08;
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
  });

  if (!visible) return null;

  return (
    <group ref={groupRef}>
      <mesh ref={attractor1Ref}>
        <dodecahedronGeometry args={[0.5, 2]} />
        <CrystalMaterial
          color="#ffd06f"
          fresnelPower={2.0}
          iridescenceStrength={0.8}
        />
      </mesh>

      <mesh ref={attractor2Ref}>
        <dodecahedronGeometry args={[0.5, 2]} />
        <CrystalMaterial
          color="#ff7eb3"
          fresnelPower={2.0}
          iridescenceStrength={0.8}
        />
      </mesh>

      <mesh position={[-3, 0, 0]}>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshBasicMaterial
          color="#ffd06f"
          transparent
          opacity={0.38}
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
          opacity={0.38}
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
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </instancedMesh>

      <EnergyBeam progress={progress} />
      <Ground103Floor progress={progress} />

      <Suspense fallback={null}>
        <QuantumModel progress={progress} />
        <ParadoxModel progress={progress} />
      </Suspense>

      <pointLight
        color="#ffd06f"
        intensity={12}
        distance={20}
        decay={2}
        position={[-3, 0, 0]}
      />
      <pointLight
        color="#ff7eb3"
        intensity={12}
        distance={20}
        decay={2}
        position={[3, 0, 0]}
      />
    </group>
  );
}

function EnergyBeam({ progress }: { progress: number }) {
  const positionAttrRef = useRef<THREE.BufferAttribute>(null);
  const materialRef = useRef<THREE.LineBasicMaterial>(null);
  const positions = useMemo(() => {
    const data = new Float32Array(50 * 3);
    for (let i = 0; i < 50; i++) {
      const t = i / 49;
      data[i * 3] = t * 2 - 1;
      data[i * 3 + 1] = 0;
      data[i * 3 + 2] = 0;
    }
    return data;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pos = positionAttrRef.current;
    if (!pos) return;
    const separation = Math.sin(progress * Math.PI) * 3.5;
    const array = pos.array as Float32Array;

    for (let i = 0; i < pos.count; i++) {
      const frac = i / (pos.count - 1);
      array[i * 3] = THREE.MathUtils.lerp(-separation, separation, frac);
      array[i * 3 + 1] =
        Math.sin(frac * Math.PI * 4 + t * 5) * 0.15 * progress;
      array[i * 3 + 2] =
        Math.cos(frac * Math.PI * 3 + t * 4) * 0.1 * progress;
    }
    pos.needsUpdate = true;
    if (materialRef.current) {
      materialRef.current.opacity = progress * 0.4;
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

function Ground103Floor({ progress }: { progress: number }) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const colorMap = useRepeatingTexture(
    "/textures/pbr/ground103/Ground103_2K-PNG_Color.png",
    {
      repeat: 8,
      colorSpace: THREE.SRGBColorSpace,
    }
  );
  const normalMap = useRepeatingTexture(
    "/textures/pbr/ground103/Ground103_2K-PNG_NormalGL.png",
    { repeat: 8 }
  );
  const roughnessMap = useRepeatingTexture(
    "/textures/pbr/ground103/Ground103_2K-PNG_Roughness.png",
    { repeat: 8 }
  );

  useFrame(() => {
    if (matRef.current) {
      matRef.current.opacity = Math.min(progress / 0.35, 1) * 0.68;
    }
  });

  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, -6, 0]}>
      <circleGeometry args={[28, 64]} />
      <meshStandardMaterial
        ref={matRef}
        map={colorMap}
        normalMap={normalMap}
        roughnessMap={roughnessMap}
        roughness={0.9}
        metalness={0.05}
        transparent
        opacity={0}
        envMapIntensity={0.7}
        depthWrite={false}
      />
    </mesh>
  );
}

useGLTF.preload("/models/quantum_leap/scene.gltf");
useGLTF.preload("/models/paradox_abstract_art_of_python.glb");
