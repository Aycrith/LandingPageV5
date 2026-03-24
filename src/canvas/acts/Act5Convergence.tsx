"use client";

import { useRef, useMemo, Suspense } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

interface ActProps {
  progress: number;
  visible: boolean;
}

function BlackHoleModel({ progress }: { progress: number }) {
  const groupRef = useRef<THREE.Group>(null);

  let gltf: { scene: THREE.Group } | null = null;
  try {
    gltf = useGLTF("/models/black_hole/scene.gltf");
  } catch {
    // Missing
  }

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    const s = Math.min(progress / 0.3, 1) * 0.02;
    groupRef.current.scale.setScalar(s);
  });

  if (!gltf) return null;

  return (
    <group ref={groupRef}>
      <primitive object={gltf.scene.clone()} />
    </group>
  );
}

export function Act5Convergence({ progress, visible }: ActProps) {
  const groupRef = useRef<THREE.Group>(null);
  const vortexRef = useRef<THREE.Mesh>(null);
  const trailsRef = useRef<THREE.InstancedMesh>(null);
  const diskRef = useRef<THREE.Mesh>(null);

  const trailCount = 150;
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const trailData = useMemo(() => {
    return Array.from({ length: trailCount }, (_, i) => ({
      startRadius: 5 + Math.random() * 10,
      height: (Math.random() - 0.5) * 10,
      speed: 0.2 + Math.random() * 0.7,
      phase: (i / trailCount) * Math.PI * 2,
      scale: 0.015 + Math.random() * 0.05,
      spiralTightness: 0.3 + Math.random() * 2.0,
      colorMix: Math.random(), // 0 = rose, 1 = white
    }));
  }, []);

  useFrame((state) => {
    if (!visible || !groupRef.current) return;
    const t = state.clock.elapsedTime;

    // Vortex core
    if (vortexRef.current) {
      const scale = 0.2 + progress * 0.6;
      const pulse = Math.sin(t * 2) * 0.03;
      vortexRef.current.scale.setScalar(scale + pulse);
      vortexRef.current.rotation.y = t * 0.25;
      vortexRef.current.rotation.z = t * 0.12;

      const mat = vortexRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 1.5 + progress * 5;
    }

    // Accretion disk rotation and scale
    if (diskRef.current) {
      diskRef.current.rotation.z = t * 0.3;
      const mat = diskRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = progress * 0.35;
    }

    // Spiraling convergence trails
    if (trailsRef.current) {
      for (let i = 0; i < trailCount; i++) {
        const d = trailData[i];
        const angle = t * d.speed + d.phase;
        const convergeFactor = 1 - progress * 0.9;
        const radius = d.startRadius * convergeFactor;
        const spiralAngle = angle + progress * d.spiralTightness * Math.PI * 3;

        dummy.position.set(
          Math.cos(spiralAngle) * radius,
          d.height * convergeFactor + Math.sin(t * 0.8 + d.phase) * 0.2 * convergeFactor,
          Math.sin(spiralAngle) * radius
        );

        const distScale = Math.max(0.15, radius / d.startRadius);
        dummy.scale.setScalar(d.scale * distScale * (0.5 + progress * 0.5));
        dummy.updateMatrix();
        trailsRef.current.setMatrixAt(i, dummy.matrix);
      }
      trailsRef.current.instanceMatrix.needsUpdate = true;
    }

    groupRef.current.visible = true;
  });

  if (!visible) return null;

  return (
    <group ref={groupRef}>
      {/* Vortex core */}
      <mesh ref={vortexRef}>
        <icosahedronGeometry args={[1, 5]} />
        <meshStandardMaterial
          color="#ff7eb3"
          emissive="#ff7eb3"
          emissiveIntensity={3}
          metalness={1}
          roughness={0}
          toneMapped={false}
        />
      </mesh>

      {/* Inner white-hot core */}
      <mesh scale={0.6}>
        <icosahedronGeometry args={[1, 4]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={progress * 8}
          toneMapped={false}
        />
      </mesh>

      {/* Accretion disk */}
      <mesh ref={diskRef} rotation={[Math.PI / 2.2, 0, 0]}>
        <ringGeometry args={[1.2, 5, 64, 3]} />
        <meshBasicMaterial
          color="#ff7eb3"
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Second disk at different angle */}
      <mesh rotation={[Math.PI / 1.8, 0.3, 0.5]}>
        <ringGeometry args={[1.5, 4, 64, 2]} />
        <meshBasicMaterial
          color="#d0a2ff"
          transparent
          opacity={progress * 0.2}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Converging trail particles */}
      <instancedMesh ref={trailsRef} args={[undefined, undefined, trailCount]}>
        <sphereGeometry args={[1, 4, 4]} />
        <meshBasicMaterial
          color="#ff7eb3"
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </instancedMesh>

      {/* Black hole model */}
      <Suspense fallback={null}>
        <BlackHoleModel progress={progress} />
      </Suspense>

      {/* Lighting — dramatic center pull */}
      <pointLight color="#ff7eb3" intensity={progress * 40} distance={50} decay={2} />
      <pointLight color="#ffffff" intensity={progress * 10} distance={20} decay={2} />
      <pointLight color="#d0a2ff" intensity={progress * 8} distance={30} decay={2} position={[0, 3, 0]} />
    </group>
  );
}

try {
  useGLTF.preload("/models/black_hole/scene.gltf");
} catch {
  // Silent
}
