"use client";

import { useRef, useMemo, Suspense, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { CrystalMaterial } from "@/canvas/materials/CrystalMaterial";
import { ACT_VIEWPORT_PROFILES } from "@/canvas/viewportProfiles";
import { useSceneLoadStore } from "@/stores/sceneLoadStore";
import { useViewportAuditStore } from "@/stores/viewportAuditStore";
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

const ACT_PROFILE = ACT_VIEWPORT_PROFILES[0];

function DarkStarModel({ progress }: { progress: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const worldPosRef = useRef(new THREE.Vector3());
  const gltf = useGLTF("/models/dark_star/scene.gltf");
  const sceneClone = useStableSceneClone(gltf.scene);
  const bounds = useSceneBounds(gltf.scene);
  const markCriticalAssetReady = useSceneLoadStore((s) => s.markCriticalAssetReady);

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

  useEffect(() => {
    markCriticalAssetReady("act1-dark-star");
    return () => {
      useViewportAuditStore.getState().clearHeroModel("act1-dark-star");
    };
  }, [markCriticalAssetReady]);

  useFrame((state) => {
    if (!groupRef.current) return;

    const t = state.clock.elapsedTime;
    groupRef.current.rotation.y = t * 0.15;
    groupRef.current.rotation.x = Math.sin(t * 0.1) * 0.05;

    const desiredScale = THREE.MathUtils.lerp(
      ACT_PROFILE.heroModelBehavior.baseScale,
      ACT_PROFILE.heroModelBehavior.maxScale,
      progress
    );
    const clampedScale = Math.min(desiredScale, fittedMaxScale);
    const camera = state.camera as THREE.PerspectiveCamera;

    groupRef.current.scale.setScalar(clampedScale);
    groupRef.current.position.set(
      ACT_PROFILE.heroModelBehavior.focusOffset[0],
      ACT_PROFILE.heroModelBehavior.focusOffset[1] -
        bounds.center.y * clampedScale * 0.08,
      ACT_PROFILE.heroModelBehavior.focusOffset[2]
    );

    groupRef.current.getWorldPosition(worldPosRef.current);
    const distance = worldPosRef.current.distanceTo(camera.position);
    const visibleHeight = getViewportHeightAtDistance(distance, camera.fov);

    useViewportAuditStore.getState().reportHeroModel("act1-dark-star", {
      desiredScale,
      appliedScale: clampedScale,
      fillRatio: (bounds.height * clampedScale) / visibleHeight,
      maxFill: ACT_PROFILE.maxModelViewportFill,
    });
  });

  return (
    <group ref={groupRef}>
      <primitive object={sceneClone} />
    </group>
  );
}

export function Act1Emergence({ progress, visible }: ActProps) {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const glowMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const accretionPrimaryRef = useRef<THREE.Mesh>(null);
  const accretionSecondaryRef = useRef<THREE.Mesh>(null);
  const lensRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    return () => {
      useViewportAuditStore.getState().clearFxLayer("act1-glow");
    };
  }, []);

  useFrame((state) => {
    if (!visible || !groupRef.current) return;
    const t = state.clock.elapsedTime;

    groupRef.current.position.y = -0.2 - progress * 0.45;

    if (coreRef.current) {
      const scale = 0.18 + progress * 1.15;
      const breath = Math.sin(t * 1.5) * 0.03;
      coreRef.current.scale.setScalar(scale * (1 + breath));
      coreRef.current.rotation.y = t * 0.12;
      coreRef.current.rotation.x = Math.sin(t * 0.18) * 0.08;
    }

    if (glowRef.current) {
      const glowScale = THREE.MathUtils.lerp(
        0.46,
        ACT_PROFILE.fxLayerBehavior.coreScaleLimit,
        Math.min(progress / 0.55, 1)
      );
      glowRef.current.scale.setScalar(glowScale);
    }

    if (glowMaterialRef.current) {
      const glowOpacity = THREE.MathUtils.lerp(
        0.1,
        ACT_PROFILE.fxLayerBehavior.coreOpacity,
        Math.min(progress / 0.6, 1)
      );
      glowMaterialRef.current.opacity = glowOpacity;
      useViewportAuditStore.getState().reportFxLayer("act1-glow", {
        opacity: glowOpacity,
        scale: glowRef.current?.scale.x,
      });
    }

    if (accretionPrimaryRef.current) {
      accretionPrimaryRef.current.rotation.z = t * 0.2;
      const mat =
        accretionPrimaryRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = THREE.MathUtils.lerp(0.04, 0.26, Math.min(progress / 0.5, 1));
      accretionPrimaryRef.current.scale.setScalar(0.96 + progress * 0.22);
    }

    if (accretionSecondaryRef.current) {
      accretionSecondaryRef.current.rotation.z = -t * 0.12 + 0.2;
      const mat =
        accretionSecondaryRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = THREE.MathUtils.lerp(0.02, 0.12, Math.min(progress / 0.55, 1));
      accretionSecondaryRef.current.scale.setScalar(0.86 + progress * 0.15);
    }

    if (lensRef.current) {
      const mat = lensRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = THREE.MathUtils.lerp(0.04, 0.1, Math.min(progress / 0.55, 1));
      lensRef.current.scale.setScalar(1 + Math.sin(t * 0.5) * 0.02);
    }

    const fadeOut = progress > 0.85 ? 1 - (progress - 0.85) / 0.15 : 1;
    groupRef.current.visible = fadeOut > 0.01;
  });

  if (!visible) return null;

  return (
    <group ref={groupRef}>
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[1, 4]} />
        <CrystalMaterial
          color="#7ef2c6"
          fresnelPower={2.5}
          iridescenceStrength={0.7}
        />
      </mesh>

      <mesh ref={glowRef} scale={0.58}>
        <icosahedronGeometry args={[1, 3]} />
        <meshBasicMaterial
          ref={glowMaterialRef}
          color="#7ef2c6"
          transparent
          opacity={0.24}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      <mesh ref={lensRef} scale={1.02}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial
          color="#d7fff1"
          transparent
          opacity={0.06}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      <mesh ref={accretionPrimaryRef} rotation={[Math.PI / 1.95, 0, 0.18]}>
        <ringGeometry args={[1.45, 3.5, 96, 1]} />
        <meshBasicMaterial
          color="#fff2cf"
          transparent
          opacity={0.18}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>

      <mesh ref={accretionSecondaryRef} rotation={[Math.PI / 1.8, 0.25, -0.1]}>
        <ringGeometry args={[1.2, 2.55, 96, 1]} />
        <meshBasicMaterial
          color="#7ef2c6"
          transparent
          opacity={0.08}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>

      <pointLight
        color="#7ef2c6"
        intensity={progress * 18}
        distance={28}
        decay={2}
      />

      <spotLight
        position={[0, 4, -4]}
        target-position={[0, 0, 0]}
        color="#d7fff1"
        intensity={progress * 10}
        angle={Math.PI / 4.5}
        penumbra={1}
        distance={30}
        decay={2}
      />

      <Suspense fallback={null}>
        <DarkStarModel progress={progress} />
      </Suspense>
    </group>
  );
}

useGLTF.preload("/models/dark_star/scene.gltf");
