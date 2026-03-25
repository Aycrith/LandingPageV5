"use client";

import { useRef, useMemo } from "react";
import { useFrame, extend, type ThreeElement } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import * as THREE from "three";
import { useCursorStore } from "@/stores/cursorStore";

const WarpDriveShaderMaterial = shaderMaterial(
  {
    iTime: 0,
    iResolution: new THREE.Vector2(1920, 1080),
    iMouse: new THREE.Vector2(0.5, 0.5),
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
  // Fragment — wormhole tunnel with streaking starlight
  `
  uniform float iTime;
  uniform vec2 iResolution;
  uniform vec2 iMouse;
  uniform float uOpacity;
  varying vec2 vUv;

  #define PI 3.14159265358979

  float hash(float n){ return fract(sin(n) * 43758.5453); }

  float star(vec2 uv, float flare) {
    float d = length(uv);
    float m = 0.02 / d;
    float rays = max(0.0, 1.0 - abs(uv.x * uv.y * 1000.0));
    m += rays * flare;
    m *= smoothstep(1.0, 0.2, d);
    return m;
  }

  vec3 starLayer(vec2 uv, float offset) {
    vec3 col = vec3(0.0);
    vec2 gv = fract(uv) - 0.5;
    vec2 id = floor(uv);
    for(int y=-1; y<=1; y++) {
      for(int x=-1; x<=1; x++) {
        vec2 offs = vec2(float(x), float(y));
        float h = hash(dot(id + offs, vec2(12.9898, 78.233)));
        float n = hash(h * 3.1415);
        float size = fract(h * 345.32);
        float s = star(gv - offs - vec2(h, n) + 0.5, smoothstep(0.9, 1.0, size) * 0.5);
        vec3 color = sin(vec3(0.2, 0.3, 0.9) * fract(h * 2345.2) * 123.2) * 0.5 + 0.5;
        s *= sin(iTime * 3.0 + offset + h * 6.2831) * 0.5 + 0.5;
        col += s * size * color;
      }
    }
    return col;
  }

  void main() {
    vec2 uv = vUv - 0.5;
    // Mouse drives warp center
    vec2 warpCenter = (iMouse - 0.5) * 0.4;

    // Tunnel / warp effect
    float len = length(uv - warpCenter);
    float angle = atan(uv.y - warpCenter.y, uv.x - warpCenter.x);

    // Warp speed lines
    float speed = iTime * 0.8;
    float tunnel = fract(len * 3.0 - speed);
    float streak = pow(1.0 - tunnel, 8.0);
    float angularStreak = pow(abs(sin(angle * 6.0 + iTime * 0.5)), 12.0);
    float warpLines = streak * angularStreak / max(len * 4.0, 0.1);

    // Color shift based on depth
    vec3 warpColor = mix(
      vec3(0.05, 0.0, 0.15),
      vec3(0.4, 0.1, 0.8),
      clamp(warpLines * 0.5, 0.0, 1.0)
    );
    warpColor += vec3(0.2, 0.4, 1.0) * warpLines * 0.6;

    // Star layers
    vec3 stars = vec3(0.0);
    float t = iTime * 0.05;
    stars += starLayer(uv * 6.0 + t, 0.0)   * 0.6;
    stars += starLayer(uv * 12.0 + t * 2.0, 1.5) * 0.4;
    stars += starLayer(uv * 25.0 + t * 3.0, 3.0) * 0.3;

    // Vignette
    float vignette = smoothstep(0.7, 0.1, len);

    vec3 finalColor = (warpColor + stars) * vignette;
    gl_FragColor = vec4(finalColor, uOpacity * vignette);
  }
  `
);

extend({ WarpDriveShaderMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    warpDriveShaderMaterial: ThreeElement<typeof WarpDriveShaderMaterial>;
  }
}

interface WarpDriveBackgroundProps {
  progress: number;
}

export function WarpDriveBackground({ progress }: WarpDriveBackgroundProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const matRef = useRef<any>(null);
  const resVec = useMemo(() => new THREE.Vector2(1920, 1080), []);
  const mouseVec = useMemo(() => new THREE.Vector2(0.5, 0.5), []);

  useFrame((state) => {
    if (!matRef.current) return;
    matRef.current.iTime = state.clock.elapsedTime;
    resVec.set(state.size.width, state.size.height);
    matRef.current.iResolution = resVec;
    const { x, y } = useCursorStore.getState();
    mouseVec.set(x, y);
    matRef.current.iMouse = mouseVec;
    // Fade in with act progress
    matRef.current.uOpacity = Math.min(progress / 0.3, 1) * 0.85;
  });

  return (
    <mesh position={[0, 0, -18]} scale={[32, 18, 1]}>
      <planeGeometry args={[1, 1]} />
      <warpDriveShaderMaterial
        ref={matRef}
        iTime={0}
        iResolution={resVec}
        iMouse={mouseVec}
        uOpacity={0}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
