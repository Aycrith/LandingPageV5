"use client";

import { shaderMaterial } from "@react-three/drei";
import { extend, useFrame, type ThreeElement } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

const HologramShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new THREE.Color("#6dc7ff"),
    uScanlineSpeed: 2.0,
    uScanlineCount: 80.0,
    uGlitchIntensity: 0.02,
  },
  // Vertex
  `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uGlitchIntensity;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;

    vec3 pos = position;

    // Glitch displacement
    float glitch = step(0.98, sin(uTime * 20.0 + position.y * 50.0));
    pos.x += glitch * uGlitchIntensity * sin(uTime * 100.0);

    vPosition = (modelViewMatrix * vec4(pos, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
  `,
  // Fragment
  `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uScanlineSpeed;
  uniform float uScanlineCount;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;

  void main() {
    vec3 viewDir = normalize(-vPosition);
    vec3 normal = normalize(vNormal);

    // Fresnel edge glow
    float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 2.0);

    // Scanlines
    float scanline = sin(vUv.y * uScanlineCount + uTime * uScanlineSpeed) * 0.5 + 0.5;
    scanline = smoothstep(0.3, 0.7, scanline);

    // Noise flicker
    float noise = fract(sin(dot(vUv + uTime * 0.1, vec2(12.9898, 78.233))) * 43758.5453);
    float flicker = 0.9 + noise * 0.1;

    // Combine
    float alpha = (0.2 + fresnel * 0.8) * scanline * flicker;
    vec3 color = uColor * (0.5 + fresnel * 1.5);

    // Edge highlight
    color += vec3(1.0) * fresnel * 0.3;

    gl_FragColor = vec4(color, alpha * 0.7);
  }
  `
);

extend({ HologramShaderMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    hologramShaderMaterial: ThreeElement<typeof HologramShaderMaterial>;
  }
}

interface HologramMaterialProps {
  color?: string;
}

export function HologramMaterial({ color = "#6dc7ff" }: HologramMaterialProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ref = useRef<any>(null);

  useFrame((state) => {
    if (ref.current) {
      (ref.current as unknown as { uTime: number }).uTime = state.clock.elapsedTime;
    }
  });

  return (
    <hologramShaderMaterial
      ref={ref}
      transparent
      depthWrite={false}
      side={THREE.DoubleSide}
      blending={THREE.AdditiveBlending}
      uTime={0}
      uColor={new THREE.Color(color)}
      uScanlineSpeed={2.0}
      uScanlineCount={80.0}
      uGlitchIntensity={0.02}
    />
  );
}
