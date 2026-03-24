"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { ACT_VIEWPORT_PROFILES } from "./viewportProfiles";
import {
  areCriticalAssetsReady,
  useSceneLoadStore,
} from "@/stores/sceneLoadStore";

const STABLE_FRAME_THRESHOLD =
  ACT_VIEWPORT_PROFILES[0].fxLayerBehavior.stableFrames;

export function StartupReadinessGate() {
  const stableFrames = useRef(0);

  useFrame(() => {
    const state = useSceneLoadStore.getState();
    if (state.stableFrameReady) return;

    if (!areCriticalAssetsReady(state)) {
      stableFrames.current = 0;
      return;
    }

    stableFrames.current += 1;
    if (stableFrames.current >= STABLE_FRAME_THRESHOLD) {
      state.markStableFrameReady();
    }
  });

  return null;
}
