"use client";

import { shaderMaterial } from "@react-three/drei";
import { extend, useFrame, type ThreeElement } from "@react-three/fiber";
import React, { useRef } from "react";
import * as THREE from "three";

const CrystalShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new THREE.Color("#7ef2c6"),
    uFresnelPower: 3.0,
    uIridescenceStrength: 0.6,
  },
  // Vertex
  `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  varying vec2 vUv;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `,
  // Fragment
  `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uFresnelPower;
  uniform float uIridescenceStrength;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  varying vec2 vUv;

  void main() {
    vec3 viewDir = normalize(-vPosition);
    vec3 normal = normalize(vNormal);

    // Fresnel rim
    float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), uFresnelPower);

    // Iridescence — hue shift based on fresnel and viewing angle
    float hueShift = fresnel * 10.0 + uTime * 0.5;
    vec3 iridescence = vec3(
      sin(hueShift) * 0.5 + 0.5,
      sin(hueShift + 2.094) * 0.5 + 0.5,
      sin(hueShift + 4.189) * 0.5 + 0.5
    );

    // Base color with metallic sheen
    vec3 baseColor = uColor * 0.3;
    vec3 rimColor = mix(uColor, iridescence, uIridescenceStrength);

    // Combine
    vec3 finalColor = mix(baseColor, rimColor, fresnel);

    // Internal refraction fake — distort based on normal
    float refraction = dot(normal, vec3(0.0, 1.0, 0.0)) * 0.5 + 0.5;
    finalColor += uColor * refraction * 0.15;

    // Emissive glow at edges
    float edgeGlow = pow(fresnel, 1.5) * 2.0;

    gl_FragColor = vec4(finalColor + edgeGlow * rimColor, 0.85);
  }
  `
);

extend({ CrystalShaderMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    crystalShaderMaterial: ThreeElement<typeof CrystalShaderMaterial>;
  }
}

interface CrystalMaterialProps {
  color?: string;
  fresnelPower?: number;
  iridescenceStrength?: number;
}

export function CrystalMaterial({
  color = "#7ef2c6",
  fresnelPower = 3.0,
  iridescenceStrength = 0.6,
}: CrystalMaterialProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ref = useRef<any>(null);

  useFrame((state) => {
    if (ref.current) {
      ref.current.uTime = state.clock.elapsedTime;
    }
  });

  return (
    <crystalShaderMaterial
      ref={ref}
      transparent
      depthWrite={false}
      uTime={0}
      uColor={new THREE.Color(color)}
      uFresnelPower={fresnelPower}
      uIridescenceStrength={iridescenceStrength}
    />
  );
}
