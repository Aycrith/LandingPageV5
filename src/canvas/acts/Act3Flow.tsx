"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { HologramMaterial } from "@/canvas/materials/HologramMaterial";
import { seededUnit } from "@/lib/random";
import { useRepeatingTexture } from "@/lib/textures";
import { GradientBlurBg } from "@/canvas/environment/GradientBlurBg";
import { DottedWave } from "@/canvas/environment/DottedWave";

interface ActProps {
  progress: number;
  visible: boolean;
}
export function Act3Flow({ progress, visible }: ActProps) {
  const groupRef = useRef<THREE.Group>(null);
  const surfaceRef = useRef<THREE.Mesh>(null);
  const surfacePositions = useRef<Float32Array | null>(null);
  const normalFrameRef = useRef(0);

  const ribbonCount = 4;
  const ribbonData = useMemo(() => {
    return Array.from({ length: ribbonCount }, (_, i) => ({
      radius: 1.8 + i * 0.45,
      speed: 0.15 + seededUnit(i * 13 + 1) * 0.18,
      yOffset: (i - ribbonCount / 2) * 0.32,
      phase: (i / ribbonCount) * Math.PI * 2,
      frequency: 1.2 + seededUnit(i * 13 + 2) * 1.1,
      amplitude: 0.18 + seededUnit(i * 13 + 3) * 0.32,
    }));
  }, []);

  const ribbonGeometries = useMemo(() => {
    return ribbonData.map((data) => {
      const curve = new THREE.CatmullRomCurve3(
        Array.from({ length: 20 }, (_, i) => {
          const t = (i / 19) * Math.PI * 2;
          return new THREE.Vector3(
            Math.cos(t) * data.radius,
            data.yOffset + Math.sin(t * data.frequency) * data.amplitude,
            Math.sin(t) * data.radius
          );
        }),
        true
      );
      return new THREE.TubeGeometry(curve, 64, 0.016, 4, true);
    });
  }, [ribbonData]);

  const planeGeo = useMemo(() => new THREE.PlaneGeometry(18, 18, 96, 96), []);

  useEffect(() => {
    return () => {
      planeGeo.dispose();
      ribbonGeometries.forEach((geometry) => geometry.dispose());
    };
  }, [planeGeo, ribbonGeometries]);

  useFrame((state) => {
    if (!visible || !groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.position.set(0.6, -2.6, 0);

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
        const wave1 =
          Math.sin(x * 0.4 + t * 0.6) * Math.cos(z * 0.3 + t * 0.4) * 1.0;
        const wave2 = Math.sin(x * 1.0 + t * 1.0 + z * 0.6) * 0.35;
        const wave3 = Math.cos(x * 0.2 - t * 0.3 + z * 1.2) * 0.25;
        const ripple =
          Math.sin(Math.sqrt(x * x + z * z) * 0.8 - t * 1.5) * 0.2;
        pos.array[i * 3 + 1] = (wave1 + wave2 + wave3 + ripple) * progress;
      }

      pos.needsUpdate = true;
      normalFrameRef.current += 1;
      if (normalFrameRef.current % 3 === 0) {
        geo.computeVertexNormals();
      }

      const scaleIn = Math.min(progress / 0.25, 1);
      surfaceRef.current.scale.setScalar(scaleIn);
      const mat = surfaceRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = scaleIn * 0.34;
    }

    const fadeOut = progress > 0.85 ? 1 - (progress - 0.85) / 0.15 : 1;
    groupRef.current.visible = fadeOut > 0.01;
  });

  if (!visible) return null;

  return (
    <group ref={groupRef} rotation={[-0.14, 0, 0]} position={[0, -2.6, 0]}>
      <GradientBlurBg progress={progress} />
      <DottedWave progress={progress} color="#d0a2ff" yOffset={-1.8} />

      <mesh
        ref={surfaceRef}
        geometry={planeGeo}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[1.8, -0.45, 0]}
      >
        <meshStandardMaterial
          color="#d0a2ff"
          emissive="#d0a2ff"
          emissiveIntensity={0.18}
          metalness={0.8}
          roughness={0.28}
          transparent
          opacity={0.32}
          side={THREE.DoubleSide}
        />
      </mesh>

      {ribbonGeometries.map((geometry, i) => (
        <FlowRibbon
          key={i}
          geometry={geometry}
          data={ribbonData[i]}
          progress={progress}
        />
      ))}
      <Metal049ASurface progress={progress} />

      <mesh position={[2.9, 0.4, -0.9]}>
        <cylinderGeometry args={[0.3, 0.5, 1, 16]} />
        <HologramMaterial color="#d0a2ff" />
      </mesh>

      <pointLight
        color="#d0a2ff"
        intensity={progress * 10}
        distance={20}
        decay={2}
        position={[2.6, 3.2, 0]}
      />
      <pointLight
        color="#6dc7ff"
        intensity={progress * 4}
        distance={12}
        decay={2}
        position={[2.8, 3.8, -1]}
      />
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
    meshRef.current.rotation.y =
      state.clock.elapsedTime * data.speed + data.phase;
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = Math.min(progress / 0.3, 1) * 0.22;
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

function Metal049ASurface({ progress }: { progress: number }) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const colorMap = useRepeatingTexture(
    "/textures/pbr/metal049a/Metal049A_2K-PNG_Color.png",
    {
      repeat: 6,
      colorSpace: THREE.SRGBColorSpace,
    }
  );
  const normalMap = useRepeatingTexture(
    "/textures/pbr/metal049a/Metal049A_2K-PNG_NormalGL.png",
    { repeat: 6 }
  );
  const roughnessMap = useRepeatingTexture(
    "/textures/pbr/metal049a/Metal049A_2K-PNG_Roughness.png",
    { repeat: 6 }
  );
  const metalnessMap = useRepeatingTexture(
    "/textures/pbr/metal049a/Metal049A_2K-PNG_Metalness.png",
    { repeat: 6 }
  );

  useFrame(() => {
    if (matRef.current) {
      matRef.current.opacity = Math.min(progress / 0.4, 1) * 0.65;
    }
  });

  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, -3.5, 0]}>
      <circleGeometry args={[22, 64]} />
      <meshStandardMaterial
        ref={matRef}
        map={colorMap}
        normalMap={normalMap}
        roughnessMap={roughnessMap}
        metalnessMap={metalnessMap}
        roughness={0.3}
        metalness={0.85}
        transparent
        opacity={0}
        envMapIntensity={1.2}
        depthWrite={false}
      />
    </mesh>
  );
}
