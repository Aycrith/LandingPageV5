"use client";

import { useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Preload } from "@react-three/drei";
import { ACESFilmicToneMapping } from "three";
import { SceneManager } from "./SceneManager";
import { CameraRig } from "./camera/CameraRig";
import { PostProcessingStack } from "./postfx/PostProcessingStack";
import {
  useCapsStore,
  detectCapabilities,
} from "@/stores/capsStore";
import { useUIStore } from "@/stores/uiStore";

export default function Experience() {
  const caps = useCapsStore((s) => s.caps);
  const setCaps = useCapsStore((s) => s.setCaps);

  useEffect(() => {
    const detected = detectCapabilities();
    setCaps(detected);
  }, [setCaps]);

  useEffect(() => {
    // Mark ready after a short delay to allow first render
    const timer = setTimeout(() => {
      useUIStore.getState().setLoadProgress(1);
      useUIStore.getState().setReady();
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!caps) return null;

  return (
    <Canvas
      gl={{
        antialias: caps.tier !== "low",
        alpha: false,
        powerPreference: "high-performance",
        toneMapping: ACESFilmicToneMapping,
        toneMappingExposure: 1.0,
      }}
      dpr={caps.dpr}
      shadows={caps.enableShadows}
      camera={{ position: [0, 0, 8], fov: 50, near: 0.1, far: 200 }}
      style={{ background: "#050507" }}
    >
      <CameraRig />
      <SceneManager />
      <PostProcessingStack />
      <Preload all />
    </Canvas>
  );
}
