"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useScrollStore } from "@/stores/scrollStore";

const ACT_SKY_COLORS = [
  { top: "#020208", bottom: "#050510", mid: "#0a0a1a" },  // Act 1 Seed
  { top: "#030510", bottom: "#060812", mid: "#0a1020" },  // Act 2 Scaffold
  { top: "#08040e", bottom: "#0a0610", mid: "#120a1a" },  // Act 3 Circulation
  { top: "#0d0805", bottom: "#100a06", mid: "#1a1208" },  // Act 4 Sentience
  { top: "#080308", bottom: "#0a050a", mid: "#150810" },  // Act 5 Apotheosis
  { top: "#000000", bottom: "#000008", mid: "#00000f" },  // Act 6 Quantum Consciousness
];

export function SkyBox() {
  const meshRef = useRef<THREE.Mesh>(null);
  const topColors = useMemo(
    () => ACT_SKY_COLORS.map((palette) => new THREE.Color(palette.top)),
    []
  );
  const midColors = useMemo(
    () => ACT_SKY_COLORS.map((palette) => new THREE.Color(palette.mid)),
    []
  );
  const bottomColors = useMemo(
    () => ACT_SKY_COLORS.map((palette) => new THREE.Color(palette.bottom)),
    []
  );

  const uniforms = useMemo(
    () => ({
      uTopColor: { value: topColors[0].clone() },
      uMidColor: { value: midColors[0].clone() },
      uBottomColor: { value: bottomColors[0].clone() },
      uTime: { value: 0 },
    }),
    [bottomColors, midColors, topColors]
  );

  const blendTop = useMemo(() => new THREE.Color(), []);
  const blendMid = useMemo(() => new THREE.Color(), []);
  const blendBot = useMemo(() => new THREE.Color(), []);

  useFrame((state) => {
    if (!meshRef.current) return;

    const { activeAct, actProgress } = useScrollStore.getState();
    const nextAct = Math.min(activeAct + 1, ACT_SKY_COLORS.length - 1);
    const mat = meshRef.current.material as THREE.ShaderMaterial;

    blendTop.copy(topColors[activeAct]).lerp(topColors[nextAct], actProgress);
    blendMid.copy(midColors[activeAct]).lerp(midColors[nextAct], actProgress);
    blendBot
      .copy(bottomColors[activeAct])
      .lerp(bottomColors[nextAct], actProgress);

    (mat.uniforms.uTopColor.value as THREE.Color).copy(blendTop);
    (mat.uniforms.uMidColor.value as THREE.Color).copy(blendMid);
    (mat.uniforms.uBottomColor.value as THREE.Color).copy(blendBot);
    mat.uniforms.uTime.value = state.clock.elapsedTime;
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
