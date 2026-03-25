"use client";

import { useMemo, useRef } from "react";
import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { WORLD_PHASES, type WorldPhaseProfile } from "./viewportProfiles";
import { useUIStore } from "@/stores/uiStore";

interface VolumetricUIProps {
  activeAct: number;
  nextAct: number;
  blend: number;
}

function opacityScale(value: number) {
  return THREE.MathUtils.clamp(value, 0, 1);
}

function getAnchorX(profile: WorldPhaseProfile): "left" | "center" {
  return Math.abs(profile.uiRig.anchor[0]) < 0.2 ? "center" : "left";
}

function UiBlock({
  profile,
  opacity,
  emphasis,
  showCtaRing,
}: {
  profile: WorldPhaseProfile;
  opacity: number;
  emphasis: number;
  showCtaRing: boolean;
}) {
  const blockRef = useRef<THREE.Group>(null);
  const ctaFocused = useUIStore((state) => state.isCtaFocused);
  const targetQuat = useMemo(() => new THREE.Quaternion(), []);
  const align = getAnchorX(profile);
  const titleAnchor = align === "center" ? "center" : "left";
  const railLocal = [
    profile.uiRig.railOffset[0] - profile.uiRig.anchor[0],
    profile.uiRig.railOffset[1] - profile.uiRig.anchor[1],
    profile.uiRig.railOffset[2] - profile.uiRig.anchor[2],
  ] as const;
  const ctaLocal = [
    profile.uiRig.ctaAnchor[0] - profile.uiRig.anchor[0],
    profile.uiRig.ctaAnchor[1] - profile.uiRig.anchor[1],
    profile.uiRig.ctaAnchor[2] - profile.uiRig.anchor[2],
  ] as const;
  const panelWidth = align === "center" ? 4.8 : 4.2;
  const ringIntensity = ctaFocused ? 1.35 : 0.8;
  const ringOpacityBoost = ctaFocused ? 0.22 : 0;

  useFrame(({ camera }, delta) => {
    if (!blockRef.current) return;
    targetQuat.copy(camera.quaternion);
    const follow = 1 - Math.pow(0.02, delta * (5 + profile.uiRig.faceCameraStrength * 4));
    blockRef.current.quaternion.slerp(targetQuat, follow);
  });

  if (opacity <= 0.01) {
    return null;
  }

  return (
    <group
      ref={blockRef}
      position={[
        profile.uiRig.anchor[0],
        profile.uiRig.anchor[1],
        profile.uiRig.anchor[2] - 1.15,
      ]}
      scale={0.42 + emphasis * 0.04}
    >
      <mesh position={[0, 0.02, -0.12]}>
        <boxGeometry args={[panelWidth, 2.15, 0.05]} />
        <meshPhysicalMaterial
          color="#071015"
          emissive={profile.accent}
          emissiveIntensity={0.025 * emphasis}
          transparent
          opacity={0.08 * opacity}
          metalness={0.1}
          roughness={0.18}
          transmission={0.2}
          thickness={0.8}
          depthWrite={false}
        />
      </mesh>

      <mesh position={railLocal}>
        <boxGeometry args={[0.04, 2.15, 0.04]} />
        <meshBasicMaterial
          color={profile.accent}
          transparent
          opacity={0.52 * opacity}
          toneMapped={false}
        />
      </mesh>

      <mesh position={[railLocal[0] + 0.16, railLocal[1] + 0.78, railLocal[2]]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial
          color={profile.accent}
          transparent
          opacity={0.78 * opacity}
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
        fillOpacity={0.86 * opacity}
        outlineColor="#020304"
        outlineOpacity={0.5 * opacity}
        outlineWidth={0.008}
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
        fillOpacity={opacity}
        outlineColor="#020304"
        outlineOpacity={0.38 * opacity}
        outlineWidth={0.012}
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
        fillOpacity={0.78 * opacity}
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
          fillOpacity={0.68 * opacity}
          maxWidth={profile.uiRig.maxWidth}
        >
          {profile.copy.body}
        </Text>
      ) : null}

      {showCtaRing && profile.copy.ctaLabel ? (
        <group position={ctaLocal}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.34, 0.028, 12, 72]} />
            <meshBasicMaterial
              color={profile.accent}
              transparent
              opacity={(0.64 + ringOpacityBoost) * opacity}
              toneMapped={false}
            />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.095, 24, 24]} />
            <meshStandardMaterial
              color="#05080c"
              emissive={profile.accent}
              emissiveIntensity={ringIntensity}
              metalness={0.86}
              roughness={0.16}
              toneMapped={false}
            />
          </mesh>
          <Text
            position={[0, -0.4, 0]}
            fontSize={0.12}
            letterSpacing={0.08}
            color="#f9fdff"
            anchorX="center"
            anchorY="middle"
            fillOpacity={opacity}
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
  activeAct,
  nextAct,
  blend,
}: VolumetricUIProps) {
  const currentProfile = WORLD_PHASES[activeAct];
  const nextProfile = WORLD_PHASES[nextAct];
  const nextOpacity = opacityScale(THREE.MathUtils.smootherstep(blend, 0.52, 0.94));
  const currentOpacity = opacityScale(1 - THREE.MathUtils.smootherstep(blend, 0.24, 0.82));
  const seedRebirthOpacity =
    activeAct === WORLD_PHASES.length - 1
      ? opacityScale(THREE.MathUtils.smootherstep(blend, 0.72, 0.98))
      : 0;

  return (
    <>
      <UiBlock
        profile={currentProfile}
        opacity={currentOpacity}
        emphasis={1 - blend * 0.4}
        showCtaRing={activeAct === WORLD_PHASES.length - 1}
      />
      <UiBlock
        profile={nextProfile}
        opacity={activeAct === WORLD_PHASES.length - 1 ? seedRebirthOpacity : nextOpacity}
        emphasis={blend}
        showCtaRing={false}
      />
    </>
  );
}
