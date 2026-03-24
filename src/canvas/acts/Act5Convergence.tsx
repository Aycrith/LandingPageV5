"use client";

import { useRef, useMemo, Suspense } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { ACT_VIEWPORT_PROFILES } from "@/canvas/viewportProfiles";
import { useViewportAuditStore } from "@/stores/viewportAuditStore";
import { seededUnit } from "@/lib/random";
import {
  fitScaleToViewportFill,
  getViewportHeightAtDistance,
  useSceneBounds,
  useStableSceneClone,
} from "@/lib/scene";

interface ActProps {
  progress: number;
  visible: boolean;
}

const ACT_PROFILE = ACT_VIEWPORT_PROFILES[4];

function BlackHoleModel({ progress }: { progress: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const worldPosRef = useRef(new THREE.Vector3());
  const gltf = useGLTF("/models/black_hole/scene.gltf");
  const sceneClone = useStableSceneClone(gltf.scene);
  const bounds = useSceneBounds(gltf.scene);

  const fittedMaxScale = useMemo(
    () =>
      fitScaleToViewportFill({
        desiredScale: ACT_PROFILE.heroModelBehavior.maxScale,
        rawHeight: bounds.height,
        maxFill:
          ACT_PROFILE.maxModelViewportFill *
          ACT_PROFILE.heroModelBehavior.fitPadding,
        previewCamera: ACT_PROFILE.previewCamera,
        settleCamera: ACT_PROFILE.settleCamera,
      }),
    [bounds.height]
  );

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    const desiredScale = Math.min(progress / 0.3, 1) * 0.02;
    const appliedScale = Math.min(desiredScale, fittedMaxScale);
    const camera = state.camera as THREE.PerspectiveCamera;

    groupRef.current.scale.setScalar(appliedScale);
    groupRef.current.getWorldPosition(worldPosRef.current);
    const distance = worldPosRef.current.distanceTo(camera.position);
    const visibleHeight = getViewportHeightAtDistance(distance, camera.fov);

    useViewportAuditStore.getState().reportHeroModel("act5-black-hole", {
      desiredScale,
      appliedScale,
      fillRatio: (bounds.height * appliedScale) / visibleHeight,
      maxFill: ACT_PROFILE.maxModelViewportFill,
    });
  });

  return (
    <group
      ref={groupRef}
      position={[
        ACT_PROFILE.heroModelBehavior.focusOffset[0],
        ACT_PROFILE.heroModelBehavior.focusOffset[1],
        ACT_PROFILE.heroModelBehavior.focusOffset[2],
      ]}
    >
      <primitive object={sceneClone} />
    </group>
  );
}

export function Act5Convergence({ progress, visible }: ActProps) {
  const groupRef = useRef<THREE.Group>(null);
  const vortexRef = useRef<THREE.Mesh>(null);
  const vortexMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const innerCoreRef = useRef<THREE.Mesh>(null);
  const innerCoreMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const trailsRef = useRef<THREE.InstancedMesh>(null);
  const diskRef = useRef<THREE.Mesh>(null);
  const secondaryDiskRef = useRef<THREE.Mesh>(null);

  const trailCount = 150;
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const trailData = useMemo(() => {
    return Array.from({ length: trailCount }, (_, i) => ({
      startRadius: 5 + seededUnit(i * 19 + 1) * 10,
      height: seededUnit(i * 19 + 2) * 10 - 5,
      speed: 0.2 + seededUnit(i * 19 + 3) * 0.7,
      phase: (i / trailCount) * Math.PI * 2,
      scale: 0.015 + seededUnit(i * 19 + 4) * 0.05,
      spiralTightness: 0.3 + seededUnit(i * 19 + 5) * 2.0,
    }));
  }, []);

  useFrame((state) => {
    if (!visible || !groupRef.current) return;
    const t = state.clock.elapsedTime;

    if (vortexRef.current) {
      const pulse = Math.sin(t * 2) * 0.02;
      const scale =
        THREE.MathUtils.lerp(0.22, ACT_PROFILE.fxLayerBehavior.coreScaleLimit, progress) +
        pulse;
      vortexRef.current.scale.setScalar(scale);
      vortexRef.current.rotation.y = t * 0.25;
      vortexRef.current.rotation.z = t * 0.12;
    }

    if (vortexMaterialRef.current) {
      vortexMaterialRef.current.emissiveIntensity = 1.4 + progress * 3.2;
    }

    if (innerCoreRef.current) {
      const pulse = Math.sin(t * 2.5) * 0.015;
      innerCoreRef.current.scale.setScalar(
        THREE.MathUtils.lerp(0.18, 0.28, progress) + pulse
      );
    }

    if (innerCoreMaterialRef.current) {
      const opacity = THREE.MathUtils.lerp(
        0.15,
        ACT_PROFILE.fxLayerBehavior.coreOpacity,
        progress
      );
      innerCoreMaterialRef.current.opacity = opacity;
      useViewportAuditStore.getState().reportFxLayer("act5-inner-core", {
        opacity,
        scale: innerCoreRef.current?.scale.x,
      });
    }

    if (diskRef.current) {
      diskRef.current.rotation.z = t * 0.3;
      const mat = diskRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = progress * 0.32;
    }

    if (secondaryDiskRef.current) {
      secondaryDiskRef.current.rotation.z = -t * 0.18;
      const mat = secondaryDiskRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = progress * 0.18;
    }

    if (trailsRef.current) {
      for (let i = 0; i < trailCount; i++) {
        const data = trailData[i];
        const angle = t * data.speed + data.phase;
        const convergeFactor = 1 - progress * 0.9;
        const radius = data.startRadius * convergeFactor;
        const spiralAngle = angle + progress * data.spiralTightness * Math.PI * 3;

        dummy.position.set(
          Math.cos(spiralAngle) * radius,
          data.height * convergeFactor +
            Math.sin(t * 0.8 + data.phase) * 0.2 * convergeFactor,
          Math.sin(spiralAngle) * radius
        );

        const distScale = Math.max(0.15, radius / data.startRadius);
        dummy.scale.setScalar(data.scale * distScale * (0.5 + progress * 0.5));
        dummy.updateMatrix();
        trailsRef.current.setMatrixAt(i, dummy.matrix);
      }
      trailsRef.current.instanceMatrix.needsUpdate = true;
    }

    groupRef.current.visible = true;
  });

  if (!visible) return null;

  return (
    <group ref={groupRef}>
      <mesh ref={vortexRef}>
        <icosahedronGeometry args={[1, 5]} />
        <meshStandardMaterial
          ref={vortexMaterialRef}
          color="#ff7eb3"
          emissive="#ff7eb3"
          emissiveIntensity={2.2}
          metalness={1}
          roughness={0}
          toneMapped={false}
        />
      </mesh>

      <mesh ref={innerCoreRef}>
        <icosahedronGeometry args={[1, 4]} />
        <meshBasicMaterial
          ref={innerCoreMaterialRef}
          color="#ffffff"
          transparent
          opacity={0.24}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      <mesh ref={diskRef} rotation={[Math.PI / 2.2, 0, 0]}>
        <ringGeometry args={[1.2, 5, 64, 3]} />
        <meshBasicMaterial
          color="#ff7eb3"
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh ref={secondaryDiskRef} rotation={[Math.PI / 1.8, 0.3, 0.5]}>
        <ringGeometry args={[1.5, 4, 64, 2]} />
        <meshBasicMaterial
          color="#d0a2ff"
          transparent
          opacity={progress * 0.2}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      <instancedMesh ref={trailsRef} args={[undefined, undefined, trailCount]}>
        <sphereGeometry args={[1, 4, 4]} />
        <meshBasicMaterial
          color="#ff7eb3"
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </instancedMesh>

      <Suspense fallback={null}>
        <BlackHoleModel progress={progress} />
      </Suspense>

      <pointLight
        color="#ff7eb3"
        intensity={progress * 32}
        distance={50}
        decay={2}
      />
      <pointLight
        color="#ffffff"
        intensity={progress * 8}
        distance={20}
        decay={2}
      />
      <pointLight
        color="#d0a2ff"
        intensity={progress * 8}
        distance={30}
        decay={2}
        position={[0, 3, 0]}
      />
    </group>
  );
}

useGLTF.preload("/models/black_hole/scene.gltf");
