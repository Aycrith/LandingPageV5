"use client";

import { useEffect, useMemo, useRef } from "react";
import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { WORLD_PHASES, type WorldPhaseProfile } from "./viewportProfiles";
import { useUIStore } from "@/stores/uiStore";
import { useScrollStore } from "@/stores/scrollStore";
import { useWorldMotionRef } from "./worldMotion";

type VolumetricTextMesh = THREE.Mesh & {
  isText?: boolean;
  fillOpacity: number;
  strokeOpacity: number;
  material?: THREE.Material | THREE.Material[];
};

function opacityScale(value: number) {
  return THREE.MathUtils.clamp(value, 0, 1);
}

function getAnchorX(profile: WorldPhaseProfile): "left" | "center" {
  return Math.abs(profile.compositionZone.uiOffset[0]) < 0.2 ? "center" : "left";
}

function UiBlock({
  profile,
  role,
  actIndex,
  warmupVisible = false,
}: {
  profile: WorldPhaseProfile;
  role?: "current" | "next";
  actIndex?: number;
  warmupVisible?: boolean;
}) {
  const motionRef = useWorldMotionRef();
  const blockRef = useRef<THREE.Group>(null);
  const ctaGroupRef = useRef<THREE.Group>(null);
  const ctaOrbMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const ctaFocused = useUIStore((state) => state.isCtaFocused);
  const targetQuat = useMemo(() => new THREE.Quaternion(), []);
  const trackedMaterialsRef = useRef<Array<{ material: THREE.Material; baseOpacity: number }>>(
    []
  );
  const trackedTextRef = useRef<
    Array<{ text: VolumetricTextMesh; baseFillOpacity: number; baseStrokeOpacity: number }>
  >([]);
  const align = getAnchorX(profile);
  const titleAnchor = align === "center" ? "center" : "left";
  const railLocal = [
    profile.uiRig.railOffset[0] - profile.compositionZone.uiOffset[0],
    profile.uiRig.railOffset[1] - profile.compositionZone.uiOffset[1],
    profile.uiRig.railOffset[2] - profile.compositionZone.uiOffset[2],
  ] as const;
  const ctaLocal = [
    profile.uiRig.ctaAnchor[0] - profile.compositionZone.uiOffset[0],
    profile.uiRig.ctaAnchor[1] - profile.compositionZone.uiOffset[1],
    profile.uiRig.ctaAnchor[2] - profile.compositionZone.uiOffset[2],
  ] as const;

  useEffect(() => {
    if (!blockRef.current) {
      return;
    }

    const nextTrackedMaterials: Array<{
      material: THREE.Material;
      baseOpacity: number;
    }> = [];
    const nextTrackedText: Array<{
      text: VolumetricTextMesh;
      baseFillOpacity: number;
      baseStrokeOpacity: number;
    }> = [];

    blockRef.current.traverse((child) => {
      const mesh = child as THREE.Mesh & {
        material?: THREE.Material | THREE.Material[];
      };
      const textMesh = child as VolumetricTextMesh;

      if (textMesh.isText && textMesh.material) {
        nextTrackedText.push({
          text: textMesh,
          baseFillOpacity: textMesh.fillOpacity ?? 1,
          baseStrokeOpacity: textMesh.strokeOpacity ?? 0,
        });
      }

      const materials = mesh.material
        ? Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material]
        : [];

      for (const material of materials) {
        material.transparent = true;
        nextTrackedMaterials.push({
          material,
          baseOpacity: "opacity" in material ? material.opacity : 1,
        });
      }
    });

    trackedMaterialsRef.current = nextTrackedMaterials;
    trackedTextRef.current = nextTrackedText;
  }, [profile]);

  useFrame(({ camera }, delta) => {
    if (!blockRef.current) return;

    const motion = motionRef.current;
    const blend = motion.phaseBlend;
    const isPinnedBlock = actIndex != null;
    const currentOpacity = opacityScale(
      1 - THREE.MathUtils.smootherstep(blend, 0.24, 0.82)
    );
    const nextOpacity = opacityScale(
      THREE.MathUtils.smootherstep(blend, 0.52, 0.94)
    );
    const seedRebirthOpacity =
      motion.activeAct === WORLD_PHASES.length - 1
        ? opacityScale(THREE.MathUtils.smootherstep(blend, 0.72, 0.98))
        : 0;
    const opacity = isPinnedBlock
      ? actIndex === motion.activeAct
        ? currentOpacity
        : motion.activeAct === WORLD_PHASES.length - 1 && actIndex === 0
          ? seedRebirthOpacity
          : actIndex === motion.nextAct
            ? nextOpacity
            : 0
      : role === "current"
        ? currentOpacity
        : motion.activeAct === WORLD_PHASES.length - 1
          ? seedRebirthOpacity
          : nextOpacity;
    const emphasis = isPinnedBlock
      ? actIndex === motion.activeAct
        ? 1 - blend * 0.4
        : actIndex === motion.nextAct
          ? blend
          : 0
      : role === "current"
        ? 1 - blend * 0.4
        : blend;
    const showCtaRing = isPinnedBlock
      ? actIndex === motion.activeAct &&
        motion.activeAct === WORLD_PHASES.length - 1
      : role === "current" && motion.activeAct === WORLD_PHASES.length - 1;
    const ringIntensity = ctaFocused ? 1.35 : 0.8;
    const resolvedOpacity = warmupVisible ? Math.max(opacity, 0.12) : opacity;

    targetQuat.copy(camera.quaternion);
    const follow = 1 - Math.pow(0.02, delta * (5 + profile.uiRig.faceCameraStrength * 4));
    blockRef.current.quaternion.slerp(targetQuat, follow);
    blockRef.current.visible = warmupVisible || resolvedOpacity > 0.01;
    blockRef.current.scale.setScalar(0.34 + emphasis * 0.03);

    for (const { material, baseOpacity } of trackedMaterialsRef.current) {
      if (!("opacity" in material)) {
        continue;
      }

      // eslint-disable-next-line react-hooks/immutability
      material.opacity = baseOpacity * resolvedOpacity;
    }

    for (const { text, baseFillOpacity, baseStrokeOpacity } of trackedTextRef.current) {
      // eslint-disable-next-line react-hooks/immutability
      text.fillOpacity = baseFillOpacity * resolvedOpacity;
      text.strokeOpacity = baseStrokeOpacity * resolvedOpacity;
    }

    if (ctaGroupRef.current) {
      ctaGroupRef.current.visible = warmupVisible || showCtaRing;
    }
    if (ctaOrbMaterialRef.current) {
      ctaOrbMaterialRef.current.emissiveIntensity = ringIntensity;
      ctaOrbMaterialRef.current.opacity = resolvedOpacity;
    }
  });

  return (
    <group
      ref={blockRef}
      position={[
        profile.compositionZone.uiOffset[0],
        profile.compositionZone.uiOffset[1],
        profile.compositionZone.uiOffset[2] - 0.85,
      ]}
      visible={false}
    >
      {profile.textSafeZone.panel === "glass" && (
        <mesh position={[0, 0.12, -0.02]}>
          <planeGeometry args={[profile.uiRig.maxWidth + 0.4, 2.8]} />
          <meshPhysicalMaterial
            transmission={0.8}
            roughness={0.0}
            transparent
            opacity={profile.textSafeZone.veilOpacity}
            depthWrite={false}
            color="#001122"
          />
        </mesh>
      )}

      <mesh position={railLocal}>
        <boxGeometry args={[0.04, 2.15, 0.04]} />
        <meshBasicMaterial
          color={profile.accent}
          transparent
          opacity={0.42}
          toneMapped={false}
        />
      </mesh>

      <mesh position={[railLocal[0] + 0.16, railLocal[1] + 0.78, railLocal[2]]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial
          color={profile.accent}
          transparent
          opacity={0.72}
          toneMapped={false}
        />
      </mesh>

      <Text
        position={[align === "center" ? 0 : -1.55, 0.82, 0]}
        fontSize={0.055}
        letterSpacing={0.12}
        color={profile.accent}
        anchorX={titleAnchor}
        anchorY="middle"
        fillOpacity={0.82}
        outlineColor="#020304"
        outlineOpacity={0.36}
        outlineWidth={0.006}
        maxWidth={profile.uiRig.maxWidth}
      >
        {profile.copy.eyebrow.toUpperCase()}
      </Text>

      <Text
        position={[align === "center" ? 0 : -1.55, 0.36, 0]}
        fontSize={profile.uiRig.titleSize * 0.56}
        lineHeight={0.9}
        letterSpacing={-0.02}
        color="#f6fbff"
        anchorX={titleAnchor}
        anchorY="middle"
        fillOpacity={1}
        outlineColor="#020304"
        outlineOpacity={0.28}
        outlineWidth={0.008}
        maxWidth={profile.uiRig.maxWidth}
      >
        {profile.copy.title}
      </Text>

      <Text
        position={[align === "center" ? 0 : -1.55, -0.12, 0]}
        fontSize={profile.uiRig.subtitleSize * 0.7}
        letterSpacing={0.06}
        color="#dce6ea"
        anchorX={titleAnchor}
        anchorY="middle"
        fillOpacity={0.7}
        maxWidth={profile.uiRig.maxWidth}
      >
        {profile.copy.subtitle.toUpperCase()}
      </Text>

      {profile.copy.body ? (
        <Text
          position={[align === "center" ? 0 : -1.55, -0.58, 0]}
          fontSize={profile.uiRig.bodySize * 0.72}
          lineHeight={1.32}
          color="#adbac0"
          anchorX={titleAnchor}
          anchorY="top"
          fillOpacity={0.58}
          maxWidth={profile.uiRig.maxWidth}
        >
          {profile.copy.body}
        </Text>
      ) : null}

      {profile.copy.ctaLabel ? (
        <group ref={ctaGroupRef} position={ctaLocal} visible={false}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.34, 0.028, 12, 72]} />
            <meshBasicMaterial
              color={profile.accent}
              transparent
              opacity={0.64}
              toneMapped={false}
            />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.095, 24, 24]} />
            <meshStandardMaterial
              ref={ctaOrbMaterialRef}
              color="#05080c"
              emissive={profile.accent}
              emissiveIntensity={0.8}
              metalness={0.86}
              roughness={0.16}
              toneMapped={false}
              transparent
              opacity={1}
            />
          </mesh>
          <Text
            position={[0, -0.4, 0]}
            fontSize={0.12}
            letterSpacing={0.08}
            color="#f9fdff"
            anchorX="center"
            anchorY="middle"
            fillOpacity={1}
            maxWidth={2.6}
          >
            {profile.copy.ctaLabel.toUpperCase()}
          </Text>
        </group>
      ) : null}
    </group>
  );
}

export function VolumetricUI({
  activeActOverride,
}: {
  activeActOverride?: number;
}) {
  const liveActiveAct = useScrollStore((state) => state.activeAct);
  return (
    <VolumetricUIContent activeAct={activeActOverride ?? liveActiveAct} />
  );
}

export function StaticVolumetricUI({
  activeAct,
  warmupVisible = false,
}: {
  activeAct: number;
  warmupVisible?: boolean;
}) {
  return <VolumetricUIContent activeAct={activeAct} warmupVisible={warmupVisible} />;
}

function VolumetricUIContent({
  activeAct,
  warmupVisible = false,
}: {
  activeAct: number;
  warmupVisible?: boolean;
}) {
  const nextAct = (activeAct + 1) % WORLD_PHASES.length;
  const currentProfile = WORLD_PHASES[activeAct];
  const nextProfile = WORLD_PHASES[nextAct];

  return (
    <>
      <UiBlock profile={currentProfile} role="current" warmupVisible={warmupVisible} />
      <UiBlock profile={nextProfile} role="next" warmupVisible={warmupVisible} />
    </>
  );
}
