"use client";

import { EffectComposer, Bloom, Vignette, ChromaticAberration } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { useCapsStore } from "@/stores/capsStore";
import * as THREE from "three";

function HighQualityEffects() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        luminanceThreshold={0.8}
        luminanceSmoothing={0.025}
        intensity={1.5}
        mipmapBlur
      />
      <Vignette offset={0.1} darkness={1.2} blendFunction={BlendFunction.NORMAL} />
      <ChromaticAberration
        offset={new THREE.Vector2(0.002, 0.002)}
        blendFunction={BlendFunction.NORMAL}
        radialModulation={false}
        modulationOffset={0}
      />
    </EffectComposer>
  );
}

function MediumQualityEffects() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        luminanceThreshold={0.9}
        luminanceSmoothing={0.025}
        intensity={0.8}
        mipmapBlur
      />
      <Vignette offset={0.1} darkness={0.8} blendFunction={BlendFunction.NORMAL} />
    </EffectComposer>
  );
}

export function PostProcessingStack() {
  const caps = useCapsStore((s) => s.caps);

  if (!caps || !caps.enablePostProcessing) return null;

  if (caps.tier === "high") return <HighQualityEffects />;
  return <MediumQualityEffects />;
}
