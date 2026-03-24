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
import { seededUnit } from "@/lib/random";

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
  const ringsRef = useRef<THREE.Group>(null);

  const ringCount = 7;
  const ringData = useMemo(() => {
    return Array.from({ length: ringCount }, (_, i) => ({
      radius: 1.2 + i * 0.6,
      speed: 0.2 + i * 0.12,
      tilt: (i * Math.PI) / ringCount + seededUnit(i * 11 + 1) * 0.3,
      phase: (i * Math.PI * 2) / ringCount,
    }));
  }, []);

  useFrame((state) => {
    if (!visible || !groupRef.current) return;
    const t = state.clock.elapsedTime;

    if (coreRef.current) {
      const scale = 0.15 + progress * 1.0;
      const breath = Math.sin(t * 1.5) * 0.03;
      coreRef.current.scale.setScalar(scale * (1 + breath));
    }

    if (glowRef.current) {
      const glowScale = THREE.MathUtils.lerp(
        0.52,
        ACT_PROFILE.fxLayerBehavior.coreScaleLimit,
        Math.min(progress / 0.55, 1)
      );
      glowRef.current.scale.setScalar(glowScale);
    }

    if (glowMaterialRef.current) {
      const glowOpacity = THREE.MathUtils.lerp(
        0.18,
        ACT_PROFILE.fxLayerBehavior.coreOpacity,
        Math.min(progress / 0.6, 1)
      );
      glowMaterialRef.current.opacity = glowOpacity;
      useViewportAuditStore.getState().reportFxLayer("act1-glow", {
        opacity: glowOpacity,
        scale: glowRef.current?.scale.x,
      });
    }

    if (ringsRef.current) {
      ringsRef.current.rotation.y = t * 0.08;
      ringsRef.current.rotation.z = Math.sin(t * 0.05) * 0.1;
      ringsRef.current.children.forEach((ring, i) => {
        ring.rotation.z = t * ringData[i].speed + ringData[i].phase;
        const ringProgress = Math.max(0, (progress - i * 0.08) / 0.4);
        const mat = (ring as THREE.Mesh).material as THREE.MeshBasicMaterial;
        mat.opacity = Math.min(1, ringProgress) * 0.35;
      });
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

      <pointLight
        color="#7ef2c6"
        intensity={progress * 25}
        distance={35}
        decay={2}
      />

      <spotLight
        position={[0, 0, 0]}
        target-position={[0, 5, 5]}
        color="#7ef2c6"
        intensity={progress * 15}
        angle={Math.PI / 3}
        penumbra={1}
        distance={30}
        decay={2}
      />

      <group ref={ringsRef}>
        {ringData.map((ring, i) => (
          <mesh key={i} rotation={[ring.tilt, 0, ring.phase]}>
            <torusGeometry args={[ring.radius, 0.012, 8, 80]} />
            <meshBasicMaterial
              color="#7ef2c6"
              transparent
              opacity={0.3}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      <Suspense fallback={null}>
        <DarkStarModel progress={progress} />
      </Suspense>
    </group>
  );
}

useGLTF.preload("/models/dark_star/scene.gltf");
