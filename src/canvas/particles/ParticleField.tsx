"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useScrollStore } from "@/stores/scrollStore";
import { useCapsStore } from "@/stores/capsStore";
import { useMouseParallax } from "@/hooks/useMouseParallax";
import vertexShader from "@/canvas/shaders/particles.vert.glsl";
import fragmentShader from "@/canvas/shaders/particles.frag.glsl";
import { seededUnit } from "@/lib/random";
import { useSharedTexture } from "@/lib/textures";
import type { AmbientParticleMode } from "@/canvas/viewportProfiles";

const ACT_ACCENT_COLORS = [
  new THREE.Color("#7ef2c6"),
  new THREE.Color("#6dc7ff"),
  new THREE.Color("#d0a2ff"),
  new THREE.Color("#ffd06f"),
  new THREE.Color("#ff7eb3"),
];

interface ParticleFieldProps {
  mode: AmbientParticleMode;
}

export function ParticleField({ mode }: ParticleFieldProps) {
  const meshRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const mouse = useMouseParallax();
  const caps = useCapsStore((s) => s.caps);

  const count = caps?.maxParticles ?? 50000;

  const { positions, randoms, sizes } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const randoms = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const seed = i * 23;

      // Spherical distribution with varying density
      const r = Math.pow(seededUnit(seed + 1), 0.5) * 40;
      const theta = seededUnit(seed + 2) * Math.PI * 2;
      const phi = Math.acos(2 * seededUnit(seed + 3) - 1);

      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = r * Math.cos(phi);

      randoms[i3] = seededUnit(seed + 4);
      randoms[i3 + 1] = seededUnit(seed + 5) * 2 - 1;
      randoms[i3 + 2] = seededUnit(seed + 6);

      sizes[i] = 0.5 + seededUnit(seed + 7) * 2.0;
    }

    return { positions, randoms, sizes };
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScrollVelocity: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uActProgress: { value: 0 },
      uAccentColor: { value: new THREE.Color("#7ef2c6") },
      uOpacityScale: { value: 0.7 },
      uSizeScale: { value: 1 },
      // 1×1 white fallback — replaced once the noise texture finishes loading
      uNoiseTexture: {
        value: (() => {
          const data = new Uint8Array([255, 255, 255, 255]);
          const t = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);
          t.needsUpdate = true;
          return t;
        })(),
      },
    }),
    []
  );

  const noiseTexture = useSharedTexture(
    "/textures/volumetric/nebula-noise-1k-seamless.png",
    {
      wrapS: THREE.RepeatWrapping,
      wrapT: THREE.RepeatWrapping,
    }
  );

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uNoiseTexture.value = noiseTexture;
    }
  }, [noiseTexture]);

  const blendedColor = useMemo(() => new THREE.Color(), []);

  useFrame((state) => {
    if (!materialRef.current) return;

    const { activeAct, actProgress, velocity } = useScrollStore.getState();
    const nextAct = Math.min(activeAct + 1, ACT_ACCENT_COLORS.length - 1);

    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    materialRef.current.uniforms.uScrollVelocity.value = velocity;
    materialRef.current.uniforms.uMouse.value.set(
      mouse.current.x,
      mouse.current.y
    );
    materialRef.current.uniforms.uActProgress.value = actProgress;

    blendedColor
      .copy(ACT_ACCENT_COLORS[activeAct])
      .lerp(ACT_ACCENT_COLORS[nextAct], actProgress);
    materialRef.current.uniforms.uAccentColor.value.copy(blendedColor);
    materialRef.current.uniforms.uOpacityScale.value =
      mode === "dense" ? 0.72 : 0.34;
    materialRef.current.uniforms.uSizeScale.value =
      mode === "dense" ? 1.05 : 0.82;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-aRandom"
          args={[randoms, 3]}
        />
        <bufferAttribute
          attach="attributes-aSize"
          args={[sizes, 1]}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
