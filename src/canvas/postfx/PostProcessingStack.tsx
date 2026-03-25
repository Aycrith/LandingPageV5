"use client";

import { useMemo } from "react";
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import { useCapsStore } from "@/stores/capsStore";
import { useScrollStore } from "@/stores/scrollStore";
import { ACT_VIEWPORT_PROFILES } from "../viewportProfiles";

export function PostProcessingStack() {
  const caps = useCapsStore((state) => state.caps);
  const activeAct = useScrollStore((state) => state.activeAct);

  const profile = ACT_VIEWPORT_PROFILES[activeAct];
  const tierOverride =
    caps?.tier != null ? profile.tierOverrides[caps.tier] : undefined;

  const bloomIntensity =
    profile.postFxProfile.bloomIntensity *
    (tierOverride?.bloomIntensityMultiplier ?? 1);
  const bloomThreshold =
    profile.postFxProfile.bloomThreshold +
    (tierOverride?.bloomThresholdOffset ?? 0);
  const vignetteDarkness =
    profile.postFxProfile.vignetteDarkness *
    (tierOverride?.vignetteDarknessMultiplier ?? 1);
  const chromaticOffset =
    profile.postFxProfile.chromaticOffset *
    (tierOverride?.chromaticOffsetMultiplier ?? 1);

  const chromaticVector = useMemo(
    () => new THREE.Vector2(chromaticOffset, chromaticOffset),
    [chromaticOffset]
  );

  if (!caps || !caps.enablePostProcessing) {
    return null;
  }

  if (chromaticOffset > 0) {
    return (
      <EffectComposer multisampling={0}>
        <Bloom
          luminanceThreshold={bloomThreshold}
          luminanceSmoothing={profile.postFxProfile.bloomSmoothing}
          intensity={bloomIntensity}
          mipmapBlur
        />
        <Vignette
          offset={profile.postFxProfile.vignetteOffset}
          darkness={vignetteDarkness}
          blendFunction={BlendFunction.NORMAL}
        />
        <ChromaticAberration
          offset={chromaticVector}
          blendFunction={BlendFunction.NORMAL}
          radialModulation={false}
          modulationOffset={0}
        />
      </EffectComposer>
    );
  }

  return (
    <EffectComposer multisampling={0}>
      <Bloom
        luminanceThreshold={bloomThreshold}
        luminanceSmoothing={profile.postFxProfile.bloomSmoothing}
        intensity={bloomIntensity}
        mipmapBlur
      />
      <Vignette
        offset={profile.postFxProfile.vignetteOffset}
        darkness={vignetteDarkness}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
}
