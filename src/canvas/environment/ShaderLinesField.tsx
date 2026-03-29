"use client";

import { useRef } from "react";
import { useFrame, extend, type ThreeElement } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import * as THREE from "three";

// Shader Lines — mosaic sliding lines converging toward focal point (Act5)
const ShaderLinesMaterial = shaderMaterial(
  {
    uTime: 0,
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
  uniform float uIntensity;
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;
    float t = uTime * 0.5;

    // Mosaic scale
    vec2 mosaic = uv * vec2(18.0, 10.0);
    vec2 cell = fract(mosaic) - 0.5;

    // Sliding lines — converging toward center
    float lineDir = mod(floor(mosaic.x) + floor(mosaic.y), 2.0);
    float speed = (lineDir * 2.0 - 1.0) * t;
    float linePos = fract(mosaic.y * 0.5 + speed);

    // Line width
    float line = smoothstep(0.0008, 0.0, abs(linePos - 0.5) - 0.48);

    // RGB channel shift for cyber look
    float lineR = smoothstep(0.0010, 0.0, abs(fract(mosaic.y * 0.5 + speed + 0.002) - 0.5) - 0.48);
    float lineB = smoothstep(0.0010, 0.0, abs(fract(mosaic.y * 0.5 + speed - 0.002) - 0.5) - 0.48);

    vec3 color = vec3(lineR * 0.8, line * 0.6, lineB);
    // Converge intensity toward center
    float radial = 1.0 - smoothstep(0.0, 0.6, length(uv - 0.5));
    float alpha = line * uIntensity * radial * 0.6;

    gl_FragColor = vec4(color, alpha);
  }
  `
);

extend({ ShaderLinesMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    shaderLinesMaterial: ThreeElement<typeof ShaderLinesMaterial>;
  }
}

interface ShaderLinesFieldProps {
  progress: number;
  enabled?: boolean;
}

export function ShaderLinesField({
  progress,
  enabled = true,
}: ShaderLinesFieldProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const matRef = useRef<any>(null);

  useFrame((state) => {
    if (!enabled || !matRef.current) return;
    matRef.current.uTime = state.clock.elapsedTime;
    matRef.current.uIntensity = Math.min(progress / 0.5, 1);
  });

  if (!enabled) {
    return null;
  }

  return (
    <mesh position={[0, 0, -5]}>
      <planeGeometry args={[18, 10]} />
      <shaderLinesMaterial
        ref={matRef}
        uTime={0}
        uIntensity={0}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
