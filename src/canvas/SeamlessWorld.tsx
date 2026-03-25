"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { type QualityTier } from "@/stores/capsStore";
import { useCursorStore } from "@/stores/cursorStore";
import { useSceneLoadStore } from "@/stores/sceneLoadStore";
import { useViewportAuditStore } from "@/stores/viewportAuditStore";
import { VolumetricUI } from "./VolumetricUI";
import { WORLD_PHASES } from "./viewportProfiles";

interface SeamlessWorldProps {
  activeAct: number;
  phaseBlend: number;
  tier: QualityTier;
}

function wrapNext(index: number) {
  return (index + 1) % WORLD_PHASES.length;
}

function smoothWeight(value: number) {
  return THREE.MathUtils.smoothstep(value, 0, 1);
}

function createScaffoldRib(radius: number, rotation: number) {
  return new THREE.CatmullRomCurve3([
    new THREE.Vector3(
      Math.cos(rotation - 0.8) * radius * 0.72,
      -1.5,
      Math.sin(rotation - 0.8) * radius * 0.92 - 0.8
    ),
    new THREE.Vector3(
      Math.cos(rotation - 0.32) * radius,
      -0.5,
      Math.sin(rotation - 0.32) * radius * 0.75 - 0.2
    ),
    new THREE.Vector3(
      Math.cos(rotation) * radius * 1.06,
      0.5,
      Math.sin(rotation) * radius * 0.62 + 0.35
    ),
    new THREE.Vector3(
      Math.cos(rotation + 0.5) * radius * 0.78,
      1.4,
      Math.sin(rotation + 0.5) * radius * 0.84 + 0.95
    ),
  ]);
}

function createCirculationConduit(offset: number) {
  return new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.8 + offset * 0.08, -0.82 + offset * 0.16, -5.2),
    new THREE.Vector3(-1.7 + offset * 0.12, -0.34 + offset * 0.1, -2.6),
    new THREE.Vector3(0.35 + offset * 0.1, 0.1 * Math.sin(offset), -0.8),
    new THREE.Vector3(1.7 + offset * 0.12, 0.38 - offset * 0.08, 1.9),
    new THREE.Vector3(2.9 + offset * 0.08, 0.7 - offset * 0.1, 4.7),
  ]);
}

function createConvergencePoints(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    radius: 2.8 + (index % 7) * 0.24 + (index / count) * 0.9,
    height: ((index % 11) - 5) * 0.16,
    speed: 0.18 + (index % 5) * 0.03,
    phase: (index / count) * Math.PI * 2,
  }));
}

export function SeamlessWorld({
  activeAct,
  phaseBlend,
  tier,
}: SeamlessWorldProps) {
  const nextAct = wrapNext(activeAct);
  const currentProfile = WORLD_PHASES[activeAct];
  const nextProfile = WORLD_PHASES[nextAct];
  const rebirthThreshold =
    activeAct === WORLD_PHASES.length - 1
      ? currentProfile.transitionRig.rebirth
      : 1;
  const rebirthBlend =
    activeAct === WORLD_PHASES.length - 1
      ? smoothWeight((phaseBlend - rebirthThreshold) / (1 - rebirthThreshold))
      : 0;

  const weights = useMemo(() => {
    const currentWeight =
      1 - THREE.MathUtils.smootherstep(phaseBlend, 0.18, 0.84);
    const nextWeight = THREE.MathUtils.smootherstep(phaseBlend, 0.46, 0.96);
    const list = Array.from({ length: WORLD_PHASES.length }, () => 0);
    list[activeAct] = currentWeight;
    list[nextAct] = nextWeight;
    return list;
  }, [activeAct, nextAct, phaseBlend]);

  const coreRef = useRef<THREE.Mesh>(null);
  const coreAuraRef = useRef<THREE.Mesh>(null);
  const seedGroupRef = useRef<THREE.Group>(null);
  const scaffoldGroupRef = useRef<THREE.Group>(null);
  const circulationGroupRef = useRef<THREE.Group>(null);
  const sentienceGroupRef = useRef<THREE.Group>(null);
  const apotheosisGroupRef = useRef<THREE.Group>(null);
  const sentienceLeftRef = useRef<THREE.Mesh>(null);
  const sentienceRightRef = useRef<THREE.Mesh>(null);
  const sentienceBridgeRef = useRef<THREE.Mesh>(null);
  const crownRingRef = useRef<THREE.Mesh>(null);
  const crownSecondaryRingRef = useRef<THREE.Mesh>(null);
  const chamberRef = useRef<THREE.Mesh>(null);
  const scaffoldNodesRef = useRef<THREE.InstancedMesh>(null);
  const crownSpinesRef = useRef<THREE.InstancedMesh>(null);
  const convergenceRef = useRef<THREE.InstancedMesh>(null);
  const sporesRef = useRef<THREE.Points>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const worldAnchor = useMemo(() => new THREE.Vector3(), []);
  const pointerOffset = useMemo(() => new THREE.Vector3(), []);
  const baseSporePositionsRef = useRef<Float32Array | null>(null);

  const scaffoldRibs = useMemo(
    () =>
      [0.25, 1.82, 3.22, 4.72].map((rotation) =>
        new THREE.TubeGeometry(createScaffoldRib(2.45, rotation), 80, 0.045, 12)
      ),
    []
  );
  const circulationConduits = useMemo(
    () =>
      [-2, -1, 0, 1, 2].map((offset) =>
        new THREE.TubeGeometry(createCirculationConduit(offset), 120, 0.03, 10)
      ),
    []
  );
  const scaffoldNodes = useMemo(() => {
    return Array.from({ length: 26 }, (_, index) => ({
      angle: (index / 26) * Math.PI * 2,
      y: Math.sin(index * 0.8) * 1.3,
      radius: 2.12 + (index % 3) * 0.18,
      scale: 0.04 + (index % 5) * 0.01,
    }));
  }, []);
  const crownSpines = useMemo(() => {
    return Array.from({ length: 18 }, (_, index) => ({
      angle: (index / 18) * Math.PI * 2,
      height: 0.55 + (index % 4) * 0.1,
      width: 0.03 + (index % 3) * 0.008,
    }));
  }, []);
  const convergencePoints = useMemo(() => createConvergencePoints(44), []);
  const sporeCount = tier === "high" ? 180 : tier === "medium" ? 96 : 48;
  const sporeGeometry = useMemo(() => {
    const positions = new Float32Array(sporeCount * 3);
    for (let i = 0; i < sporeCount; i++) {
      const radius = 4.5 + (i % 9) * 0.34 + Math.random() * 1.4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = Math.cos(theta) * Math.sin(phi) * radius;
      positions[i * 3 + 1] = Math.cos(phi) * radius * 0.55;
      positions[i * 3 + 2] = Math.sin(theta) * Math.sin(phi) * radius * 1.15;
    }
    baseSporePositionsRef.current = positions.slice();
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, [sporeCount]);

  useEffect(() => {
    useSceneLoadStore.getState().markCriticalAssetReady("seed-core");

    return () => {
      const audit = useViewportAuditStore.getState();
      WORLD_PHASES.forEach((phase) => audit.clearHeroModel(phase.heroLabel));
      audit.clearFxLayer("apotheosis-core");
    };
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const cursor = useCursorStore.getState();
    const audit = useViewportAuditStore.getState();
    const activeProfile =
      rebirthBlend > 0.46 ? nextProfile : currentProfile;
    const nextWeight = weights[nextAct];
    const activeWeight = rebirthBlend > 0.46 ? rebirthBlend : weights[activeAct];
    const metabolism =
      currentProfile.motionRig.metabolism * (1 - phaseBlend) +
      nextProfile.motionRig.metabolism * phaseBlend;
    const pulse =
      currentProfile.motionRig.pulse * (1 - phaseBlend) +
      nextProfile.motionRig.pulse * phaseBlend;
    const pointerStrength =
      currentProfile.motionRig.pointerInfluence * (1 - phaseBlend) +
      nextProfile.motionRig.pointerInfluence * phaseBlend;
    const baseAnchor = currentProfile.worldAnchor;
    const nextAnchor = nextProfile.worldAnchor;

    worldAnchor.set(
      THREE.MathUtils.lerp(baseAnchor[0], nextAnchor[0], phaseBlend),
      THREE.MathUtils.lerp(baseAnchor[1], nextAnchor[1], phaseBlend),
      THREE.MathUtils.lerp(baseAnchor[2], nextAnchor[2], phaseBlend)
    );
    pointerOffset.set(
      (cursor.x - 0.5) * pointerStrength,
      (0.5 - cursor.y) * pointerStrength * 0.7,
      0
    );

    if (chamberRef.current) {
      chamberRef.current.rotation.y = t * 0.018;
    }

    if (coreRef.current) {
      const breathe = 1 + Math.sin(t * (1.25 + pulse)) * 0.03;
      const transitionScale = THREE.MathUtils.lerp(
        currentProfile.heroRig.coreScale,
        nextProfile.heroRig.coreScale,
        phaseBlend
      );
      coreRef.current.position.copy(worldAnchor).add(pointerOffset);
      coreRef.current.scale.setScalar(transitionScale * breathe);
      coreRef.current.rotation.y = t * 0.25;
      coreRef.current.rotation.x = Math.sin(t * 0.18) * 0.08;
    }

    if (coreAuraRef.current) {
      const auraScale =
        THREE.MathUtils.lerp(1.45, 1.92, weights[4]) +
        Math.sin(t * 0.7) * 0.04;
      coreAuraRef.current.position.copy(worldAnchor);
      coreAuraRef.current.scale.setScalar(auraScale);
      const material = coreAuraRef.current.material as THREE.MeshBasicMaterial;
      material.opacity =
        0.06 + weights[0] * 0.06 + weights[4] * 0.08 + rebirthBlend * 0.05;
    }

    if (seedGroupRef.current) {
      seedGroupRef.current.position.copy(worldAnchor);
      seedGroupRef.current.rotation.y = t * 0.18;
      seedGroupRef.current.visible = weights[0] > 0.01 || rebirthBlend > 0.01;
      seedGroupRef.current.scale.setScalar(1 + rebirthBlend * 0.2);
      seedGroupRef.current.children.forEach((child) => {
        const mesh = child as THREE.Mesh;
        if ("material" in mesh && mesh.material) {
          const material = mesh.material as THREE.Material & { opacity?: number };
          if (typeof material.opacity === "number") {
            material.opacity = (weights[0] + rebirthBlend) * 0.42;
          }
        }
      });
    }

    if (scaffoldGroupRef.current) {
      scaffoldGroupRef.current.position.copy(worldAnchor);
      scaffoldGroupRef.current.rotation.y = t * 0.1 + phaseBlend * 0.08;
      scaffoldGroupRef.current.visible = weights[1] > 0.01;
      scaffoldGroupRef.current.scale.setScalar(0.95 + weights[1] * 0.08);
    }

    if (scaffoldNodesRef.current) {
      for (let i = 0; i < scaffoldNodes.length; i++) {
        const node = scaffoldNodes[i];
        dummy.position.set(
          Math.cos(node.angle + t * 0.12) * node.radius,
          node.y + Math.sin(t * 0.35 + node.angle) * 0.08,
          Math.sin(node.angle + t * 0.1) * node.radius * 0.7
        );
        dummy.scale.setScalar(node.scale * (0.6 + weights[1] * 0.8));
        dummy.updateMatrix();
        scaffoldNodesRef.current.setMatrixAt(i, dummy.matrix);
      }
      scaffoldNodesRef.current.instanceMatrix.needsUpdate = true;
      const material = scaffoldNodesRef.current.material as THREE.MeshStandardMaterial;
      material.opacity = weights[1] * 0.92;
    }

    if (circulationGroupRef.current) {
      circulationGroupRef.current.position.copy(worldAnchor);
      circulationGroupRef.current.visible = weights[2] > 0.01;
      circulationGroupRef.current.rotation.z = Math.sin(t * 0.14) * 0.02;
      circulationGroupRef.current.children.forEach((child, index) => {
        const mesh = child as THREE.Mesh;
        if ("material" in mesh && mesh.material) {
          const material = mesh.material as THREE.MeshStandardMaterial;
          material.emissiveIntensity = 0.35 + weights[2] * 1.2 + index * 0.04;
        }
      });
    }

    if (sentienceGroupRef.current) {
      sentienceGroupRef.current.position.copy(worldAnchor);
      sentienceGroupRef.current.visible = weights[3] > 0.01;
    }
    if (sentienceLeftRef.current && sentienceRightRef.current && sentienceBridgeRef.current) {
      const split =
        (currentProfile.heroRig.splitDistance * (1 - phaseBlend) +
          nextProfile.heroRig.splitDistance * phaseBlend) *
        (0.2 + weights[3] * 0.8);
      sentienceLeftRef.current.position.set(-split * 0.5, 0.28, 0);
      sentienceRightRef.current.position.set(split * 0.5, -0.22, 0.22);
      sentienceBridgeRef.current.position.set(0, 0.02, 0.12);
      sentienceBridgeRef.current.scale.set(split, 1, 1);
      const leftMaterial = sentienceLeftRef.current.material as THREE.MeshStandardMaterial;
      const rightMaterial = sentienceRightRef.current.material as THREE.MeshStandardMaterial;
      const bridgeMaterial = sentienceBridgeRef.current.material as THREE.MeshPhysicalMaterial;
      leftMaterial.emissiveIntensity = 0.35 + weights[3] * 1.1;
      rightMaterial.emissiveIntensity = 0.28 + weights[3] * 0.9;
      bridgeMaterial.opacity = weights[3] * 0.8;
    }

    if (apotheosisGroupRef.current) {
      apotheosisGroupRef.current.position.copy(worldAnchor);
      apotheosisGroupRef.current.visible = weights[4] > 0.01 || rebirthBlend > 0.01;
    }
    if (crownRingRef.current && crownSecondaryRingRef.current) {
      const crownRadius =
        currentProfile.heroRig.crownRadius * (1 - phaseBlend) +
        nextProfile.heroRig.crownRadius * phaseBlend;
      crownRingRef.current.rotation.z = t * 0.18;
      crownRingRef.current.scale.setScalar(
        0.35 + weights[4] * crownRadius * 0.52
      );
      crownSecondaryRingRef.current.rotation.x = t * 0.22;
      crownSecondaryRingRef.current.scale.setScalar(
        0.28 + weights[4] * crownRadius * 0.44
      );
      const crownMat = crownRingRef.current.material as THREE.MeshBasicMaterial;
      const crownSecondaryMat =
        crownSecondaryRingRef.current.material as THREE.MeshBasicMaterial;
      crownMat.opacity = weights[4] * 0.62;
      crownSecondaryMat.opacity = weights[4] * 0.38;
      audit.reportFxLayer("apotheosis-core", {
        opacity: weights[4] * 0.58,
        scale: crownRingRef.current.scale.x,
      });
    }

    if (crownSpinesRef.current) {
      for (let i = 0; i < crownSpines.length; i++) {
        const spine = crownSpines[i];
        const radius = 1.8 + weights[4] * 1.25;
        dummy.position.set(
          Math.cos(spine.angle + t * 0.05) * radius,
          0.2 + spine.height * 0.45,
          Math.sin(spine.angle + t * 0.05) * radius
        );
        dummy.lookAt(0, 0.2, 0);
        dummy.rotateX(Math.PI / 2);
        dummy.scale.set(
          spine.width,
          0.24 + weights[4] * spine.height,
          spine.width
        );
        dummy.updateMatrix();
        crownSpinesRef.current.setMatrixAt(i, dummy.matrix);
      }
      crownSpinesRef.current.instanceMatrix.needsUpdate = true;
    }

    if (convergenceRef.current) {
      for (let i = 0; i < convergencePoints.length; i++) {
        const point = convergencePoints[i];
        const collapse = 1 - weights[4] * 0.84;
        const radius = point.radius * collapse;
        const angle = point.phase + t * point.speed;
        dummy.position.set(
          Math.cos(angle) * radius,
          point.height * collapse,
          Math.sin(angle) * radius * 0.8
        );
        dummy.scale.setScalar(0.03 + weights[4] * 0.05);
        dummy.updateMatrix();
        convergenceRef.current.setMatrixAt(i, dummy.matrix);
      }
      convergenceRef.current.instanceMatrix.needsUpdate = true;
      const material = convergenceRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = weights[4] * 0.8;
    }

    if (sporesRef.current && baseSporePositionsRef.current) {
      const positions = sporesRef.current.geometry.attributes.position.array as Float32Array;
      const base = baseSporePositionsRef.current;
      for (let i = 0; i < sporeCount; i++) {
        const ix = i * 3;
        const flow = Math.sin(t * (0.22 + metabolism * 0.2) + i * 0.31);
        positions[ix] = base[ix] + flow * 0.08 + (cursor.x - 0.5) * 0.22;
        positions[ix + 1] = base[ix + 1] + Math.cos(t * 0.28 + i * 0.21) * 0.08;
        positions[ix + 2] = base[ix + 2] + Math.sin(t * 0.18 + i * 0.37) * 0.12;
      }
      sporesRef.current.geometry.attributes.position.needsUpdate = true;
      const material = sporesRef.current.material as THREE.PointsMaterial;
      material.opacity =
        currentProfile.ambientParticleMode === "none" ? 0 : 0.2 + nextWeight * 0.08;
    }

    const metricScale =
      activeProfile.id === 0
        ? 0.36 + rebirthBlend * 0.04
        : activeProfile.id === 1
          ? 0.34 + activeWeight * 0.05
          : activeProfile.id === 2
            ? 0.35 + activeWeight * 0.05
            : activeProfile.id === 3
              ? 0.38 + activeWeight * 0.04
              : 0.33 + activeWeight * 0.03;
    const camera = state.camera as THREE.PerspectiveCamera;
    const distance = camera.position.distanceTo(worldAnchor);
    const visibleHeight =
      2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * distance;
    const desiredScale = metricScale + activeWeight * 0.03;
    const appliedScale = desiredScale;
    audit.reportHeroModel(activeProfile.heroLabel, {
      desiredScale,
      appliedScale,
      fillRatio:
        (activeProfile.heroRig.rawHeight * appliedScale) / Math.max(visibleHeight, 0.1),
      maxFill: activeProfile.maxModelViewportFill,
    });
  });

  return (
    <group scale={0.76} position={[0, -0.18, -0.1]}>
      <mesh ref={chamberRef} scale={[1, 1, 1]}>
        <sphereGeometry args={[18, 48, 48]} />
        <meshBasicMaterial color="#020405" side={THREE.BackSide} />
      </mesh>

      <points ref={sporesRef} geometry={sporeGeometry}>
        <pointsMaterial
          color="#b9f9ef"
          size={0.045}
          sizeAttenuation
          transparent
          opacity={0.12}
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </points>

      <mesh ref={coreAuraRef}>
        <sphereGeometry args={[0.82, 20, 20]} />
        <meshBasicMaterial
          color="#84f5e2"
          transparent
          opacity={0.06}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      <mesh ref={coreRef}>
        <icosahedronGeometry args={[0.58, 5]} />
        <meshPhysicalMaterial
          color="#040506"
          emissive="#dcfbff"
          emissiveIntensity={0.18}
          clearcoat={1}
          clearcoatRoughness={0.12}
          metalness={0.42}
          roughness={0.08}
        />
      </mesh>

      <group ref={seedGroupRef}>
        <mesh rotation={[Math.PI / 2, 0.12, 0]}>
          <torusGeometry args={[0.72, 0.026, 18, 96]} />
          <meshBasicMaterial
            color="#9ef7de"
            transparent
            opacity={0.42}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2.16, 0.42, 0.2]}>
          <torusGeometry args={[1.08, 0.02, 18, 96]} />
          <meshBasicMaterial
            color="#d5fff7"
            transparent
            opacity={0.26}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>

      <group ref={scaffoldGroupRef}>
        {scaffoldRibs.map((geometry, index) => (
          <mesh key={index} geometry={geometry}>
            <meshPhysicalMaterial
              color="#7ebfff"
              emissive="#9fdcff"
              emissiveIntensity={0.18}
              transparent
              opacity={0.48}
              transmission={0.82}
              thickness={0.65}
              metalness={0.06}
              roughness={0.12}
              depthWrite={false}
            />
          </mesh>
        ))}
        <instancedMesh ref={scaffoldNodesRef} args={[undefined, undefined, scaffoldNodes.length]}>
          <sphereGeometry args={[1, 12, 12]} />
          <meshStandardMaterial
            color="#dff5ff"
            emissive="#8cc9ff"
            emissiveIntensity={0.56}
            transparent
            opacity={0.9}
            metalness={0.84}
            roughness={0.18}
          />
        </instancedMesh>
      </group>

      <group ref={circulationGroupRef}>
        {circulationConduits.map((geometry, index) => (
          <mesh
            key={index}
            geometry={geometry}
            rotation={[0, 0, (index - 2) * 0.06]}
          >
            <meshStandardMaterial
              color="#79efe0"
              emissive="#9afbf1"
              emissiveIntensity={0.52}
              metalness={0.82}
              roughness={0.22}
            />
          </mesh>
        ))}
      </group>

      <group ref={sentienceGroupRef}>
        <mesh ref={sentienceLeftRef}>
          <sphereGeometry args={[0.44, 28, 28]} />
          <meshStandardMaterial
            color="#15131b"
            emissive="#c8a8ff"
            emissiveIntensity={1}
            metalness={0.8}
            roughness={0.16}
          />
        </mesh>
        <mesh ref={sentienceRightRef}>
          <sphereGeometry args={[0.36, 28, 28]} />
          <meshStandardMaterial
            color="#120f17"
            emissive="#f6c86a"
            emissiveIntensity={0.82}
            metalness={0.76}
            roughness={0.2}
          />
        </mesh>
        <mesh ref={sentienceBridgeRef} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.05, 0.07, 1, 20]} />
          <meshPhysicalMaterial
            color="#f0c97f"
            emissive="#f6c86a"
            emissiveIntensity={0.26}
            transparent
            opacity={0.6}
            transmission={0.5}
            thickness={0.7}
            roughness={0.16}
          />
        </mesh>
      </group>

      <group ref={apotheosisGroupRef}>
        <mesh ref={crownRingRef} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.5, 0.04, 18, 96]} />
          <meshBasicMaterial
            color="#ffd2f0"
            transparent
            opacity={0.58}
            toneMapped={false}
          />
        </mesh>
        <mesh ref={crownSecondaryRingRef} rotation={[0.76, 0.16, 0]}>
          <torusGeometry args={[1.14, 0.025, 12, 72]} />
          <meshBasicMaterial
            color="#f7a4d6"
            transparent
            opacity={0.4}
            toneMapped={false}
          />
        </mesh>
        <instancedMesh ref={crownSpinesRef} args={[undefined, undefined, crownSpines.length]}>
          <cylinderGeometry args={[1, 1, 1, 12]} />
          <meshStandardMaterial
            color="#171017"
            emissive="#ffd2f0"
            emissiveIntensity={0.46}
            metalness={0.86}
            roughness={0.14}
          />
        </instancedMesh>
        <instancedMesh ref={convergenceRef} args={[undefined, undefined, convergencePoints.length]}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial
            color="#ffe8f7"
            transparent
            opacity={0.72}
            depthWrite={false}
            toneMapped={false}
          />
        </instancedMesh>
      </group>

      <VolumetricUI
        activeAct={activeAct}
        nextAct={nextAct}
        blend={phaseBlend}
      />
    </group>
  );
}
