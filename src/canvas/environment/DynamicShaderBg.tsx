"use client";

import { useRef, useMemo } from "react";
import { useFrame, extend, type ThreeElement } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import * as THREE from "three";
import { useCursorStore } from "@/stores/cursorStore";
import { getActWeight, isActVisible, useWorldMotionRef } from "@/canvas/worldMotion";

// Animated WebGL shader background for Act2 — wave/mosaic distortion with RGB channel separation
const DynamicShaderBgMaterial = shaderMaterial(
  {
    uTime: 0,
    uMouse: new THREE.Vector2(0.5, 0.5),
    uIntensity: 0.0,
  },
  `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `,
  `
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uIntensity;
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;
    // RGB channel separation driven by mouse
    vec2 chromaOffset = (uMouse - 0.5) * 0.008 * uIntensity;

    float t = uTime * 0.4;

    // Wave distortion per channel
    float r = sin(uv.x * 8.0 + t + chromaOffset.x * 40.0)
            * sin(uv.y * 6.0 + t * 0.7) * 0.5 + 0.5;
    float g = sin(uv.x * 6.0 + t * 1.1)
            * sin(uv.y * 8.0 + t * 0.9 + chromaOffset.y * 40.0) * 0.5 + 0.5;
    float b = sin(uv.x * 10.0 + t * 0.8 + chromaOffset.x * 20.0)
            * sin(uv.y * 4.0 + t * 1.2) * 0.5 + 0.5;

    // Mosaic grid overlay
    vec2 grid = fract(uv * 24.0);
    float gridLine = step(0.95, grid.x) + step(0.95, grid.y);
    gridLine = clamp(gridLine, 0.0, 1.0);

    vec3 waveColor = vec3(r * 0.06, g * 0.04, b * 0.12);
    waveColor += gridLine * vec3(0.04, 0.08, 0.18) * uIntensity;

    // Vignette to center
    float vig = 1.0 - smoothstep(0.3, 1.0, length(uv - 0.5) * 1.8);

    float alpha = uIntensity * vig * 0.7;
    gl_FragColor = vec4(waveColor, alpha);
  }
  `
);

extend({ DynamicShaderBgMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    dynamicShaderBgMaterial: ThreeElement<typeof DynamicShaderBgMaterial>;
  }
}

interface DynamicShaderBgProps {
  actIndex: number;
  enabled?: boolean;
}

export function DynamicShaderBg({
  actIndex,
  enabled = true,
}: DynamicShaderBgProps) {
  const motionRef = useWorldMotionRef();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const matRef = useRef<any>(null);
  const mouseVec = useMemo(() => new THREE.Vector2(0.5, 0.5), []);

  useFrame((state) => {
    const motion = motionRef.current;
    const progress = getActWeight(motion, actIndex);
    if (!enabled || !matRef.current || !isActVisible(motion, actIndex)) return;
    matRef.current.uTime = state.clock.elapsedTime;
    const { x, y } = useCursorStore.getState();
    mouseVec.set(x, y);
    matRef.current.uMouse = mouseVec;
    matRef.current.uIntensity = Math.min(progress / 0.4, 1);
  });

  if (!enabled) {
    return null;
  }

  return (
    <mesh position={[0, 0, -10]} scale={[28, 16, 1]}>
      <planeGeometry args={[1, 1]} />
      <dynamicShaderBgMaterial
        ref={matRef}
        uTime={0}
        uMouse={mouseVec}
        uIntensity={0}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
