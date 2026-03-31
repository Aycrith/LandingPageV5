"use client";

import { useRef } from "react";
import { useFrame, extend, type ThreeElement } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import { getActWeight, isActVisible, useWorldMotionRef } from "@/canvas/worldMotion";

const GradientBlurShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uOpacity: 0.0,
  },
  // Vertex
  `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `,
  // Fragment
  `
  uniform float uTime;
  uniform float uOpacity;
  varying vec2 vUv;

  vec3 rgb(float r, float g, float b) {
    return vec3(r / 255.0, g / 255.0, b / 255.0);
  }

  void main() {
    vec2 uv = vUv;
    float t = uTime * 0.2;

    vec3 color1 = vec3(0.02, 0.015, 0.03); 
    vec3 color2 = vec3(0.1, 0.05, 0.15);
    vec3 color3 = vec3(0.05, 0.02, 0.1); 

    // Fluid noise
    float noise1 = sin(uv.x * 3.0 + t) * cos(uv.y * 2.0 + t);
    float noise2 = sin(uv.x * 2.0 - t * 1.5) * cos(uv.y * 3.0 + t * 0.8);

    float mix1 = smoothstep(-1.0, 1.0, noise1);
    float mix2 = smoothstep(-1.0, 1.0, noise2);

    vec3 finalColor = mix(color1, color2, mix1);
    finalColor = mix(finalColor, color3, mix2);

    // Vignette
    float dist = distance(uv, vec2(0.5));
    finalColor *= smoothstep(0.8, 0.2, dist);

    gl_FragColor = vec4(finalColor, uOpacity);
  }
  `
);

extend({ GradientBlurShaderMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    gradientBlurShaderMaterial: ThreeElement<typeof GradientBlurShaderMaterial>;
  }
}

interface GradientBlurBgProps {
  actIndex: number;
  enabled?: boolean;
}

export function GradientBlurBg({
  actIndex,
  enabled = true,
}: GradientBlurBgProps) {
  const motionRef = useWorldMotionRef();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const matRef = useRef<any>(null);

  useFrame((state) => {
    const motion = motionRef.current;
    const progress = getActWeight(motion, actIndex);
    if (!enabled || !matRef.current || !isActVisible(motion, actIndex)) return;
    matRef.current.uTime = state.clock.elapsedTime;
    matRef.current.uOpacity = Math.min(progress / 0.3, 1) * 0.9;
  });

  if (!enabled) {
    return null;
  }

  return (
    <mesh position={[0, 0, -10]} scale={[30, 15, 1]}>
      <planeGeometry args={[1, 1]} />
      <gradientBlurShaderMaterial
        ref={matRef}
        uTime={0}
        uOpacity={0}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}
