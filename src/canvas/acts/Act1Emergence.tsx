"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ACT_VIEWPORT_PROFILES } from "@/canvas/viewportProfiles";
import { useViewportAuditStore } from "@/stores/viewportAuditStore";
import { getActWeight, useWorldMotionRef } from "@/canvas/worldMotion";

const ACT_INDEX = 0;
const ACT_PROFILE = ACT_VIEWPORT_PROFILES[0];

export function Act1Emergence({
  auditEnabled = true,
}: {
  auditEnabled?: boolean;
}) {
  const motionRef = useWorldMotionRef();
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const coreMaterialRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const glowMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const accretionPrimaryRef = useRef<THREE.Mesh>(null);
  const accretionSecondaryRef = useRef<THREE.Mesh>(null);
  const lensRef = useRef<THREE.Mesh>(null);
  const pointLightRef = useRef<THREE.PointLight>(null);
  const spotLightRef = useRef<THREE.SpotLight>(null);

  useEffect(() => {
    if (!auditEnabled) {
      return;
    }
    return () => {
      useViewportAuditStore.getState().clearFxLayer("act1-glow");
    };
  }, [auditEnabled]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const progress = getActWeight(motionRef.current, ACT_INDEX);
    const visible = progress > 0.01;
    groupRef.current.visible = visible;
    if (!visible) return;
    const t = state.clock.elapsedTime;

    groupRef.current.position.y = -0.2 - progress * 0.45;

    if (coreRef.current) {
      const scale = 0.18 + progress * 1.15;
      const breath = Math.sin(t * 1.5) * 0.03;
      coreRef.current.scale.setScalar(scale * (1 + breath));
      coreRef.current.rotation.y = t * 0.12;
      coreRef.current.rotation.x = Math.sin(t * 0.18) * 0.08;
    }
    if (coreMaterialRef.current) {
      coreMaterialRef.current.emissiveIntensity =
        0.62 * ACT_PROFILE.materialGrade.emissiveBoost +
        Math.sin(t * 1.5) * 0.08;
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
      if (auditEnabled) {
        useViewportAuditStore.getState().reportFxLayer("act1-glow", {
          opacity: glowOpacity,
          scale: glowRef.current?.scale.x,
        });
      }
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
    if (pointLightRef.current) {
      pointLightRef.current.intensity = progress * 18;
    }
    if (spotLightRef.current) {
      spotLightRef.current.intensity = progress * 10;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[1, 4]} />
        <meshPhysicalMaterial
          ref={coreMaterialRef}
          color={ACT_PROFILE.materialGrade.coreColor}
          emissive={ACT_PROFILE.materialGrade.coreEmissive}
          emissiveIntensity={0.62}
          roughness={0.16}
          metalness={0.82}
          transmission={0.08}
          thickness={0.22}
          clearcoat={1}
          clearcoatRoughness={0.08}
          toneMapped={false}
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
        ref={pointLightRef}
        color="#7ef2c6"
        intensity={0}
        distance={28}
        decay={2}
      />

      <spotLight
        ref={spotLightRef}
        position={[0, 4, -4]}
        target-position={[0, 0, 0]}
        color="#d7fff1"
        intensity={0}
        angle={Math.PI / 4.5}
        penumbra={1}
        distance={30}
        decay={2}
      />
    </group>
  );
}
