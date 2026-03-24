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

function QuantumModel({ progress }: { progress: number }) {
  const groupRef = useRef<THREE.Group>(null);

  let gltf: { scene: THREE.Group } | null = null;
  try {
    gltf = useGLTF("/models/quantum_leap/scene.gltf");
  } catch {
    // Missing
  }

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.rotation.y = t * 0.1;
    const appear = Math.min(progress / 0.3, 1);
    groupRef.current.scale.setScalar(appear * 0.02);
  });

  if (!gltf) return null;

  return (
    <group ref={groupRef}>
      <primitive object={gltf.scene.clone()} />
    </group>
  );
}

function ParadoxModel({ progress }: { progress: number }) {
  const groupRef = useRef<THREE.Group>(null);

  let gltf: { scene: THREE.Group } | null = null;
  try {
    gltf = useGLTF("/models/paradox_abstract_art_of_python.glb");
  } catch {
    // Missing
  }

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.rotation.y = -t * 0.15;
    groupRef.current.rotation.z = Math.sin(t * 0.3) * 0.2;
    const appear = Math.max(0, (progress - 0.15) / 0.3);
    groupRef.current.scale.setScalar(Math.min(appear, 1) * 0.8);
    groupRef.current.position.x = Math.sin(t * 0.2) * 2 - 3;
    groupRef.current.position.y = Math.cos(t * 0.15) * 1.5;
  });

  if (!gltf) return null;

  return (
    <group ref={groupRef} position={[-3, 0, 0]}>
      <primitive object={gltf.scene.clone()} />
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
      radius: 0.8 + Math.random() * 4.5,
      speed: 0.4 + Math.random() * 2.5,
      axis: new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      ).normalize(),
      scale: 0.02 + Math.random() * 0.06,
      attractorBias: Math.random(),
    }));
  }, []);

  // Pre-compute quaternions to avoid GC
  const quatTemp = useMemo(() => new THREE.Quaternion(), []);
  const posTemp = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    if (!visible || !groupRef.current) return;
    const t = state.clock.elapsedTime;

    const separation = Math.sin(progress * Math.PI) * 3.5;

    if (attractor1Ref.current) {
      attractor1Ref.current.position.x = -separation;
      attractor1Ref.current.rotation.y = t * 0.5;
      attractor1Ref.current.rotation.x = t * 0.3;
      const s = 0.5 + Math.sin(t * 3) * 0.08;
      attractor1Ref.current.scale.setScalar(s);
    }

    if (attractor2Ref.current) {
      attractor2Ref.current.position.x = separation;
      attractor2Ref.current.rotation.y = -t * 0.4;
      attractor2Ref.current.rotation.z = t * 0.2;
      const s = 0.5 + Math.cos(t * 3) * 0.08;
      attractor2Ref.current.scale.setScalar(s);
    }

    if (orbitalsRef.current) {
      for (let i = 0; i < orbitalCount; i++) {
        const d = orbitalData[i];
        const angle = t * d.speed + d.angle;

        const oscillation = Math.sin(progress * Math.PI * 4 + d.angle) * 0.5 + 0.5;
        const bias = d.attractorBias * 0.6 + oscillation * 0.4;
        const centerX = THREE.MathUtils.lerp(-separation, separation, bias);

        quatTemp.setFromAxisAngle(d.axis, angle);
        posTemp.set(d.radius, 0, 0).applyQuaternion(quatTemp);
        posTemp.x += centerX;

        const appear = Math.min(progress / 0.15, 1);
        const fadeOut = progress > 0.85 ? 1 - (progress - 0.85) / 0.15 : 1;

        dummy.position.copy(posTemp);
        dummy.scale.setScalar(d.scale * appear * fadeOut);
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
      {/* Attractor 1 — amber crystal */}
      <mesh ref={attractor1Ref}>
        <dodecahedronGeometry args={[0.5, 2]} />
        <CrystalMaterial color="#ffd06f" fresnelPower={2.0} iridescenceStrength={0.8} />
      </mesh>

      {/* Attractor 2 — rose crystal */}
      <mesh ref={attractor2Ref}>
        <dodecahedronGeometry args={[0.5, 2]} />
        <CrystalMaterial color="#ff7eb3" fresnelPower={2.0} iridescenceStrength={0.8} />
      </mesh>

      {/* Inner glow for attractor 1 */}
      <mesh position={[-3, 0, 0]}>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial
          color="#ffd06f"
          emissive="#ffd06f"
          emissiveIntensity={3}
          toneMapped={false}
        />
      </mesh>

      {/* Inner glow for attractor 2 */}
      <mesh position={[3, 0, 0]}>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial
          color="#ff7eb3"
          emissive="#ff7eb3"
          emissiveIntensity={3}
          toneMapped={false}
        />
      </mesh>

      {/* Orbital particles */}
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

      {/* Energy connection line between attractors */}
      <EnergyBeam progress={progress} />

      {/* Models */}
      <Suspense fallback={null}>
        <QuantumModel progress={progress} />
        <ParadoxModel progress={progress} />
      </Suspense>

      {/* Lights */}
      <pointLight color="#ffd06f" intensity={12} distance={20} decay={2} position={[-3, 0, 0]} />
      <pointLight color="#ff7eb3" intensity={12} distance={20} decay={2} position={[3, 0, 0]} />
    </group>
  );
}

/** Animated energy beam between the two attractors */
function EnergyBeam({ progress }: { progress: number }) {
  const lineObj = useMemo(() => {
    const points = Array.from({ length: 50 }, (_, i) => {
      const t = i / 49;
      return new THREE.Vector3(t * 2 - 1, 0, 0);
    });
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: "#ffffff",
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    return new THREE.Line(geo, mat);
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pos = lineObj.geometry.attributes.position;
    const separation = Math.sin(progress * Math.PI) * 3.5;

    for (let i = 0; i < pos.count; i++) {
      const frac = i / (pos.count - 1);
      (pos.array as Float32Array)[i * 3] = THREE.MathUtils.lerp(-separation, separation, frac);
      (pos.array as Float32Array)[i * 3 + 1] = Math.sin(frac * Math.PI * 4 + t * 5) * 0.15 * progress;
      (pos.array as Float32Array)[i * 3 + 2] = Math.cos(frac * Math.PI * 3 + t * 4) * 0.1 * progress;
    }
    pos.needsUpdate = true;
    (lineObj.material as THREE.LineBasicMaterial).opacity = progress * 0.4;
  });

  return <primitive object={lineObj} />;
}

try {
  useGLTF.preload("/models/quantum_leap/scene.gltf");
  useGLTF.preload("/models/paradox_abstract_art_of_python.glb");
} catch {
  // Silent
}
