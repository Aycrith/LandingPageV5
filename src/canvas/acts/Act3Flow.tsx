"use client";

import { useRef, useMemo, Suspense } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { HologramMaterial } from "@/canvas/materials/HologramMaterial";

interface ActProps {
  progress: number;
  visible: boolean;
}

function HologramModel({ progress }: { progress: number }) {
  const groupRef = useRef<THREE.Group>(null);

  let gltf: { scene: THREE.Group } | null = null;
  try {
    gltf = useGLTF("/models/hologram.glb");
  } catch {
    // Missing
  }

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.rotation.y = t * 0.2;
    const appear = Math.max(0, (progress - 0.2) / 0.3);
    groupRef.current.scale.setScalar(Math.min(appear, 1) * 0.015);
    groupRef.current.position.y = Math.sin(t * 0.5) * 0.3 + 2;
  });

  if (!gltf) return null;

  return (
    <group ref={groupRef} position={[3, 2, -1]}>
      <primitive object={gltf.scene.clone()} />
    </group>
  );
}

export function Act3Flow({ progress, visible }: ActProps) {
  const groupRef = useRef<THREE.Group>(null);
  const surfaceRef = useRef<THREE.Mesh>(null);
  const surfacePositions = useRef<Float32Array | null>(null);

  // Ribbon data
  const ribbonCount = 10;
  const ribbonData = useMemo(() => {
    return Array.from({ length: ribbonCount }, (_, i) => ({
      radius: 3 + i * 0.5,
      speed: 0.2 + Math.random() * 0.25,
      yOffset: (i - ribbonCount / 2) * 0.6,
      phase: (i / ribbonCount) * Math.PI * 2,
      frequency: 1.5 + Math.random() * 2,
      amplitude: 0.3 + Math.random() * 0.7,
    }));
  }, []);

  // Tube geometries for ribbons
  const ribbonGeometries = useMemo(() => {
    return ribbonData.map((d) => {
      const curve = new THREE.CatmullRomCurve3(
        Array.from({ length: 24 }, (_, i) => {
          const t = (i / 23) * Math.PI * 2;
          return new THREE.Vector3(
            Math.cos(t) * d.radius,
            d.yOffset + Math.sin(t * d.frequency) * d.amplitude,
            Math.sin(t) * d.radius
          );
        }),
        true
      );
      return new THREE.TubeGeometry(curve, 80, 0.02, 4, true);
    });
  }, [ribbonData]);

  const planeGeo = useMemo(() => new THREE.PlaneGeometry(18, 18, 96, 96), []);

  useFrame((state) => {
    if (!visible || !groupRef.current) return;
    const t = state.clock.elapsedTime;

    // Vertex-displaced fluid surface
    if (surfaceRef.current) {
      const geo = surfaceRef.current.geometry;
      const pos = geo.attributes.position;
      if (!surfacePositions.current) {
        surfacePositions.current = new Float32Array(pos.array);
      }
      const orig = surfacePositions.current;

      for (let i = 0; i < pos.count; i++) {
        const x = orig[i * 3];
        const z = orig[i * 3 + 2];
        const wave1 = Math.sin(x * 0.4 + t * 0.6) * Math.cos(z * 0.3 + t * 0.4) * 1.0;
        const wave2 = Math.sin(x * 1.0 + t * 1.0 + z * 0.6) * 0.35;
        const wave3 = Math.cos(x * 0.2 - t * 0.3 + z * 1.2) * 0.25;
        const ripple = Math.sin(Math.sqrt(x * x + z * z) * 0.8 - t * 1.5) * 0.2;
        pos.array[i * 3 + 1] = (wave1 + wave2 + wave3 + ripple) * progress;
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();

      const scaleIn = Math.min(progress / 0.25, 1);
      surfaceRef.current.scale.setScalar(scaleIn);
      const mat = surfaceRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = scaleIn * 0.5;
    }

    const fadeOut = progress > 0.85 ? 1 - (progress - 0.85) / 0.15 : 1;
    groupRef.current.visible = fadeOut > 0.01;
  });

  if (!visible) return null;

  return (
    <group ref={groupRef} rotation={[-0.2, 0, 0]} position={[0, -2, 0]}>
      {/* Fluid surface */}
      <mesh ref={surfaceRef} geometry={planeGeo} rotation={[-Math.PI / 2, 0, 0]}>
        <meshStandardMaterial
          color="#d0a2ff"
          emissive="#d0a2ff"
          emissiveIntensity={0.25}
          metalness={0.8}
          roughness={0.2}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Flow ribbons */}
      {ribbonGeometries.map((geo, i) => (
        <FlowRibbon key={i} geometry={geo} data={ribbonData[i]} progress={progress} />
      ))}

      {/* Hologram floating above */}
      <Suspense fallback={null}>
        <HologramModel progress={progress} />
      </Suspense>

      {/* Hologram pedestal */}
      <mesh position={[3, 0.5, -1]}>
        <cylinderGeometry args={[0.3, 0.5, 1, 16]} />
        <HologramMaterial color="#d0a2ff" />
      </mesh>

      {/* Lighting */}
      <pointLight color="#d0a2ff" intensity={progress * 15} distance={25} decay={2} position={[0, 3, 0]} />
      <pointLight color="#6dc7ff" intensity={progress * 5} distance={15} decay={2} position={[3, 4, -1]} />
    </group>
  );
}

function FlowRibbon({
  geometry,
  data,
  progress,
}: {
  geometry: THREE.TubeGeometry;
  data: { speed: number; phase: number };
  progress: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y = state.clock.elapsedTime * data.speed + data.phase;
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = Math.min(progress / 0.3, 1) * 0.4;
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshBasicMaterial
        color="#d0a2ff"
        transparent
        opacity={0.4}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

try {
  useGLTF.preload("/models/hologram.glb");
} catch {
  // Silent
}
