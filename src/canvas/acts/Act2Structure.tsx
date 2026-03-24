"use client";

import { useRef, useMemo, Suspense } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { WireframePulseMaterial } from "@/canvas/materials/WireframePulse";

interface ActProps {
  progress: number;
  visible: boolean;
}

function GlobeModel({ progress }: { progress: number }) {
  const groupRef = useRef<THREE.Group>(null);

  let gltf: { scene: THREE.Group } | null = null;
  try {
    gltf = useGLTF("/models/wireframe_3d_globe.glb");
  } catch {
    // Missing
  }

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.12;
    const scale = Math.min(progress / 0.3, 1) * 0.02;
    groupRef.current.scale.setScalar(scale);
  });

  if (!gltf) return null;

  return (
    <group ref={groupRef}>
      <primitive object={gltf.scene.clone()} />
    </group>
  );
}

function SatellitesModel({ progress }: { progress: number }) {
  const groupRef = useRef<THREE.Group>(null);

  let gltf: { scene: THREE.Group } | null = null;
  try {
    gltf = useGLTF("/models/satellites/scene.gltf");
  } catch {
    // Missing
  }

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = -state.clock.elapsedTime * 0.08;
    const appear = Math.max(0, (progress - 0.3) / 0.4);
    groupRef.current.scale.setScalar(Math.min(appear, 1) * 0.01);
  });

  if (!gltf) return null;

  return (
    <group ref={groupRef} position={[3, 1, -2]}>
      <primitive object={gltf.scene.clone()} />
    </group>
  );
}

export function Act2Structure({ progress, visible }: ActProps) {
  const groupRef = useRef<THREE.Group>(null);
  const globeRef = useRef<THREE.Mesh>(null);
  const instanceRef = useRef<THREE.InstancedMesh>(null);

  const bodyCount = 32;
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const orbits = useMemo(() => {
    return Array.from({ length: bodyCount }, (_, i) => ({
      radius: 3 + Math.random() * 5,
      speed: 0.15 + Math.random() * 0.35,
      tilt: Math.random() * Math.PI,
      phase: (i / bodyCount) * Math.PI * 2,
      scale: 0.08 + Math.random() * 0.2,
      yOffset: (Math.random() - 0.5) * 4,
      geometry: Math.floor(Math.random() * 3), // 0=octa, 1=tetra, 2=icosa
    }));
  }, []);

  useFrame((state) => {
    if (!visible || !groupRef.current) return;
    const t = state.clock.elapsedTime;

    // Procedural wireframe globe
    if (globeRef.current) {
      globeRef.current.rotation.y = t * 0.12;
      globeRef.current.rotation.x = Math.sin(t * 0.08) * 0.1;
      const scaleIn = Math.min(progress / 0.25, 1);
      globeRef.current.scale.setScalar(scaleIn * 2.2);
    }

    // Floating bodies
    if (instanceRef.current) {
      for (let i = 0; i < bodyCount; i++) {
        const o = orbits[i];
        const angle = t * o.speed + o.phase;
        const bodyProgress = Math.max(0, (progress - 0.08 - i * 0.015) / 0.35);
        const appear = Math.min(1, bodyProgress);
        const fadeOut = progress > 0.85 ? 1 - (progress - 0.85) / 0.15 : 1;

        dummy.position.set(
          Math.cos(angle) * o.radius * Math.cos(o.tilt),
          o.yOffset + Math.sin(t * 0.5 + o.phase) * 0.6,
          Math.sin(angle) * o.radius
        );
        dummy.scale.setScalar(o.scale * appear * fadeOut);
        dummy.rotation.set(t * o.speed * 0.5, t * o.speed * 0.3, t * o.speed * 0.7);
        dummy.updateMatrix();
        instanceRef.current.setMatrixAt(i, dummy.matrix);
      }
      instanceRef.current.instanceMatrix.needsUpdate = true;
    }

    const fadeIn = Math.min(progress / 0.15, 1);
    const fadeOut = progress > 0.85 ? 1 - (progress - 0.85) / 0.15 : 1;
    groupRef.current.visible = fadeIn * fadeOut > 0.01;
  });

  if (!visible) return null;

  return (
    <group ref={groupRef}>
      {/* Wireframe globe with pulse material */}
      <mesh ref={globeRef}>
        <icosahedronGeometry args={[2, 4]} />
        <WireframePulseMaterial color="#6dc7ff" pulseSpeed={1.5} />
      </mesh>

      {/* Secondary wireframe layer */}
      <mesh rotation={[0, Math.PI / 4, Math.PI / 6]}>
        <icosahedronGeometry args={[2.3, 2]} />
        <meshBasicMaterial
          color="#6dc7ff"
          wireframe
          transparent
          opacity={0.1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Floating geometric bodies */}
      <instancedMesh ref={instanceRef} args={[undefined, undefined, bodyCount]} castShadow>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color="#6dc7ff"
          emissive="#6dc7ff"
          emissiveIntensity={0.3}
          metalness={0.95}
          roughness={0.05}
        />
      </instancedMesh>

      {/* Loaded models */}
      <Suspense fallback={null}>
        <GlobeModel progress={progress} />
        <SatellitesModel progress={progress} />
      </Suspense>

      {/* Lighting */}
      <pointLight color="#6dc7ff" intensity={10} distance={25} decay={2} />
      <pointLight color="#ffffff" intensity={3} distance={15} decay={2} position={[0, 5, 0]} />
    </group>
  );
}

try {
  useGLTF.preload("/models/wireframe_3d_globe.glb");
  useGLTF.preload("/models/satellites/scene.gltf");
} catch {
  // Silent
}
