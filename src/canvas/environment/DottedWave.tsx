"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getActWeight, isActVisible, useWorldMotionRef } from "@/canvas/worldMotion";

// Dotted Surface port — oscillating point grid
const COLS = 40;
const ROWS = 40;
const SEPARATION = 0.4;
const COUNT = COLS * ROWS;

interface DottedWaveProps {
  actIndex: number;
  color?: string;
  yOffset?: number;
  enabled?: boolean;
}

export function DottedWave({
  actIndex,
  color = "#d0a2ff",
  yOffset = -2.5,
  enabled = true,
}: DottedWaveProps) {
  const motionRef = useWorldMotionRef();
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorObj = useMemo(() => new THREE.Color(color), [color]);

  // Pre-compute grid base positions
  const basePositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    const offsetX = ((COLS - 1) * SEPARATION) / 2;
    const offsetZ = ((ROWS - 1) * SEPARATION) / 2;
    for (let i = 0; i < COLS; i++) {
      for (let j = 0; j < ROWS; j++) {
        positions.push([i * SEPARATION - offsetX, 0, j * SEPARATION - offsetZ]);
      }
    }
    return positions;
  }, []);

  // Set initial colors
  useEffect(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < COUNT; i++) {
      meshRef.current.setColorAt(i, colorObj);
    }
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [colorObj]);

  useFrame((state) => {
    const motion = motionRef.current;
    const progress = getActWeight(motion, actIndex);
    if (!enabled || !meshRef.current || !isActVisible(motion, actIndex)) return;
    const t = state.clock.elapsedTime;
    const amplitude = Math.min(progress / 0.4, 1) * 0.35;

    for (let i = 0; i < COUNT; i++) {
      const [bx, , bz] = basePositions[i];
      const wave = Math.sin(bx * 1.2 + t * 0.8) * Math.cos(bz * 0.9 + t * 0.6);
      dummy.position.set(bx, wave * amplitude, bz);
      const dotScale = (0.05 + Math.abs(wave) * 0.04) * amplitude;
      dummy.scale.setScalar(Math.max(dotScale, 0.01));
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (!enabled) {
    return null;
  }

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, COUNT]}
      position={[0, yOffset, 0]}
      frustumCulled={false}
    >
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.45}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </instancedMesh>
  );
}
