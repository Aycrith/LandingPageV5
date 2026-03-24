"use client";

import { useRef, useMemo, Suspense } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { CrystalMaterial } from "@/canvas/materials/CrystalMaterial";

interface ActProps {
  progress: number;
  visible: boolean;
}

function DarkStarModel({ progress }: { progress: number }) {
  const groupRef = useRef<THREE.Group>(null);

  let gltf: { scene: THREE.Group } | null = null;
  try {
    gltf = useGLTF("/models/dark_star/scene.gltf");
  } catch {
    // Model not loaded yet or missing
  }

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.rotation.y = t * 0.15;
    groupRef.current.rotation.x = Math.sin(t * 0.1) * 0.05;

    const scale = 0.3 + progress * 1.2;
    groupRef.current.scale.setScalar(scale);
  });

  if (!gltf) return null;

  return (
    <group ref={groupRef}>
      <primitive object={gltf.scene.clone()} />
    </group>
  );
}

export function Act1Emergence({ progress, visible }: ActProps) {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const ringsRef = useRef<THREE.Group>(null);

  const ringCount = 7;
  const ringData = useMemo(() => {
    return Array.from({ length: ringCount }, (_, i) => ({
      radius: 1.2 + i * 0.6,
      speed: 0.2 + i * 0.12,
      tilt: (i * Math.PI) / ringCount + Math.random() * 0.3,
      phase: (i * Math.PI * 2) / ringCount,
    }));
  }, []);

  useFrame((state) => {
    if (!visible || !groupRef.current) return;
    const t = state.clock.elapsedTime;

    // Core sphere
    if (coreRef.current) {
      const scale = 0.15 + progress * 1.0;
      const breath = Math.sin(t * 1.5) * 0.03;
      coreRef.current.scale.setScalar(scale * (1 + breath));
    }

    // Rings
    if (ringsRef.current) {
      ringsRef.current.rotation.y = t * 0.08;
      ringsRef.current.rotation.z = Math.sin(t * 0.05) * 0.1;
      ringsRef.current.children.forEach((ring, i) => {
        ring.rotation.z = t * ringData[i].speed + ringData[i].phase;
        const ringProgress = Math.max(0, (progress - i * 0.08) / 0.4);
        const mat = (ring as THREE.Mesh).material as THREE.MeshBasicMaterial;
        if (mat) mat.opacity = Math.min(1, ringProgress) * 0.35;
      });
    }

    // Fade out at end of act
    const fadeOut = progress > 0.85 ? 1 - (progress - 0.85) / 0.15 : 1;
    groupRef.current.visible = fadeOut > 0.01;
  });

  if (!visible) return null;

  return (
    <group ref={groupRef}>
      {/* Crystal core with iridescent material */}
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[1, 4]} />
        <CrystalMaterial color="#7ef2c6" fresnelPower={2.5} iridescenceStrength={0.7} />
      </mesh>

      {/* Inner emissive glow sphere */}
      <mesh scale={0.85}>
        <icosahedronGeometry args={[1, 3]} />
        <meshStandardMaterial
          color="#7ef2c6"
          emissive="#7ef2c6"
          emissiveIntensity={2 + progress * 4}
          metalness={1}
          roughness={0}
          toneMapped={false}
        />
      </mesh>

      {/* Point light from core */}
      <pointLight
        color="#7ef2c6"
        intensity={progress * 25}
        distance={35}
        decay={2}
      />

      {/* God ray volumetric light fake — directional from core */}
      <spotLight
        position={[0, 0, 0]}
        target-position={[0, 5, 5]}
        color="#7ef2c6"
        intensity={progress * 15}
        angle={Math.PI / 3}
        penumbra={1}
        distance={30}
        decay={2}
      />

      {/* Orbiting rings */}
      <group ref={ringsRef}>
        {ringData.map((ring, i) => (
          <mesh key={i} rotation={[ring.tilt, 0, ring.phase]}>
            <torusGeometry args={[ring.radius, 0.012, 8, 80]} />
            <meshBasicMaterial
              color="#7ef2c6"
              transparent
              opacity={0.3}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      {/* Loaded 3D model */}
      <Suspense fallback={null}>
        <DarkStarModel progress={progress} />
      </Suspense>
    </group>
  );
}

// Preload model
try {
  useGLTF.preload("/models/dark_star/scene.gltf");
} catch {
  // Silent fail if model doesn't exist
}
