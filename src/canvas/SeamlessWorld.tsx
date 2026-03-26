"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { type QualityTier } from "@/stores/capsStore";
import { useCursorStore } from "@/stores/cursorStore";
import { useRepeatingTexture } from "@/lib/textures";
import { seededUnit } from "@/lib/random";
import { CuratedHeroLayer } from "./CuratedHeroLayer";
import { VolumetricUI } from "./VolumetricUI";
import { WORLD_PHASES } from "./viewportProfiles";
import { VoidParticleField } from "./particles/VoidParticleField";

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
      Math.cos(rotation - 0.64) * radius * 0.78,
      -1.3,
      Math.sin(rotation - 0.64) * radius * 0.84 - 1
    ),
    new THREE.Vector3(
      Math.cos(rotation - 0.2) * radius,
      -0.42,
      Math.sin(rotation - 0.2) * radius * 0.7 - 0.25
    ),
    new THREE.Vector3(
      Math.cos(rotation + 0.1) * radius * 1.04,
      0.36,
      Math.sin(rotation + 0.1) * radius * 0.6 + 0.35
    ),
    new THREE.Vector3(
      Math.cos(rotation + 0.42) * radius * 0.82,
      1.22,
      Math.sin(rotation + 0.42) * radius * 0.88 + 0.92
    ),
  ]);
}

function createCirculationConduit(offset: number) {
  return new THREE.CatmullRomCurve3([
    new THREE.Vector3(-3.2 + offset * 0.08, -0.86 + offset * 0.18, -4.6),
    new THREE.Vector3(-1.8 + offset * 0.14, -0.28 + offset * 0.12, -2.1),
    new THREE.Vector3(0.1 + offset * 0.08, Math.sin(offset) * 0.12, -0.2),
    new THREE.Vector3(1.9 + offset * 0.12, 0.28 - offset * 0.1, 1.9),
    new THREE.Vector3(3.5 + offset * 0.08, 0.54 - offset * 0.08, 4.6),
  ]);
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
      1 - THREE.MathUtils.smootherstep(phaseBlend, 0.08, 0.86);
    const nextWeight = THREE.MathUtils.smootherstep(phaseBlend, 0.46, 0.98);
    // Ensure the array always has at least 6 slots for Act 6 support
    const len = Math.max(WORLD_PHASES.length, 6);
    const list = Array.from({ length: len }, () => 0);
    list[activeAct] = currentWeight;
    list[nextAct] = nextWeight;
    return list;
  }, [activeAct, nextAct, phaseBlend]);

  const chamberRef = useRef<THREE.Mesh>(null);
  const auraRef = useRef<THREE.Mesh>(null);
  const seedGroupRef = useRef<THREE.Group>(null);
  const scaffoldGroupRef = useRef<THREE.Group>(null);
  const scaffoldNodesRef = useRef<THREE.InstancedMesh>(null);
  const circulationGroupRef = useRef<THREE.Group>(null);
  const sentienceBridgeRef = useRef<THREE.Mesh>(null);
  const apotheosisGroupRef = useRef<THREE.Group>(null);
  const crownRingRef = useRef<THREE.Mesh>(null);
  const crownSecondaryRef = useRef<THREE.Mesh>(null);
  const crownSpinesRef = useRef<THREE.InstancedMesh>(null);
  const fogFarRef = useRef<THREE.Group>(null);
  const fogNearRef = useRef<THREE.Group>(null);
  const fogFarMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const fogNearMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const fogFrontMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const shadowMaterialRef = useRef<THREE.ShadowMaterial>(null);
  const shadowPlaneRef = useRef<THREE.Mesh>(null);
  const sporesRef = useRef<THREE.Points>(null);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const worldAnchor = useMemo(() => new THREE.Vector3(), []);
  const pointerOffset = useMemo(() => new THREE.Vector3(), []);
  const fogColor = useMemo(() => new THREE.Color(), []);
  const fogSecondary = useMemo(() => new THREE.Color(), []);
  const sporeColorLerp = useMemo(() => new THREE.Color(), []);
  const sporeColorNext = useMemo(() => new THREE.Color(), []);
  const baseSporePositionsRef = useRef<Float32Array | null>(null);
  const noiseTexture = useRepeatingTexture(
    "/textures/volumetric/nebula-noise-1k-seamless.png",
    { repeat: 2.6 }
  );
  // Ref for per-frame offset mutation — avoids modifying hook return value directly.
  const noiseTextureRef = useRef(noiseTexture);
  useEffect(() => { noiseTextureRef.current = noiseTexture; }, [noiseTexture]);

  const scaffoldRibs = useMemo(
    () =>
      [0.4, 2.12, 3.52].map((rotation) =>
        new THREE.TubeGeometry(createScaffoldRib(2.55, rotation), 96, 0.032, 12)
      ),
    []
  );
  const circulationConduits = useMemo(
    () =>
      [-2, -1, 0, 1, 2].map((offset) =>
        new THREE.TubeGeometry(
          createCirculationConduit(offset),
          132,
          0.022,
          10
        )
      ),
    []
  );
  const scaffoldNodes = useMemo(
    () =>
      Array.from({ length: 18 }, (_, index) => ({
        angle: (index / 18) * Math.PI * 2,
        y: Math.sin(index * 0.7) * 1.1,
        radius: 2.16 + (index % 3) * 0.16,
        scale: 0.026 + (index % 4) * 0.01,
      })),
    []
  );
  const crownSpines = useMemo(
    () =>
      Array.from({ length: 16 }, (_, index) => ({
        angle: (index / 16) * Math.PI * 2,
        height: 0.5 + (index % 3) * 0.14,
        width: 0.018 + (index % 3) * 0.004,
      })),
    []
  );
  const sporeCount = tier === "high" ? 280 : tier === "medium" ? 160 : 72;
  const sporeBasePositions = useMemo(() => {
    const positions = new Float32Array(sporeCount * 3);
    for (let i = 0; i < sporeCount; i++) {
      const radius = 5.2 + (i % 9) * 0.42 + seededUnit(i * 7) * 1.8;
      const theta = seededUnit(i * 13) * Math.PI * 2;
      const phi = Math.acos(2 * seededUnit(i * 17) - 1);
      positions[i * 3] = Math.cos(theta) * Math.sin(phi) * radius;
      positions[i * 3 + 1] = Math.cos(phi) * radius * 0.52;
      positions[i * 3 + 2] = Math.sin(theta) * Math.sin(phi) * radius * 1.2;
    }
    return positions;
  }, [sporeCount]);
  // Sync base positions to ref outside of useMemo to avoid ref mutation during render.
  useEffect(() => { baseSporePositionsRef.current = sporeBasePositions; }, [sporeBasePositions]);
  const sporeGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(sporeBasePositions.slice(), 3));
    return geometry;
  }, [sporeBasePositions]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const cursor = useCursorStore.getState();
    const metabolism =
      currentProfile.motionRig.metabolism * (1 - phaseBlend) +
      nextProfile.motionRig.metabolism * phaseBlend;
    const pointerStrength =
      currentProfile.motionRig.pointerInfluence * (1 - phaseBlend) +
      nextProfile.motionRig.pointerInfluence * phaseBlend;
    const currentWeight = weights[activeAct];
    const seedWeight = weights[0] + rebirthBlend;
    const scaffoldWeight = weights[1];
    const circulationWeight = weights[2];
    const sentienceWeight = weights[3];
    const apotheosisWeight = weights[4];

    worldAnchor.set(
      THREE.MathUtils.lerp(
        currentProfile.worldAnchor[0],
        nextProfile.worldAnchor[0],
        phaseBlend
      ),
      THREE.MathUtils.lerp(
        currentProfile.worldAnchor[1],
        nextProfile.worldAnchor[1],
        phaseBlend
      ),
      THREE.MathUtils.lerp(
        currentProfile.worldAnchor[2],
        nextProfile.worldAnchor[2],
        phaseBlend
      )
    );
    pointerOffset.set(
      (cursor.x - 0.5) * pointerStrength,
      (0.5 - cursor.y) * pointerStrength * 0.7,
      0
    );

    const cursorCenterDist = Math.sqrt(
      Math.pow(cursor.x - 0.5, 2) + Math.pow(cursor.y - 0.5, 2)
    );
    const cursorProximity = Math.max(0, 1 - cursorCenterDist * 4);

    if (chamberRef.current) {
      chamberRef.current.rotation.y = t * 0.01;
    }

    if (auraRef.current) {
      auraRef.current.position.copy(worldAnchor);
      auraRef.current.scale.setScalar(0.86 + seedWeight * 0.14 + apotheosisWeight * 0.18 + Math.sin(t * 0.88) * 0.012);
      const auraMaterial = auraRef.current.material as THREE.MeshBasicMaterial;
      auraMaterial.opacity = 0.03 + seedWeight * 0.03 + apotheosisWeight * 0.05 + cursorProximity * 0.04;
    }

    fogColor
      .set(currentProfile.fogProfile.color)
      .lerp(new THREE.Color(nextProfile.fogProfile.color), phaseBlend);
    fogSecondary
      .set(currentProfile.fogProfile.secondaryColor)
      .lerp(new THREE.Color(nextProfile.fogProfile.secondaryColor), phaseBlend);

    if (fogFarRef.current) {
      fogFarRef.current.position.copy(worldAnchor);
      fogFarRef.current.quaternion.copy(state.camera.quaternion);
      fogFarRef.current.position.z -= 4.4;
      fogFarRef.current.position.y += 0.2;
      fogFarRef.current.rotation.z = Math.sin(t * 0.06) * 0.1;
    }
    if (fogNearRef.current) {
      fogNearRef.current.position.copy(worldAnchor);
      fogNearRef.current.quaternion.copy(state.camera.quaternion);
      fogNearRef.current.position.z -= 1.1;
      fogNearRef.current.position.x += 0.7;
      fogNearRef.current.position.y -= 0.1;
      fogNearRef.current.rotation.z = -Math.sin(t * 0.08) * 0.14;
    }
    if (fogFarMaterialRef.current) {
      fogFarMaterialRef.current.color.copy(fogSecondary);
      fogFarMaterialRef.current.opacity =
        THREE.MathUtils.lerp(
          currentProfile.fogProfile.layerOpacity,
          nextProfile.fogProfile.layerOpacity,
          phaseBlend
        ) * 0.72;
    }
    if (fogNearMaterialRef.current) {
      fogNearMaterialRef.current.color.copy(fogColor);
      fogNearMaterialRef.current.opacity =
        THREE.MathUtils.lerp(
          currentProfile.fogProfile.layerOpacity,
          nextProfile.fogProfile.layerOpacity,
          phaseBlend
        ) * 0.54;
    }
    if (fogFrontMaterialRef.current) {
      fogFrontMaterialRef.current.color.copy(fogColor);
      fogFrontMaterialRef.current.opacity =
        THREE.MathUtils.lerp(
          currentProfile.fogProfile.foregroundOpacity,
          nextProfile.fogProfile.foregroundOpacity,
          phaseBlend
        ) * 0.6;
    }

    if (seedGroupRef.current) {
      seedGroupRef.current.position.copy(worldAnchor);
      seedGroupRef.current.rotation.y = t * 0.18;
      seedGroupRef.current.visible = seedWeight > 0.02;
      seedGroupRef.current.scale.setScalar(1 + rebirthBlend * 0.24);
      seedGroupRef.current.children.forEach((child) => {
        const mesh = child as THREE.Mesh;
        const material = mesh.material as THREE.MeshBasicMaterial;
        material.opacity = seedWeight * 0.28;
      });
    }

    if (scaffoldGroupRef.current) {
      scaffoldGroupRef.current.position.copy(worldAnchor);
      scaffoldGroupRef.current.visible = scaffoldWeight > 0.02;
      scaffoldGroupRef.current.rotation.y = t * 0.08;
      scaffoldGroupRef.current.scale.setScalar(1 + Math.sin(t * 0.62) * 0.006);
      scaffoldGroupRef.current.children.forEach((child, index) => {
        const mesh = child as THREE.Mesh;
        if (!("material" in mesh)) return;
        const material = mesh.material as THREE.MeshPhysicalMaterial;
        material.opacity = scaffoldWeight * 0.22;
        material.emissiveIntensity = 0.08 + scaffoldWeight * (0.10 + Math.sin(t * 1.4 + index * 1.1) * 0.18) + cursorProximity * 0.12;
      });
    }

    if (scaffoldNodesRef.current) {
      for (let i = 0; i < scaffoldNodes.length; i++) {
        const node = scaffoldNodes[i];
        dummy.position.set(
          Math.cos(node.angle + t * 0.08) * node.radius,
          node.y + Math.sin(t * 0.28 + node.angle) * 0.08,
          Math.sin(node.angle + t * 0.08) * node.radius * 0.68
        );
        dummy.scale.setScalar(node.scale * (0.6 + scaffoldWeight * 0.7));
        dummy.updateMatrix();
        scaffoldNodesRef.current.setMatrixAt(i, dummy.matrix);
      }
      scaffoldNodesRef.current.instanceMatrix.needsUpdate = true;
      const material = scaffoldNodesRef.current.material as THREE.MeshPhysicalMaterial;
      material.opacity = scaffoldWeight * 0.32; // capped to support hero, not compete
      material.emissiveIntensity = 0.08 + scaffoldWeight * (0.22 + Math.sin(t * 1.8) * 0.14);
    }

    if (circulationGroupRef.current) {
      circulationGroupRef.current.position.copy(worldAnchor);
      circulationGroupRef.current.visible = circulationWeight > 0.02;
      circulationGroupRef.current.rotation.z = Math.sin(t * 0.14) * 0.02;
      circulationGroupRef.current.children.forEach((child, index) => {
        const mesh = child as THREE.Mesh;
        const material = mesh.material as THREE.MeshPhysicalMaterial;
        material.opacity = circulationWeight * (0.18 + index * 0.02);
        material.emissiveIntensity = 0.1 + circulationWeight * (0.38 + Math.sin(t * 1.6 + index * 0.7) * 0.18) + index * 0.03;
      });
    }

    if (sentienceBridgeRef.current) {
      sentienceBridgeRef.current.visible = sentienceWeight > 0.02;
      sentienceBridgeRef.current.position.copy(worldAnchor).add(new THREE.Vector3(0, -0.14, -0.12));
      sentienceBridgeRef.current.scale.x = 1.2 + sentienceWeight * 1.2;
      const material =
        sentienceBridgeRef.current.material as THREE.MeshPhysicalMaterial;
      material.opacity = sentienceWeight * 0.34;
      material.emissiveIntensity = 0.14 + sentienceWeight * (0.38 + Math.sin(t * 2.1) * 0.16);
    }

    if (apotheosisGroupRef.current) {
      apotheosisGroupRef.current.position.copy(worldAnchor);
      apotheosisGroupRef.current.visible = apotheosisWeight > 0.02 || rebirthBlend > 0.02;
    }
    if (crownRingRef.current && crownSecondaryRef.current) {
      crownRingRef.current.rotation.z = t * 0.14;
      crownSecondaryRef.current.rotation.x = t * 0.18;
      crownRingRef.current.scale.setScalar(0.8 + apotheosisWeight * 0.82);
      crownSecondaryRef.current.scale.setScalar(0.64 + apotheosisWeight * 0.64);
      const ringMat = crownRingRef.current.material as THREE.MeshBasicMaterial;
      const secondaryMat =
        crownSecondaryRef.current.material as THREE.MeshBasicMaterial;
      ringMat.opacity = apotheosisWeight * 0.22;
      secondaryMat.opacity = apotheosisWeight * 0.14;
    }
    if (crownSpinesRef.current) {
      for (let i = 0; i < crownSpines.length; i++) {
        const spine = crownSpines[i];
        const radius = 1.82 + apotheosisWeight * 0.88;
        dummy.position.set(
          Math.cos(spine.angle + t * 0.05) * radius,
          0.18 + spine.height * 0.42,
          Math.sin(spine.angle + t * 0.05) * radius
        );
        dummy.lookAt(0, 0.12, 0);
        dummy.rotateX(Math.PI / 2);
        dummy.scale.set(
          spine.width,
          0.18 + apotheosisWeight * spine.height,
          spine.width
        );
        dummy.updateMatrix();
        crownSpinesRef.current.setMatrixAt(i, dummy.matrix);
      }
      crownSpinesRef.current.instanceMatrix.needsUpdate = true;
      const material = crownSpinesRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 0.08 + apotheosisWeight * 0.4;
    }

    if (sporesRef.current && baseSporePositionsRef.current) {
      const positions =
        sporesRef.current.geometry.attributes.position.array as Float32Array;
      const base = baseSporePositionsRef.current;
      for (let i = 0; i < sporeCount; i++) {
        const ix = i * 3;
        const flow = Math.sin(t * (0.16 + metabolism * 0.2) + i * 0.23);
        positions[ix] = base[ix] + flow * 0.08 + (cursor.x - 0.5) * 0.22;
        positions[ix + 1] =
          base[ix + 1] + Math.cos(t * 0.2 + i * 0.19) * 0.08;
        positions[ix + 2] =
          base[ix + 2] + Math.sin(t * 0.14 + i * 0.17) * 0.1;
      }
      sporesRef.current.geometry.attributes.position.needsUpdate = true;
      const material = sporesRef.current.material as THREE.PointsMaterial;
      material.opacity =
        currentProfile.ambientParticleMode === "none" && nextProfile.ambientParticleMode === "none"
          ? 0
          : 0.06 + currentWeight * 0.05;
      sporeColorNext.set(nextProfile.accent);
      sporeColorLerp.set(currentProfile.accent).lerp(sporeColorNext, phaseBlend);
      material.color.copy(sporeColorLerp);
    }

    if (shadowPlaneRef.current) {
      shadowPlaneRef.current.position.set(
        worldAnchor.x,
        THREE.MathUtils.lerp(
          currentProfile.shadowProfile.receiverY,
          nextProfile.shadowProfile.receiverY,
          phaseBlend
        ),
        worldAnchor.z
      );
      shadowPlaneRef.current.scale.setScalar(
        THREE.MathUtils.lerp(
          currentProfile.shadowProfile.radius,
          nextProfile.shadowProfile.radius,
          phaseBlend
        )
      );
    }
    if (shadowMaterialRef.current) {
      const shadowEnabled =
        tier === "high" &&
        (currentProfile.shadowProfile.enabled || nextProfile.shadowProfile.enabled);
      shadowMaterialRef.current.opacity = shadowEnabled
        ? THREE.MathUtils.lerp(
            currentProfile.shadowProfile.opacity,
            nextProfile.shadowProfile.opacity,
            phaseBlend
          )
        : 0;
    }

    const noiseTex = noiseTextureRef.current;
    if (noiseTex) {
      noiseTex.offset.x +=
        THREE.MathUtils.lerp(
          currentProfile.fogProfile.drift,
          nextProfile.fogProfile.drift,
          phaseBlend
        ) * 0.0009;
      noiseTex.offset.y += 0.00025;
    }
  });

  return (
    <group scale={0.82} position={[0, -0.14, -0.16]}>
      <mesh ref={chamberRef}>
        <sphereGeometry args={[20, 48, 48]} />
        <meshBasicMaterial color="#010305" side={THREE.BackSide} />
      </mesh>

      <group ref={fogFarRef}>
        <mesh position={[0, 0.4, 0]} scale={[12.4, 12.4, 1]}>
          <planeGeometry args={[1, 1, 1, 1]} />
          <meshBasicMaterial
            ref={fogFarMaterialRef}
            map={noiseTexture}
            alphaMap={noiseTexture}
            color="#081018"
            transparent
            opacity={0.14}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      </group>

      <group ref={fogNearRef}>
        <mesh position={[0, 0, 0]} scale={[8.8, 8.8, 1]}>
          <planeGeometry args={[1, 1, 1, 1]} />
          <meshBasicMaterial
            ref={fogNearMaterialRef}
            map={noiseTexture}
            alphaMap={noiseTexture}
            color="#7cf7f1"
            transparent
            opacity={0.1}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[-2.6, -1.1, 1.4]} scale={[5.6, 5.6, 1]}>
          <planeGeometry args={[1, 1, 1, 1]} />
          <meshBasicMaterial
            ref={fogFrontMaterialRef}
            map={noiseTexture}
            alphaMap={noiseTexture}
            color="#9deee6"
            transparent
            opacity={0.06}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      </group>

      <points ref={sporesRef} geometry={sporeGeometry}>
        <pointsMaterial
          color="#bff8ef"
          size={0.035}
          sizeAttenuation
          transparent
          opacity={0.08}
          depthWrite={false}
        />
      </points>

      <mesh ref={shadowPlaneRef} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[1, 48]} />
        <shadowMaterial
          ref={shadowMaterialRef}
          transparent
          opacity={0}
          color="#000000"
        />
      </mesh>

      <mesh ref={auraRef}>
        <sphereGeometry args={[0.84, 24, 24]} />
        <meshBasicMaterial
          color="#8af4dd"
          transparent
          opacity={0.04}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      <group ref={seedGroupRef}>
        <mesh rotation={[Math.PI / 2, 0.16, 0]}>
          <torusGeometry args={[1.2, 0.032, 16, 96]} />
          <meshBasicMaterial
            color="#b7fff4"
            transparent
            opacity={0.18}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2.2, 0.38, 0.18]}>
          <torusGeometry args={[1.7, 0.022, 14, 96]} />
          <meshBasicMaterial
            color="#8ff4de"
            transparent
            opacity={0.12}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>

      <group ref={scaffoldGroupRef}>
        {scaffoldRibs.map((geometry, index) => (
          <mesh key={index} geometry={geometry}>
            <meshPhysicalMaterial
              color="#90d7ff"
              emissive="#b9ebff"
              emissiveIntensity={0.1}
              transparent
              opacity={0.16}
              transmission={0.92}
              thickness={1.2}
              metalness={0.04}
              roughness={0.06}
              iridescence={0.44}
              iridescenceIOR={1.6}
              depthWrite={false}
            />
          </mesh>
        ))}
        <instancedMesh ref={scaffoldNodesRef} args={[undefined, undefined, scaffoldNodes.length]}>
          <sphereGeometry args={[1, 10, 10]} />
          <meshPhysicalMaterial
            color="#dff6ff"
            emissive="#8dcfff"
            emissiveIntensity={0.2}
            transparent
            opacity={0.32}
            transmission={0.6}
            thickness={0.8}
            metalness={0.32}
            roughness={0.08}
            iridescence={0.28}
            iridescenceIOR={1.4}
          />
        </instancedMesh>
      </group>

      <group ref={circulationGroupRef}>
        {circulationConduits.map((geometry, index) => (
          <mesh key={index} geometry={geometry}>
            <meshPhysicalMaterial
              color="#8ef3eb"
              emissive="#b8fffb"
              emissiveIntensity={0.24}
              transparent
              opacity={0.16}
              transmission={0.3}
              thickness={0.2}
              metalness={0.24}
              roughness={0.2}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      <mesh ref={sentienceBridgeRef} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.08, 1, 18]} />
        <meshPhysicalMaterial
          color="#f3cf98"
          emissive="#ffd3ee"
          emissiveIntensity={0.24}
          transparent
          opacity={0.24}
          transmission={0.54}
          thickness={0.58}
          roughness={0.16}
          depthWrite={false}
        />
      </mesh>

      <group ref={apotheosisGroupRef}>
        <mesh ref={crownRingRef} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.5, 0.04, 18, 96]} />
          <meshBasicMaterial
            color="#ffd5f1"
            transparent
            opacity={0.16}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        <mesh ref={crownSecondaryRef} rotation={[0.72, 0.18, 0]}>
          <torusGeometry args={[1.9, 0.024, 12, 72]} />
          <meshBasicMaterial
            color="#ffb6df"
            transparent
            opacity={0.1}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        <instancedMesh ref={crownSpinesRef} args={[undefined, undefined, crownSpines.length]}>
          <cylinderGeometry args={[1, 1, 1, 12]} />
          <meshStandardMaterial
            color="#16101a"
            emissive="#ffd2f0"
            emissiveIntensity={0.26}
            metalness={0.82}
            roughness={0.16}
          />
        </instancedMesh>
      </group>

      <VoidParticleField />

      <Suspense fallback={null}>
        <CuratedHeroLayer
          activeMetricIndex={
            activeAct === WORLD_PHASES.length - 1 && rebirthBlend > 0.46
              ? 0
              : activeAct
          }
          weights={weights}
          rebirthBlend={rebirthBlend}
          worldAnchor={worldAnchor}
          pointerOffset={pointerOffset}
        />
      </Suspense>

      <VolumetricUI
        activeAct={activeAct}
        nextAct={nextAct}
        blend={phaseBlend}
      />
    </group>
  );
}
