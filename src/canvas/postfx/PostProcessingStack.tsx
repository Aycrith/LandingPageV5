"use client";

import { Bloom, ChromaticAberration, EffectComposer, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { useThree } from "@react-three/fiber";
import { useCapsStore } from "@/stores/capsStore";
import { useScrollStore } from "@/stores/scrollStore";
import { WORLD_PHASES } from "../viewportProfiles";

function nextPhaseIndex(index: number) {
  return (index + 1) % WORLD_PHASES.length;
}

export function PostProcessingStack() {
  const caps = useCapsStore((state) => state.caps);
  const activeAct = useScrollStore((state) => state.activeAct);
  const actProgress = useScrollStore((state) => state.actProgress);
  // Guard against renderer not yet initialized — prevents 'Cannot read properties of null
  // (reading alpha)' crash in EffectComposer.addPass under React 19 concurrent rendering.
  const gl = useThree((state) => state.gl);

  if (!gl || !caps || !caps.enablePostProcessing) {
    return null;
  }

  const currentProfile = WORLD_PHASES[activeAct];
  const nextProfile = WORLD_PHASES[nextPhaseIndex(activeAct)];
  const tierOverride =
    caps.tier != null ? currentProfile.tierOverrides[caps.tier] : undefined;

  const bloomThreshold =
    currentProfile.postFxProfile.bloomThreshold +
    (tierOverride?.bloomThresholdOffset ?? 0);
  const bloomIntensity =
    currentProfile.postFxProfile.bloomIntensity *
    (tierOverride?.bloomIntensityMultiplier ?? 1);
  const nextBloomThreshold = nextProfile.postFxProfile.bloomThreshold;
  const nextBloomIntensity = nextProfile.postFxProfile.bloomIntensity;
  const vignetteDarkness =
    currentProfile.postFxProfile.vignetteDarkness *
    (tierOverride?.vignetteDarknessMultiplier ?? 1);

  const chromaticOffset: [number, number] =
    caps.tier === "high" && (activeAct === 1 || activeAct === 3)
      ? [0.002, 0.001]
      : [0, 0];

  return (
    <EffectComposer multisampling={0}>
      <Bloom
        luminanceThreshold={
          bloomThreshold + (nextBloomThreshold - bloomThreshold) * actProgress
        }
        luminanceSmoothing={0.025}
        intensity={
          bloomIntensity + (nextBloomIntensity - bloomIntensity) * actProgress
        }
        mipmapBlur
      />
      <Vignette
        offset={
          currentProfile.postFxProfile.vignetteOffset +
          (nextProfile.postFxProfile.vignetteOffset -
            currentProfile.postFxProfile.vignetteOffset) *
            actProgress
        }
        darkness={
          vignetteDarkness +
          (nextProfile.postFxProfile.vignetteDarkness - vignetteDarkness) *
            actProgress
        }
        blendFunction={BlendFunction.NORMAL}
      />
      <ChromaticAberration offset={chromaticOffset as unknown as [number, number]} />
    </EffectComposer>
  );
}
