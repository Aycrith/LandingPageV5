"use client";

import { Bloom, ChromaticAberration, EffectComposer, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { useThree } from "@react-three/fiber";
import { useCapsStore } from "@/stores/capsStore";
import { useScrollStore } from "@/stores/scrollStore";
import { useSceneLoadStore } from "@/stores/sceneLoadStore";
import { WORLD_PHASES } from "../viewportProfiles";
import { computeCrossfadeBlend } from "@/lib/transition";

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
  // Defer EffectComposer mount until scene startup is confirmed stable. Mounting alongside
  // Suspense-driven GLTF loading causes concurrent-render null-ref in addPass (React 19 + r3f v9).
  const stableFrameReady = useSceneLoadStore((state) => state.stableFrameReady);

  if (!gl || !stableFrameReady || !caps || !caps.enablePostProcessing) {
    return null;
  }

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
    (tierOverride?.bloomIntensityMultiplier ?? 1);
  const nextBloomThreshold = nextProfile.postFxProfile.bloomThreshold;
  const nextBloomIntensity = nextProfile.postFxProfile.bloomIntensity;
  const vignetteDarkness =
    currentProfile.postFxProfile.vignetteDarkness *
    (tierOverride?.vignetteDarknessMultiplier ?? 1);

  const chromaticBase = currentProfile.postFxProfile.chromaticOffset;
  const nextChromaticBase = nextProfile.postFxProfile.chromaticOffset;
  const chromaticLerped =
    chromaticBase + (nextChromaticBase - chromaticBase) * blendT;
  const chromaticScaled =
    chromaticLerped * (tierOverride?.chromaticOffsetMultiplier ?? 1);
  const chromaticOffset: [number, number] =
    caps.tier !== "low"
      ? [chromaticScaled, chromaticScaled * 0.5]
      : [0, 0];

  return (
    <EffectComposer multisampling={0}>
      <Bloom
        luminanceThreshold={
          bloomThreshold + (nextBloomThreshold - bloomThreshold) * blendT
        }
        luminanceSmoothing={0.025}
        intensity={
          bloomIntensity + (nextBloomIntensity - bloomIntensity) * blendT
        }
        mipmapBlur
      />
      <Vignette
        offset={
          currentProfile.postFxProfile.vignetteOffset +
          (nextProfile.postFxProfile.vignetteOffset -
            currentProfile.postFxProfile.vignetteOffset) *
            blendT
        }
        darkness={
          vignetteDarkness +
          (nextProfile.postFxProfile.vignetteDarkness - vignetteDarkness) *
            blendT
        }
        blendFunction={BlendFunction.NORMAL}
      />
      <ChromaticAberration offset={chromaticOffset as unknown as [number, number]} />
    </EffectComposer>
  );
}
