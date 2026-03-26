"use client";

import { shaderMaterial } from "@react-three/drei";
import { extend, useFrame, type ThreeElement } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useCapsStore } from "@/stores/capsStore";
import { useScrollStore } from "@/stores/scrollStore";
import { seededUnit } from "@/lib/random";

// ── Shader ────────────────────────────────────────────────────────────────────

const VoidPointMaterial = shaderMaterial(
  {
    uTime: 0,
    uScrollZ: 0,
    uOpacity: 1.0,
  },
  // Vertex
  `
  attribute float aSize;
  attribute vec3 aColor;
  varying vec3 vColor;
  varying float vDepth;
  uniform float uScrollZ;

  void main() {
    vColor = aColor;
    vec3 pos = position;
    pos.z += uScrollZ;

    // Wrap Z so particles loop continuously during scroll
    pos.z = mod(pos.z + 80.0, 80.0) - 80.0;

    vDepth = clamp(1.0 - (-pos.z / 80.0), 0.0, 1.0);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aSize * (400.0 / -mvPosition.z) * vDepth;
    gl_Position = projectionMatrix * mvPosition;
  }
  `,
  // Fragment — optical glare falloff
  `
  varying vec3 vColor;
  varying float vDepth;
  uniform float uOpacity;

  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;

    // Bright core, soft halo
    float core = pow(1.0 - d * 2.0, 4.0);
    float halo = pow(1.0 - d * 2.0, 1.2) * 0.3;
    float glare = core + halo;

    gl_FragColor = vec4(vColor * glare, glare * uOpacity * vDepth);
  }
  `
);

extend({ VoidPointMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    voidPointMaterial: ThreeElement<typeof VoidPointMaterial>;
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function VoidParticleField() {
  const caps = useCapsStore((s) => s.caps);
  const tier = caps?.tier ?? "low";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const matRef = useRef<any>(null);

  const count = tier === "high" ? 2000 : tier === "medium" ? 800 : 300;

  // Deterministic particle geometry — no Math.random() in render
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    const violetColor = new THREE.Color("#3d0066");
    const cyanColor = new THREE.Color("#00ffee");
    const midColor = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const seed = i * 7;
      // Spread particles in a wide tunnel, deep Z range -80 to 0
      const theta = seededUnit(seed) * Math.PI * 2;
      const radius = 2 + seededUnit(seed + 1) * 22;
      positions[i * 3] = Math.cos(theta) * radius;
      positions[i * 3 + 1] = (seededUnit(seed + 2) - 0.5) * 18;
      positions[i * 3 + 2] = -seededUnit(seed + 3) * 80;

      // Color: violet (far) → cyan (near) based on normalized Z
      const depthT = 1.0 - positions[i * 3 + 2] / -80;
      midColor.copy(violetColor).lerp(cyanColor, depthT);
      colors[i * 3] = midColor.r;
      colors[i * 3 + 1] = midColor.g;
      colors[i * 3 + 2] = midColor.b;

      // Vary size — brighter/larger near center of void
      sizes[i] = 0.8 + seededUnit(seed + 4) * 2.4 + (1.0 - radius / 24) * 1.8;
    }

    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));

    return geo;
  }, [count]);

  useFrame((state) => {
    if (!matRef.current) return;
    const { progress } = useScrollStore.getState();
    matRef.current.uTime = state.clock.elapsedTime;
    // Map scroll to Z flight — deeper as user scrolls
    matRef.current.uScrollZ = progress * 60.0;
    // Fade opacity based on scroll — brightest mid-scroll (inside void)
    const fadeIn = Math.min(progress * 6, 1);
    matRef.current.uOpacity = 0.15 + fadeIn * 0.65;
  });

  return (
    <points geometry={geometry}>
      <voidPointMaterial
        ref={matRef}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
        uTime={0}
        uScrollZ={0}
        uOpacity={0.15}
      />
    </points>
  );
}
