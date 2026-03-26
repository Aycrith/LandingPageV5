"use client";

import { shaderMaterial } from "@react-three/drei";
import { extend, useFrame, type ThreeElement } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

const WireframePulseShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new THREE.Color("#6dc7ff"),
    uPulseSpeed: 1.5,
    uPulseWidth: 0.15,
    uSecondaryPulseMix: 1.0,
    uFresnelStrength: 1.0,
  },
  // Vertex
  `
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUv;

  void main() {
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `,
  // Fragment
  `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uPulseSpeed;
  uniform float uPulseWidth;
  uniform float uSecondaryPulseMix;
  uniform float uFresnelStrength;

  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUv;

  void main() {
    // Traveling pulse along Y axis
    float pulse = sin(vPosition.y * 3.0 - uTime * uPulseSpeed) * 0.5 + 0.5;
    pulse = smoothstep(0.5 - uPulseWidth, 0.5, pulse) *
            smoothstep(0.5 + uPulseWidth, 0.5, pulse);
    pulse = max(pulse, 0.0);

    // Second pulse traveling in opposite direction
    float pulse2 = sin(-vPosition.y * 2.5 - uTime * uPulseSpeed * 0.7 + 1.57) * 0.5 + 0.5;
    pulse2 = smoothstep(0.5 - uPulseWidth, 0.5, pulse2) *
             smoothstep(0.5 + uPulseWidth, 0.5, pulse2);

    float totalPulse = max(pulse, pulse2 * uSecondaryPulseMix);

    // Fresnel for edge visibility
    vec3 viewDir = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - max(dot(normalize(vNormal), viewDir), 0.0), 1.5) * uFresnelStrength;

    // Base wireframe visibility + pulse highlight
    float alpha = 0.3 + fresnel * 0.3 + totalPulse * 0.8;
    vec3 color = uColor * (0.4 + totalPulse * 1.5);

    gl_FragColor = vec4(color, alpha);
  }
  `
);

extend({ WireframePulseShaderMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    wireframePulseShaderMaterial: ThreeElement<typeof WireframePulseShaderMaterial>;
  }
}

interface WireframePulseMaterialProps {
  color?: string;
  pulseSpeed?: number;
  pulseWidth?: number;
  secondaryPulseMix?: number;
  fresnelStrength?: number;
}

export function WireframePulseMaterial({
  color = "#6dc7ff",
  pulseSpeed = 1.5,
  pulseWidth = 0.15,
  secondaryPulseMix = 1,
  fresnelStrength = 1,
}: WireframePulseMaterialProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ref = useRef<any>(null);

  useFrame((state) => {
    if (ref.current) {
      (ref.current as unknown as { uTime: number }).uTime = state.clock.elapsedTime;
    }
  });

  return (
    <wireframePulseShaderMaterial
      ref={ref}
      transparent
      depthWrite={false}
      wireframe
      blending={THREE.AdditiveBlending}
      uTime={0}
      uColor={new THREE.Color(color)}
      uPulseSpeed={pulseSpeed}
      uPulseWidth={pulseWidth}
      uSecondaryPulseMix={secondaryPulseMix}
      uFresnelStrength={fresnelStrength}
    />
  );
}
