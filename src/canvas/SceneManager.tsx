"use client";

import { useFrame } from "@react-three/fiber";
import { useRef, useMemo, Suspense } from "react";
import * as THREE from "three";
import { Environment } from "@react-three/drei";
import { useScrollStore } from "@/stores/scrollStore";
import { useCapsStore } from "@/stores/capsStore";
import { ParticleField } from "./particles/ParticleField";
import { SkyBox } from "./environment/SkyBox";
import { Act1Emergence } from "./acts/Act1Emergence";
import { Act2Structure } from "./acts/Act2Structure";
import { Act3Flow } from "./acts/Act3Flow";
import { Act4Quantum } from "./acts/Act4Quantum";
import { Act5Convergence } from "./acts/Act5Convergence";

// Act color palettes
const ACT_COLORS = [
  { accent: "#7ef2c6", fog: "#050507", ambient: 0.15 }, // Emergence
  { accent: "#6dc7ff", fog: "#060810", ambient: 0.25 }, // Structure
  { accent: "#d0a2ff", fog: "#08050d", ambient: 0.2 },  // Flow
  { accent: "#ffd06f", fog: "#0d0a07", ambient: 0.2 },  // Quantum
  { accent: "#ff7eb3", fog: "#0a0508", ambient: 0.15 }, // Convergence
];

export function SceneManager() {
  const fogRef = useRef<THREE.FogExp2>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const keyLightRef = useRef<THREE.DirectionalLight>(null);

  const fogColors = useMemo(
    () => ACT_COLORS.map((a) => new THREE.Color(a.fog)),
    []
  );
  const accentColors = useMemo(
    () => ACT_COLORS.map((a) => new THREE.Color(a.accent)),
    []
  );

  const currentFog = useMemo(() => new THREE.Color(), []);
  const currentAccent = useMemo(() => new THREE.Color(), []);

  useFrame(() => {
    const { activeAct, actProgress } = useScrollStore.getState();

    const nextAct = Math.min(activeAct + 1, ACT_COLORS.length - 1);
    const t = actProgress;

    // Interpolate fog
    currentFog.copy(fogColors[activeAct]).lerp(fogColors[nextAct], t);
    if (fogRef.current) {
      fogRef.current.color.copy(currentFog);
      fogRef.current.density = THREE.MathUtils.lerp(
        0.006 + activeAct * 0.001,
        0.006 + nextAct * 0.001,
        t
      );
    }

    // Interpolate ambient
    if (ambientRef.current) {
      ambientRef.current.intensity = THREE.MathUtils.lerp(
        ACT_COLORS[activeAct].ambient,
        ACT_COLORS[nextAct].ambient,
        t
      );
    }

    // Interpolate key light
    currentAccent.copy(accentColors[activeAct]).lerp(accentColors[nextAct], t);
    if (keyLightRef.current) {
      keyLightRef.current.color.copy(currentAccent);
    }
  });

  // Use Zustand subscribe for React rendering (acts need visibility)
  const activeAct = useScrollStore((s) => s.activeAct);
  const actProgress = useScrollStore((s) => s.actProgress);
  const caps = useCapsStore((s) => s.caps);

  const renderRange = caps?.tier === "high" ? 1 : 0;
  const shouldRenderAct = (actIndex: number): boolean =>
    Math.abs(activeAct - actIndex) <= renderRange;

  return (
    <>
      <fogExp2 ref={fogRef} attach="fog" args={["#050507", 0.006]} />

      {/* Three-point lighting */}
      <ambientLight ref={ambientRef} intensity={0.15} />
      <directionalLight
        ref={keyLightRef}
        position={[5, 8, 5]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0001}
      />
      <directionalLight position={[-5, 3, -5]} intensity={0.3} color="#e0f7ff" />
      <spotLight position={[0, 10, -8]} intensity={0.8} angle={Math.PI / 5} penumbra={0.7} />

      {/* Procedural skybox */}
      <SkyBox />

      {/* HDRI environment — IBL / reflections for all PBR materials */}
      <Suspense fallback={null}>
        {caps?.tier === "high" ? (
          <Environment files="/env/hdri/kloppenheim_07_4k.exr" background={false} />
        ) : caps?.tier === "medium" ? (
          <Environment preset="city" background={false} />
        ) : null}
      </Suspense>

      {/* Ambient particle field — always present */}
      {caps?.tier === "low" ? null : <ParticleField />}

      {/* Act scenes — mount ±1 from active for smooth transitions */}
      {shouldRenderAct(0) ? (
        <Act1Emergence
          progress={activeAct === 0 ? actProgress : 0}
          visible={true}
        />
      ) : null}
      {shouldRenderAct(1) ? (
        <Act2Structure
          progress={activeAct === 1 ? actProgress : activeAct > 1 ? 1 : 0}
          visible={true}
        />
      ) : null}
      {shouldRenderAct(2) ? (
        <Act3Flow
          progress={activeAct === 2 ? actProgress : activeAct > 2 ? 1 : 0}
          visible={true}
        />
      ) : null}
      {shouldRenderAct(3) ? (
        <Act4Quantum
          progress={activeAct === 3 ? actProgress : activeAct > 3 ? 1 : 0}
          visible={true}
        />
      ) : null}
      {shouldRenderAct(4) ? (
        <Act5Convergence
          progress={activeAct === 4 ? actProgress : 0}
          visible={true}
        />
      ) : null}
    </>
  );
}
