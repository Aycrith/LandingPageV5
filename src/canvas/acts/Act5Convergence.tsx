"use client";

import { useRef, useMemo, Suspense, useEffect } from "react";
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
import { WarpDriveBackground } from "@/canvas/environment/WarpDriveBackground";
import { ShaderLinesField } from "@/canvas/environment/ShaderLinesField";

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
    const desiredScale =
      THREE.MathUtils.lerp(
        ACT_PROFILE.heroModelBehavior.baseScale,
        ACT_PROFILE.heroModelBehavior.maxScale,
        Math.min(progress / 0.3, 1)
      );
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
  const singularityRef = useRef<THREE.Mesh>(null);
  const innerCoreRef = useRef<THREE.Mesh>(null);
  const innerCoreMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const trailsRef = useRef<THREE.InstancedMesh>(null);
  const diskRef = useRef<THREE.Mesh>(null);
  const secondaryDiskRef = useRef<THREE.Mesh>(null);

  const trailCount = 96;
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const trailData = useMemo(() => {
    return Array.from({ length: trailCount }, (_, i) => ({
      startRadius: 4 + seededUnit(i * 19 + 1) * 7,
      height: seededUnit(i * 19 + 2) * 7 - 3.5,
      speed: 0.18 + seededUnit(i * 19 + 3) * 0.46,
      phase: (i / trailCount) * Math.PI * 2,
      scale: 0.012 + seededUnit(i * 19 + 4) * 0.03,
      spiralTightness: 0.4 + seededUnit(i * 19 + 5) * 1.2,
    }));
  }, []);

  useEffect(() => {
    return () => {
      useViewportAuditStore.getState().clearHeroModel("act5-black-hole");
      useViewportAuditStore.getState().clearFxLayer("act5-inner-core");
    };
  }, []);

  useFrame((state) => {
    if (!visible || !groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.position.set(0, 0.8, -0.55);

    if (vortexRef.current) {
      const pulse = Math.sin(t * 2) * 0.02;
      const scale =
        THREE.MathUtils.lerp(0.42, ACT_PROFILE.fxLayerBehavior.coreScaleLimit, progress) +
        pulse;
      vortexRef.current.scale.setScalar(scale);
      vortexRef.current.rotation.y = t * 0.25;
      vortexRef.current.rotation.z = t * 0.12;
    }

    if (vortexMaterialRef.current) {
      vortexMaterialRef.current.emissiveIntensity = 0.9 + progress * 2.1;
    }

    if (singularityRef.current) {
      singularityRef.current.scale.setScalar(THREE.MathUtils.lerp(0.22, 0.34, progress));
    }

    if (innerCoreRef.current) {
      const pulse = Math.sin(t * 2.5) * 0.015;
      innerCoreRef.current.scale.setScalar(
        THREE.MathUtils.lerp(0.3, 0.46, progress) + pulse
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
      mat.opacity = progress * 0.3;
    }

    if (secondaryDiskRef.current) {
      secondaryDiskRef.current.rotation.z = -t * 0.18;
      const mat = secondaryDiskRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = progress * 0.12;
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

        const distScale = Math.max(0.2, radius / data.startRadius);
        dummy.scale.setScalar(data.scale * distScale * (0.35 + progress * 0.4));
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
      <WarpDriveBackground progress={progress} />
      <ShaderLinesField progress={progress} />

      <mesh ref={vortexRef}>
        <icosahedronGeometry args={[1, 5]} />
        <meshStandardMaterial
          ref={vortexMaterialRef}
          color="#120712"
          emissive="#ff7eb3"
          emissiveIntensity={1.6}
          metalness={0.95}
          roughness={0.06}
          toneMapped={false}
        />
      </mesh>

      <mesh ref={singularityRef}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshBasicMaterial color="#020203" toneMapped={false} />
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

      <mesh ref={diskRef} rotation={[Math.PI / 2.18, 0.08, 0.04]}>
        <ringGeometry args={[1.7, 5.9, 96, 3]} />
        <meshBasicMaterial
          color="#ff7eb3"
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh ref={secondaryDiskRef} rotation={[Math.PI / 1.74, 0.3, 0.52]}>
        <ringGeometry args={[1.4, 4.6, 96, 2]} />
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
          opacity={0.62}
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
        intensity={progress * 24}
        distance={36}
        decay={2}
      />
      <pointLight
        color="#ffffff"
        intensity={progress * 5}
        distance={14}
        decay={2}
      />
      <pointLight
        color="#d0a2ff"
        intensity={progress * 6}
        distance={24}
        decay={2}
        position={[0, 4.2, -1]}
      />
    </group>
  );
}

useGLTF.preload("/models/black_hole/scene.gltf");
