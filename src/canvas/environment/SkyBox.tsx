"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useScrollStore } from "@/stores/scrollStore";

const ACT_SKY_COLORS = [
  { top: "#020208", bottom: "#050510", mid: "#0a0a1a" },
  { top: "#030510", bottom: "#060812", mid: "#0a1020" },
  { top: "#08040e", bottom: "#0a0610", mid: "#120a1a" },
  { top: "#0d0805", bottom: "#100a06", mid: "#1a1208" },
  { top: "#080308", bottom: "#0a050a", mid: "#150810" },
];

export function SkyBox() {
  const meshRef = useRef<THREE.Mesh>(null);

  const uniforms = useMemo(
    () => ({
      uTopColor: { value: new THREE.Color(ACT_SKY_COLORS[0].top) },
      uMidColor: { value: new THREE.Color(ACT_SKY_COLORS[0].mid) },
      uBottomColor: { value: new THREE.Color(ACT_SKY_COLORS[0].bottom) },
      uTime: { value: 0 },
    }),
    []
  );

  const blendTop = useMemo(() => new THREE.Color(), []);
  const blendMid = useMemo(() => new THREE.Color(), []);
  const blendBot = useMemo(() => new THREE.Color(), []);

  useFrame((state) => {
    const { activeAct, actProgress } = useScrollStore.getState();
    const nextAct = Math.min(activeAct + 1, ACT_SKY_COLORS.length - 1);
    const a = ACT_SKY_COLORS[activeAct];
    const b = ACT_SKY_COLORS[nextAct];

    blendTop.set(a.top).lerp(new THREE.Color(b.top), actProgress);
    blendMid.set(a.mid).lerp(new THREE.Color(b.mid), actProgress);
    blendBot.set(a.bottom).lerp(new THREE.Color(b.bottom), actProgress);

    uniforms.uTopColor.value.copy(blendTop);
    uniforms.uMidColor.value.copy(blendMid);
    uniforms.uBottomColor.value.copy(blendBot);
    uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh ref={meshRef} scale={[-1, 1, 1]}>
      <sphereGeometry args={[100, 32, 32]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={`
          varying vec3 vWorldPosition;
          void main() {
            vec4 worldPos = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPos.xyz;
            gl_Position = projectionMatrix * viewMatrix * worldPos;
          }
        `}
        fragmentShader={`
          uniform vec3 uTopColor;
          uniform vec3 uMidColor;
          uniform vec3 uBottomColor;
          uniform float uTime;
          varying vec3 vWorldPosition;

          // Simple noise for subtle star-like dots
          float hash(vec3 p) {
            p = fract(p * vec3(443.8975, 397.2973, 491.1871));
            p += dot(p, p.zyx + 19.27);
            return fract(p.x * p.y * p.z);
          }

          void main() {
            vec3 dir = normalize(vWorldPosition);
            float y = dir.y * 0.5 + 0.5; // 0 = bottom, 1 = top

            // Three-stop gradient
            vec3 color;
            if (y > 0.5) {
              color = mix(uMidColor, uTopColor, (y - 0.5) * 2.0);
            } else {
              color = mix(uBottomColor, uMidColor, y * 2.0);
            }

            // Subtle stars
            float starNoise = hash(floor(dir * 200.0));
            float star = step(0.998, starNoise) * (0.3 + 0.2 * sin(uTime * 2.0 + starNoise * 100.0));
            color += star;

            gl_FragColor = vec4(color, 1.0);
          }
        `}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}
