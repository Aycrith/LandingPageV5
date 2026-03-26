"use client";

import { shaderMaterial } from "@react-three/drei";
import { extend, useFrame, type ThreeElement } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

const MicrotubuleShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new THREE.Color("#00ccff"),
    uPulse: 0.0,
    uGlowIntensity: 1.0,
  },
  // Vertex
  `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `,
  // Fragment
  `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uPulse;
  uniform float uGlowIntensity;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;

  void main() {
    vec3 viewDir = normalize(-vPosition);
    vec3 normal = normalize(vNormal);

    // Fresnel rim — gelatinous edge glow
    float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 2.2);

    // Internal metabolic pulse — light travels along Z axis
    float pulse = sin(uTime * 1.8 + vWorldPosition.z * 3.0) * 0.5 + 0.5;
    float firingFlash = uPulse;

    // Translucent gelatinous depth — inner light
    float innerLight = pulse * 0.4 + fresnel * 0.6;

    // Color: base violet-cyan, bright on edges
    vec3 baseColor = uColor * 0.15;
    vec3 rimColor = uColor * (1.0 + firingFlash * 4.0);
    vec3 finalColor = mix(baseColor, rimColor, fresnel) + uColor * innerLight * 0.3;

    // Edge emission
    float edgeGlow = pow(fresnel, 1.8) * uGlowIntensity * (1.0 + firingFlash * 2.0);
    finalColor += rimColor * edgeGlow;

    // Opacity: translucent core, bright edges
    float alpha = mix(0.08, 0.72, fresnel) + firingFlash * 0.3;

    gl_FragColor = vec4(finalColor, alpha);
  }
  `
);

extend({ MicrotubuleShaderMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    microtubuleShaderMaterial: ThreeElement<typeof MicrotubuleShaderMaterial>;
  }
}

interface MicrotubuleMaterialProps {
  color?: string;
  glowIntensity?: number;
  pulse?: number;
}

export function MicrotubuleMaterial({
  color = "#00ccff",
  glowIntensity = 1.0,
  pulse = 0.0,
}: MicrotubuleMaterialProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ref = useRef<any>(null);

  useFrame((state) => {
    if (ref.current) {
      ref.current.uTime = state.clock.elapsedTime;
    }
  });

  return (
    <microtubuleShaderMaterial
      ref={ref}
      transparent
      depthWrite={false}
      blending={THREE.AdditiveBlending}
      toneMapped={false}
      uTime={0}
      uColor={new THREE.Color(color)}
      uPulse={pulse}
      uGlowIntensity={glowIntensity}
    />
  );
}
