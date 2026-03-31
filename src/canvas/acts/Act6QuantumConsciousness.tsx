"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, extend, type ThreeElement } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import * as THREE from "three";
import { seededUnit, seededSigned } from "@/lib/random";
import { useActMaterialTierConfig } from "./materialTierConfig";
import { getActWeight, useWorldMotionRef } from "@/canvas/worldMotion";

const ACT_INDEX = 5;
const DENDRITE_COUNT = 50;
const DENDRITE_SEGMENTS = 32;
const DENDRITE_DURATION_SECONDS = 0.8;

const NeuralPulseMaterial = shaderMaterial(
  {
    uTime: 0,
    uOpacity: 0,
    uPulseWidth: 0.16,
    uSecondaryPulseMix: 1,
    uBaseColor: new THREE.Color("#001a44"),
    uPulseColor: new THREE.Color("#ffffff"),
  },
  `
  attribute float aLineProgress;
  attribute float aPulseHead;
  attribute float aBranchPhase;

  varying float vLineProgress;
  varying float vPulseHead;
  varying float vBranchPhase;

  void main() {
    vLineProgress = aLineProgress;
    vPulseHead = aPulseHead;
    vBranchPhase = aBranchPhase;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `,
  `
  uniform float uTime;
  uniform float uOpacity;
  uniform float uPulseWidth;
  uniform float uSecondaryPulseMix;
  uniform vec3 uBaseColor;
  uniform vec3 uPulseColor;

  varying float vLineProgress;
  varying float vPulseHead;
  varying float vBranchPhase;

  float pulseStrength(float head, float progress, float width) {
    return 1.0 - smoothstep(0.0, width, abs(progress - head));
  }

  void main() {
    float activePulse = step(0.0, vPulseHead);
    float primaryPulse = pulseStrength(vPulseHead, vLineProgress, uPulseWidth) * activePulse;
    float secondaryHead = fract(vPulseHead - 0.18);
    float secondaryPulse = pulseStrength(
      secondaryHead,
      vLineProgress,
      uPulseWidth * 1.35
    ) * activePulse * uSecondaryPulseMix;
    float pulse = max(primaryPulse, secondaryPulse);
    float shimmer = 0.52 + sin(uTime * 1.4 + vBranchPhase * 6.28318530718 + vLineProgress * 8.0) * 0.12;
    vec3 color = mix(uBaseColor, uPulseColor, pulse);
    float alpha = uOpacity * (0.18 * shimmer + pulse * 0.82);

    gl_FragColor = vec4(color, alpha);
  }
  `
);

extend({ NeuralPulseMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    neuralPulseMaterial: ThreeElement<typeof NeuralPulseMaterial>;
  }
}

// ── Microtubule Lattice ───────────────────────────────────────────────────────

function MicrotubuleLattice() {
  const motionRef = useWorldMotionRef();
  const tierConfig = useActMaterialTierConfig(5);
  const sphereCount = tierConfig.mesh.latticeCount;
  const sphereSegments = Math.max(4, tierConfig.mesh.primaryDetail);

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
    const progress = getActWeight(motionRef.current, ACT_INDEX);
    const visible = progress > 0.01;
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
        <sphereGeometry args={[1, sphereSegments, sphereSegments]} />
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
      <LatticeSpines latticeData={latticeData} />
    </>
  );
}

// ── Lattice Spines ────────────────────────────────────────────────────────────

function LatticeSpines({
  latticeData,
}: {
  latticeData: Array<{ x: number; y: number; z: number; phase: number }>;
}) {
  const motionRef = useWorldMotionRef();
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
    const progress = getActWeight(motionRef.current, ACT_INDEX);
    const visible = progress > 0.01;
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

function NeuralFiringWeb() {
  const motionRef = useWorldMotionRef();
  const tierConfig = useActMaterialTierConfig(5);
  const activeCount = tierConfig.mesh.dendriteCount;

  const lineSegmentsRef = useRef<THREE.LineSegments>(null);
  const materialRef = useRef<
    THREE.ShaderMaterial & {
      uTime: number;
      uOpacity: number;
      uPulseWidth: number;
      uSecondaryPulseMix: number;
    }
  >(null);
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

  const mergedGeometry = useMemo(() => {
    const segmentPairs = DENDRITE_SEGMENTS - 1;
    const verticesPerDendrite = segmentPairs * 2;
    const positions = new Float32Array(activeCount * verticesPerDendrite * 3);
    const lineProgress = new Float32Array(activeCount * verticesPerDendrite);
    const pulseHeads = new Float32Array(activeCount * verticesPerDendrite).fill(-1);
    const branchPhases = new Float32Array(activeCount * verticesPerDendrite);

    for (let i = 0; i < activeCount; i++) {
      const curve = curves[i];
      const phase = seededUnit(i * 29 + 5);
      const points = Array.from({ length: DENDRITE_SEGMENTS }, (_, step) =>
        curve.getPointAt(step / (DENDRITE_SEGMENTS - 1))
      );

      for (let segment = 0; segment < segmentPairs; segment++) {
        const from = points[segment];
        const to = points[segment + 1];
        const vertexIndex = i * verticesPerDendrite + segment * 2;
        const positionOffset = vertexIndex * 3;
        const fromProgress = segment / segmentPairs;
        const toProgress = (segment + 1) / segmentPairs;

        positions[positionOffset] = from.x;
        positions[positionOffset + 1] = from.y;
        positions[positionOffset + 2] = from.z;
        positions[positionOffset + 3] = to.x;
        positions[positionOffset + 4] = to.y;
        positions[positionOffset + 5] = to.z;

        lineProgress[vertexIndex] = fromProgress;
        lineProgress[vertexIndex + 1] = toProgress;
        branchPhases[vertexIndex] = phase;
        branchPhases[vertexIndex + 1] = phase;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aLineProgress", new THREE.BufferAttribute(lineProgress, 1));
    geometry.setAttribute("aPulseHead", new THREE.BufferAttribute(pulseHeads, 1));
    geometry.setAttribute("aBranchPhase", new THREE.BufferAttribute(branchPhases, 1));

    return geometry;
  }, [activeCount, curves]);

  const pulseHeadsRef = useRef<Float32Array>(
    mergedGeometry.getAttribute("aPulseHead").array as Float32Array
  );
  const verticesPerDendrite = useMemo(() => (DENDRITE_SEGMENTS - 1) * 2, []);

  // Fire intervals: each dendrite fires every 1.5–4.5s
  const fireIntervals = useMemo(
    () => Array.from({ length: DENDRITE_COUNT }, (_, i) => 1.5 + seededUnit(i * 13) * 3.0),
    []
  );

  useEffect(() => {
    pulseHeadsRef.current = mergedGeometry.getAttribute("aPulseHead").array as Float32Array;

    return () => {
      mergedGeometry.dispose();
    };
  }, [mergedGeometry]);

  useFrame((state) => {
    const progress = getActWeight(motionRef.current, ACT_INDEX);
    const visible = progress > 0.01;
    if (!lineSegmentsRef.current) return;
    lineSegmentsRef.current.visible = visible;
    if (!visible) return;
    const t = state.clock.elapsedTime;
    const appear = Math.min(progress / 0.3, 1);
    const fadeOut = progress > 0.85 ? 1 - (progress - 0.85) / 0.15 : 1;
    const pulseHeads = pulseHeadsRef.current;

    for (let i = 0; i < activeCount; i++) {

      // Trigger fire events — absolute time tracking, frame-rate independent
      const interval = fireIntervals[i];
      if (firePhase.current[i] < 0 && t >= nextFireTime.current[i]) {
        firePhase.current[i] = t;
        nextFireTime.current[i] = t + interval;
      }
      let pulseHead =
        firePhase.current[i] >= 0
          ? (t - firePhase.current[i]) / DENDRITE_DURATION_SECONDS
          : -1;
      if (pulseHead > 1) {
        firePhase.current[i] = -1;
        pulseHead = -1;
      }

      const start = i * verticesPerDendrite;
      pulseHeads.fill(pulseHead, start, start + verticesPerDendrite);
    }

    const pulseHeadAttribute = mergedGeometry.getAttribute(
      "aPulseHead"
    ) as THREE.BufferAttribute;
    pulseHeadAttribute.needsUpdate = true;

    if (materialRef.current) {
      materialRef.current.uTime = t;
      materialRef.current.uOpacity = appear * fadeOut;
      materialRef.current.uPulseWidth = tierConfig.shader.pulseWidth;
      materialRef.current.uSecondaryPulseMix = tierConfig.shader.secondaryPulseMix;
    }
  });

  if (activeCount === 0) {
    return null;
  }

  return (
    <lineSegments ref={lineSegmentsRef} geometry={mergedGeometry}>
      <neuralPulseMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
        toneMapped={false}
        blending={THREE.AdditiveBlending}
        uTime={0}
        uOpacity={0}
        uPulseWidth={tierConfig.shader.pulseWidth}
        uSecondaryPulseMix={tierConfig.shader.secondaryPulseMix}
        uBaseColor={new THREE.Color("#001a44")}
        uPulseColor={new THREE.Color("#ffffff")}
      />
    </lineSegments>
  );
}

// ── Tubulin Particles ─────────────────────────────────────────────────────────

function TubulinParticles() {
  const motionRef = useWorldMotionRef();
  const tierConfig = useActMaterialTierConfig(5);
  const count = tierConfig.mesh.tubulinCount;
  const sphereSegments = Math.max(4, tierConfig.mesh.secondaryDetail);

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
    const progress = getActWeight(motionRef.current, ACT_INDEX);
    const active = progress > 0.01;
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
      <sphereGeometry args={[1, sphereSegments, sphereSegments]} />
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

export function Act6QuantumConsciousness() {
  const motionRef = useWorldMotionRef();
  const groupRef = useRef<THREE.Group>(null);
  const keyLightRef = useRef<THREE.PointLight>(null);
  const fillLightRef = useRef<THREE.PointLight>(null);

  useFrame(() => {
    const progress = getActWeight(motionRef.current, ACT_INDEX);
    const visible = progress > 0.01;
    if (!groupRef.current) return;
    groupRef.current.visible = visible && progress > 0.01;
    if (keyLightRef.current) {
      keyLightRef.current.intensity = progress * 12;
    }
    if (fillLightRef.current) {
      fillLightRef.current.intensity = progress * 8;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      <MicrotubuleLattice />
      <NeuralFiringWeb />
      <TubulinParticles />

      {/* Deep violet key light */}
      <pointLight
        ref={keyLightRef}
        color="#4400aa"
        intensity={0}
        distance={20}
        decay={2}
        position={[-3, 2, 0]}
      />
      {/* Cyan fill light */}
      <pointLight
        ref={fillLightRef}
        color="#00ccff"
        intensity={0}
        distance={20}
        decay={2}
        position={[4, -2, -4]}
      />
    </group>
  );
}

export function NeuralPulseWarmupMesh() {
  const warmupGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(
        new Float32Array([
          -0.6, 0, -6,
          -0.1, 0.16, -6.2,
          -0.1, 0.16, -6.2,
          0.45, -0.08, -6.5,
        ]),
        3
      )
    );
    geometry.setAttribute(
      "aLineProgress",
      new THREE.BufferAttribute(new Float32Array([0, 0.5, 0.5, 1]), 1)
    );
    geometry.setAttribute(
      "aPulseHead",
      new THREE.BufferAttribute(new Float32Array([0.62, 0.62, 0.62, 0.62]), 1)
    );
    geometry.setAttribute(
      "aBranchPhase",
      new THREE.BufferAttribute(new Float32Array([0.18, 0.18, 0.18, 0.18]), 1)
    );
    return geometry;
  }, []);

  useEffect(() => {
    return () => {
      warmupGeometry.dispose();
    };
  }, [warmupGeometry]);

  return (
    <lineSegments geometry={warmupGeometry}>
      <neuralPulseMaterial
        transparent
        depthWrite={false}
        toneMapped={false}
        blending={THREE.AdditiveBlending}
        uTime={0}
        uOpacity={0.42}
        uPulseWidth={0.16}
        uSecondaryPulseMix={1}
        uBaseColor={new THREE.Color("#001a44")}
        uPulseColor={new THREE.Color("#ffffff")}
      />
    </lineSegments>
  );
}
