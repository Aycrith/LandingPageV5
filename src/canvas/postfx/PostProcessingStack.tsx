"use client";

import { useRef } from "react";
import { Bloom, ChromaticAberration, EffectComposer, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import {
  BlendFunction,
  BloomEffect,
  ChromaticAberrationEffect,
  VignetteEffect,
} from "postprocessing";
import { useFrame, useThree } from "@react-three/fiber";
import { useCapsStore } from "@/stores/capsStore";
import { useScrollStore } from "@/stores/scrollStore";
import { useSceneLoadStore } from "@/stores/sceneLoadStore";
import { useViewportAuditStore } from "@/stores/viewportAuditStore";
import { WORLD_PHASES } from "../viewportProfiles";
import { computeCrossfadeBlend } from "@/lib/transition";

function nextPhaseIndex(index: number) {
  return (index + 1) % WORLD_PHASES.length;
}

export function PostProcessingStack() {
  const caps = useCapsStore((state) => state.caps);
  // Guard against renderer not yet initialized — prevents 'Cannot read properties of null
  // (reading alpha)' crash in EffectComposer.addPass under React 19 concurrent rendering.
  const gl = useThree((state) => state.gl);
  // Defer EffectComposer mount until scene startup is confirmed stable. Mounting alongside
  // Suspense-driven GLTF loading causes concurrent-render null-ref in addPass (React 19 + r3f v9).
  const stableFrameReady = useSceneLoadStore((state) => state.stableFrameReady);
  const renderPipeline = useViewportAuditStore((state) => state.renderPipeline);
  const pressure = renderPipeline?.budget.pressure ?? "nominal";
  const bloomRef = useRef<BloomEffect | null>(null);
  const vignetteRef = useRef<VignetteEffect | null>(null);
  const chromaticRef = useRef<ChromaticAberrationEffect | null>(null);
  const chromaticOffsetVector = useRef(new THREE.Vector2()).current;
  const postFxEnabled =
    Boolean(gl) &&
    stableFrameReady &&
    Boolean(caps?.enablePostProcessing) &&
    pressure !== "critical";

  useFrame(() => {
    if (!postFxEnabled || !caps) {
      return;
    }

    const { activeAct, actProgress } = useScrollStore.getState();
    const currentProfile = WORLD_PHASES[activeAct];
    const nextProfile = WORLD_PHASES[nextPhaseIndex(activeAct)];
    const blendT = computeCrossfadeBlend(
      actProgress,
      currentProfile.transitionRig
    );
    const tierOverride =
      caps.tier != null ? currentProfile.tierOverrides[caps.tier] : undefined;
    const bloomThreshold =
      currentProfile.postFxProfile.bloomThreshold +
      (tierOverride?.bloomThresholdOffset ?? 0);
    const bloomIntensity =
      currentProfile.postFxProfile.bloomIntensity *
      (tierOverride?.bloomIntensityMultiplier ?? 1) *
      (pressure === "elevated" ? 0.7 : 1);
    const nextBloomThreshold = nextProfile.postFxProfile.bloomThreshold;
    const nextBloomIntensity = nextProfile.postFxProfile.bloomIntensity;
    const vignetteDarkness =
      currentProfile.postFxProfile.vignetteDarkness *
      (tierOverride?.vignetteDarknessMultiplier ?? 1) *
      (pressure === "elevated" ? 0.82 : 1);
    const chromaticBase = currentProfile.postFxProfile.chromaticOffset;
    const nextChromaticBase = nextProfile.postFxProfile.chromaticOffset;
    const chromaticLerped =
      chromaticBase + (nextChromaticBase - chromaticBase) * blendT;
    const chromaticScaled =
      chromaticLerped *
      (tierOverride?.chromaticOffsetMultiplier ?? 1) *
      (pressure === "elevated" ? 0.35 : 1);

    if (bloomRef.current) {
      bloomRef.current.intensity =
        bloomIntensity + (nextBloomIntensity - bloomIntensity) * blendT;
      if (bloomRef.current.luminanceMaterial) {
        bloomRef.current.luminanceMaterial.threshold =
          bloomThreshold + (nextBloomThreshold - bloomThreshold) * blendT;
      }
    }

    if (vignetteRef.current) {
      vignetteRef.current.offset =
        currentProfile.postFxProfile.vignetteOffset +
        (nextProfile.postFxProfile.vignetteOffset -
          currentProfile.postFxProfile.vignetteOffset) *
          blendT;
      vignetteRef.current.darkness =
        vignetteDarkness +
        (nextProfile.postFxProfile.vignetteDarkness - vignetteDarkness) * blendT;
    }

    if (chromaticRef.current?.offset) {
      const x = caps.tier !== "low" ? chromaticScaled : 0;
      const y = caps.tier !== "low" ? chromaticScaled * 0.5 : 0;
      chromaticOffsetVector.set(x, y);
      chromaticRef.current.setOffset(chromaticOffsetVector);
    }
  });

  if (!postFxEnabled || !caps) {
    return null;
  }

  const initialScroll = useScrollStore.getState();
  const initialProfile = WORLD_PHASES[initialScroll.activeAct];
  const initialNextProfile = WORLD_PHASES[nextPhaseIndex(initialScroll.activeAct)];
  const initialBlendT = computeCrossfadeBlend(
    initialScroll.actProgress,
    initialProfile.transitionRig
  );
  const initialTierOverride =
    caps.tier != null ? initialProfile.tierOverrides[caps.tier] : undefined;
  const initialBloomThreshold =
    initialProfile.postFxProfile.bloomThreshold +
    (initialTierOverride?.bloomThresholdOffset ?? 0);
  const initialBloomIntensity =
    initialProfile.postFxProfile.bloomIntensity *
    (initialTierOverride?.bloomIntensityMultiplier ?? 1) *
    (pressure === "elevated" ? 0.7 : 1);
  const initialVignetteDarkness =
    initialProfile.postFxProfile.vignetteDarkness *
    (initialTierOverride?.vignetteDarknessMultiplier ?? 1) *
    (pressure === "elevated" ? 0.82 : 1);
  const initialChromaticScaled =
    initialProfile.postFxProfile.chromaticOffset *
    (initialTierOverride?.chromaticOffsetMultiplier ?? 1) *
    (pressure === "elevated" ? 0.35 : 1);
  const initialChromaticOffset: [number, number] =
    caps.tier !== "low"
      ? [initialChromaticScaled, initialChromaticScaled * 0.5]
      : [0, 0];

  return (
    <EffectComposer multisampling={0}>
      <Bloom
        ref={(node: BloomEffect | null) => {
          bloomRef.current = node;
        }}
        luminanceThreshold={
          initialBloomThreshold +
          (initialNextProfile.postFxProfile.bloomThreshold - initialBloomThreshold) *
            initialBlendT
        }
        luminanceSmoothing={0.025}
        intensity={
          initialBloomIntensity +
          (initialNextProfile.postFxProfile.bloomIntensity - initialBloomIntensity) *
            initialBlendT
        }
        mipmapBlur
      />
      <Vignette
        ref={(node: VignetteEffect | null) => {
          vignetteRef.current = node;
        }}
        offset={
          initialProfile.postFxProfile.vignetteOffset +
          (initialNextProfile.postFxProfile.vignetteOffset -
            initialProfile.postFxProfile.vignetteOffset) *
            initialBlendT
        }
        darkness={initialVignetteDarkness}
        blendFunction={BlendFunction.NORMAL}
      />
      <ChromaticAberration
        ref={(node: ChromaticAberrationEffect | null) => {
          chromaticRef.current = node;
        }}
        offset={initialChromaticOffset as unknown as [number, number]}
      />
    </EffectComposer>
  );
}
