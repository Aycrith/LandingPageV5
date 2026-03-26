"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { seededUnit, seededSigned } from "@/lib/random";
import { useActMaterialTierConfig } from "./materialTierConfig";

interface ActProps {
  progress: number;
  visible: boolean;
}

// ── Microtubule Lattice ───────────────────────────────────────────────────────

function MicrotubuleLattice({
  progress,
  visible,
}: {
  progress: number;
  visible: boolean;
}) {
  const tierConfig = useActMaterialTierConfig(5);
  const sphereCount = tierConfig.mesh.latticeCount;

  const instancedRef = useRef<THREE.InstancedMesh>(null);
  const latticeMaterialRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Hexagonal tunnel lattice — deterministic positions
  // Z range [-2, 14]: near end at Z=-2 near camera, far end extending away into void
  const latticeData = useMemo(() => {
    const data: Array<{
      x: number;
      y: number;
      z: number;
      phase: number;
    }> = [];
    const ringsNeeded = Math.ceil(sphereCount / 12);

    for (let ring = 0; ring < ringsNeeded && data.length < sphereCount; ring++) {
      const z = (ring / ringsNeeded) * 16 - 2;
      const seed = ring * 31;

      // Outer hex ring (6 spheres)
      for (let k = 0; k < 6 && data.length < sphereCount; k++) {
        const angle = (k / 6) * Math.PI * 2;
        const r = 2.0 + seededUnit(seed + k) * 0.35;
        data.push({
          x: Math.cos(angle) * r,
          y: Math.sin(angle) * r,
          z,
          phase: seededUnit(seed + k + 10),
        });
      }
      // Inner hex ring (6 spheres, offset)
      for (let k = 0; k < 6 && data.length < sphereCount; k++) {
        const angle = (k / 6) * Math.PI * 2 + Math.PI / 6;
        const r = 1.0 + seededUnit(seed + k + 20) * 0.2;
        data.push({
          x: Math.cos(angle) * r,
          y: Math.sin(angle) * r,
          z: z + 0.6,
          phase: seededUnit(seed + k + 30),
        });
      }
    }
    return data;
  }, [sphereCount]);

  useFrame((state) => {
    if (!instancedRef.current || !visible) return;
    const t = state.clock.elapsedTime;
    const appear = Math.min(progress / 0.25, 1);
    const fadeOut = progress > 0.85 ? 1 - (progress - 0.85) / 0.15 : 1;

    for (let i = 0; i < latticeData.length; i++) {
      const d = latticeData[i];
      const pulse = 0.85 + Math.sin(t * 1.8 + d.phase * Math.PI * 2) * 0.15;
      dummy.position.set(d.x, d.y, d.z);
      dummy.scale.setScalar(0.06 * pulse * appear * fadeOut);
      dummy.updateMatrix();
      instancedRef.current.setMatrixAt(i, dummy.matrix);
    }
    instancedRef.current.instanceMatrix.needsUpdate = true;

    if (latticeMaterialRef.current) {
      latticeMaterialRef.current.emissiveIntensity = 0.8 + Math.sin(t * 1.8) * 0.4;
    }
  });

  return (
    <>
      <instancedMesh ref={instancedRef} args={[undefined, undefined, latticeData.length]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshPhysicalMaterial
          ref={latticeMaterialRef}
          color="#001122"
          emissive="#00ccff"
          emissiveIntensity={0.8}
          transmission={0.72}
          roughness={0.06}
          metalness={0.0}
          transparent
          depthWrite={false}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>
      <LatticeSpines latticeData={latticeData} progress={progress} visible={visible} />
    </>
  );
}

// ── Lattice Spines ────────────────────────────────────────────────────────────

function LatticeSpines({
  latticeData,
  progress,
  visible,
}: {
  latticeData: Array<{ x: number; y: number; z: number; phase: number }>;
  progress: number;
  visible: boolean;
}) {
  const matRef = useRef<THREE.LineBasicMaterial>(null);

  // Build spine positions: connect adjacent outer and inner nodes per ring
  // Each ring has 12 nodes (indices 0-5 outer, 6-11 inner)
  const spinePositions = useMemo(() => {
    const ringsNeeded = Math.ceil(latticeData.length / 12);
    const edges: number[] = [];

    for (let ring = 0; ring < ringsNeeded; ring++) {
      const base = ring * 12;
      if (base + 11 >= latticeData.length) break;

      for (let k = 0; k < 6; k++) {
        const outerA = latticeData[base + k];
        const outerB = latticeData[base + ((k + 1) % 6)];
        const innerA = latticeData[base + 6 + k];
        const innerB = latticeData[base + 6 + ((k + 1) % 6)];

        // Outer ring edge
        edges.push(outerA.x, outerA.y, outerA.z, outerB.x, outerB.y, outerB.z);
        // Inner ring edge
        edges.push(innerA.x, innerA.y, innerA.z, innerB.x, innerB.y, innerB.z);
        // Cross edge outer→inner
        edges.push(outerA.x, outerA.y, outerA.z, innerA.x, innerA.y, innerA.z);
      }
    }
    return new Float32Array(edges);
  }, [latticeData]);

  useFrame((state) => {
    if (!matRef.current || !visible) return;
    const t = state.clock.elapsedTime;
    const appear = Math.min(progress / 0.25, 1);
    const fadeOut = progress > 0.85 ? 1 - (progress - 0.85) / 0.15 : 1;
    matRef.current.opacity = (0.08 + Math.sin(t * 1.2) * 0.03) * appear * fadeOut;
  });

  if (spinePositions.length === 0) return null;

  return (
    <lineSegments>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[spinePositions, 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial
        ref={matRef}
        color="#00ccff"
        transparent
        opacity={0}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </lineSegments>
  );
}

// ── Neural Firing Web ─────────────────────────────────────────────────────────

const DENDRITE_COUNT = 50;

function NeuralFiringWeb({ progress }: { progress: number }) {
  const tierConfig = useActMaterialTierConfig(5);
  const activeCount = tierConfig.mesh.dendriteCount;

  const linesRef = useRef<THREE.Group>(null);
  const firePhase = useRef<Float32Array>(new Float32Array(DENDRITE_COUNT).fill(-1));
  // Frame-rate-independent firing: track next fire time as absolute clock time
  const nextFireTime = useRef<Float32Array>(
    new Float32Array(DENDRITE_COUNT).map((_, i) => seededUnit(i * 13) * 3.0)
  );

  // Dendrite paths: CatmullRomCurve3 with 6 seeded control points
  // Constrained to lattice radius ±2.2 in X/Y
  const curves = useMemo(() => {
    return Array.from({ length: DENDRITE_COUNT }, (_, i) => {
      const seed = i * 17;
      const points = Array.from({ length: 6 }, (__, k) => {
        const t = k / 5;
        return new THREE.Vector3(
          seededSigned(seed + k) * 2.2,
          seededSigned(seed + k + 100) * 2.2,
          t * 16 - 2 + seededSigned(seed + k + 200) * 1.5
        );
      });
      return new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.5);
    });
  }, []);

  // positions: read in JSX (useMemo), mutated in useFrame via scratchRef
  const positions = useMemo(
    () => curves.map(() => new Float32Array(32 * 3)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const scratchRef = useRef<Float32Array[]>(positions);

  // Vertex colors for traveling action-potential wave
  const vertexColors = useMemo(
    () => curves.map(() => new Float32Array(32 * 3)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Fire intervals: each dendrite fires every 1.5–4.5s
  const fireIntervals = useMemo(
    () => Array.from({ length: DENDRITE_COUNT }, (_, i) => 1.5 + seededUnit(i * 13) * 3.0),
    []
  );

  useFrame((state) => {
    if (!linesRef.current) return;
    const t = state.clock.elapsedTime;
    const appear = Math.min(progress / 0.3, 1);

    for (let i = 0; i < activeCount; i++) {
      const line = linesRef.current.children[i] as THREE.Line;
      if (!line) continue;

      // Trigger fire events — absolute time tracking, frame-rate independent
      const interval = fireIntervals[i];
      if (firePhase.current[i] < 0 && t >= nextFireTime.current[i]) {
        firePhase.current[i] = t;
        nextFireTime.current[i] = t + interval;
      }
      const phase = firePhase.current[i] >= 0 ? (t - firePhase.current[i]) / 0.8 : -1;
      if (phase > 1) firePhase.current[i] = -1;

      // Update positions along curve
      const curve = curves[i];
      const pts = scratchRef.current[i];
      for (let j = 0; j < 32; j++) {
        const pt = curve.getPointAt(j / 31);
        pts[j * 3] = pt.x;
        pts[j * 3 + 1] = pt.y;
        pts[j * 3 + 2] = pt.z;
      }
      const posAttr = line.geometry.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      arr.set(pts);
      posAttr.needsUpdate = true;

      // Traveling action-potential wave: per-vertex color, bright zone at wavefront
      const mat = line.material as THREE.LineBasicMaterial;
      const colAttr = line.geometry.attributes.color as THREE.BufferAttribute;
      if (colAttr) {
        const colArr = colAttr.array as Float32Array;
        for (let j = 0; j < 32; j++) {
          const tVertex = j / 31;
          const waveProximity = phase >= 0
            ? Math.max(0, 1 - Math.abs(tVertex - phase) / 0.2)
            : 0;
          const wave = waveProximity * waveProximity;
          // Lerp: resting (#001a44) → peak (#00ffee → #ffffff)
          colArr[j * 3]     = wave;              // R: 0 → 1
          colArr[j * 3 + 1] = 0.102 + wave * 0.898; // G: 0.102 → 1.0
          colArr[j * 3 + 2] = 0.267 + wave * 0.666; // B: 0.267 → 0.933
        }
        colAttr.needsUpdate = true;
      }
      mat.opacity = phase >= 0
        ? (0.08 + 0.62 * Math.sin(phase * Math.PI)) * appear
        : 0.08 * appear;
    }
  });

  return (
    <group ref={linesRef}>
      {Array.from({ length: activeCount }, (_, i) => (
        <line key={i}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[positions[i], 3]}
            />
            <bufferAttribute
              attach="attributes-color"
              args={[vertexColors[i], 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial
            transparent
            opacity={0.08}
            vertexColors
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </line>
      ))}
    </group>
  );
}

// ── Tubulin Particles ─────────────────────────────────────────────────────────

function TubulinParticles({ progress, active }: { progress: number; active: boolean }) {
  const tierConfig = useActMaterialTierConfig(5);
  const count = tierConfig.mesh.tubulinCount;

  const instancedRef = useRef<THREE.InstancedMesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particleData = useMemo(() =>
    Array.from({ length: Math.max(count, 1) }, (_, i) => {
      const seed = i * 41;
      return {
        angle: seededUnit(seed) * Math.PI * 2,
        radius: 0.8 + seededUnit(seed + 1) * 1.8,
        z: seededUnit(seed + 2) * 20 - 10,
        speed: 0.4 + seededUnit(seed + 3) * 1.2,
        phase: seededUnit(seed + 4) * Math.PI * 2,
      };
    }), [count]);

  useFrame((state) => {
    if (!instancedRef.current || !active || count === 0) return;
    const t = state.clock.elapsedTime;
    const appear = Math.min(progress / 0.3, 1);

    for (let i = 0; i < count; i++) {
      const d = particleData[i];
      const angle = d.angle + t * d.speed;
      dummy.position.set(
        Math.cos(angle) * d.radius,
        Math.sin(angle) * d.radius * 0.7,
        d.z + Math.sin(t * 0.3 + d.phase) * 1.5
      );
      const pulse = 0.5 + Math.sin(t * 3 + d.phase) * 0.5;
      dummy.scale.setScalar(0.04 * pulse * appear);
      dummy.updateMatrix();
      instancedRef.current.setMatrixAt(i, dummy.matrix);
    }
    instancedRef.current.instanceMatrix.needsUpdate = true;

    if (matRef.current) {
      matRef.current.opacity = 0.6 * appear;
    }
  });

  if (count === 0) return null;

  return (
    <instancedMesh ref={instancedRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial
        ref={matRef}
        color="#ffffff"
        transparent
        opacity={0}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </instancedMesh>
  );
}

// ── Act Entry Point ───────────────────────────────────────────────────────────

export function Act6QuantumConsciousness({ progress, visible }: ActProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.visible = visible && progress > 0.01;
  });

  if (!visible) return null;

  return (
    <group ref={groupRef}>
      <MicrotubuleLattice progress={progress} visible={visible} />
      <NeuralFiringWeb progress={progress} />
      <TubulinParticles progress={progress} active={visible} />

      {/* Deep violet key light */}
      <pointLight
        color="#4400aa"
        intensity={12}
        distance={20}
        decay={2}
        position={[-3, 2, 0]}
      />
      {/* Cyan fill light */}
      <pointLight
        color="#00ccff"
        intensity={8}
        distance={20}
        decay={2}
        position={[4, -2, -4]}
      />
    </group>
  );
}
