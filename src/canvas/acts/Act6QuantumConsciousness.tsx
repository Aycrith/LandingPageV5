"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MicrotubuleMaterial } from "@/canvas/materials/MicrotubuleMaterial";
import { seededUnit, seededSigned } from "@/lib/random";
import { useCapsStore } from "@/stores/capsStore";

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
  const caps = useCapsStore((s) => s.caps);
  const tier = caps?.tier ?? "low";
  const sphereCount = tier === "high" ? 1200 : tier === "medium" ? 600 : 200;

  const instancedRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Hexagonal tunnel lattice — deterministic positions
  const latticeData = useMemo(() => {
    const data: Array<{
      x: number;
      y: number;
      z: number;
      phase: number;
    }> = [];
    const ringsNeeded = Math.ceil(sphereCount / 12);

    for (let ring = 0; ring < ringsNeeded && data.length < sphereCount; ring++) {
      const z = (ring / ringsNeeded) * 24 - 12;
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
  });

  return (
    <instancedMesh ref={instancedRef} args={[undefined, undefined, latticeData.length]}>
      <sphereGeometry args={[1, 8, 8]} />
      <MicrotubuleMaterial color="#00ccff" glowIntensity={1.2} />
    </instancedMesh>
  );
}

// ── Neural Firing Web ─────────────────────────────────────────────────────────

const DENDRITE_COUNT = 50;

function NeuralFiringWeb({ progress }: { progress: number }) {
  const caps = useCapsStore((s) => s.caps);
  const tier = caps?.tier ?? "low";
  const activeCount = tier === "high" ? 50 : tier === "medium" ? 25 : 10;

  const linesRef = useRef<THREE.Group>(null);
  const firePhase = useRef<Float32Array>(new Float32Array(DENDRITE_COUNT).fill(-1));

  // Dendrite paths: CatmullRomCurve3 with 6 seeded control points
  const curves = useMemo(() => {
    return Array.from({ length: DENDRITE_COUNT }, (_, i) => {
      const seed = i * 17;
      const points = Array.from({ length: 6 }, (__, k) => {
        const t = k / 5;
        return new THREE.Vector3(
          seededSigned(seed + k) * 4.5,
          seededSigned(seed + k + 100) * 4.5,
          t * 20 - 10 + seededSigned(seed + k + 200) * 2
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

      // Trigger fire events
      const interval = fireIntervals[i];
      if (firePhase.current[i] < 0 && (t % interval) < 0.05) {
        firePhase.current[i] = t;
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

      // Color: resting dark red, firing orange → white
      const mat = line.material as THREE.LineBasicMaterial;
      if (phase >= 0 && phase <= 1) {
        const flash = Math.sin(phase * Math.PI);
        mat.color.setRGB(1.0, 0.2 + flash * 0.6, flash * 0.8);
        mat.opacity = (0.15 + flash * 0.75) * appear;
      } else {
        mat.color.setRGB(0.4, 0.05, 0.02);
        mat.opacity = 0.08 * appear;
      }
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
          </bufferGeometry>
          <lineBasicMaterial
            transparent
            opacity={0.08}
            color="#661100"
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
  const caps = useCapsStore((s) => s.caps);
  const tier = caps?.tier ?? "low";
  const count = tier === "high" ? 80 : tier === "medium" ? 40 : 0;

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
