"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { ACT_VIEWPORT_PROFILES } from "./viewportProfiles";
import {
  areCriticalAssetsReady,
  useSceneLoadStore,
} from "@/stores/sceneLoadStore";
import { useCapsStore } from "@/stores/capsStore";

const STABLE_FRAME_THRESHOLD =
  ACT_VIEWPORT_PROFILES[0].fxLayerBehavior.stableFrames;

export function StartupReadinessGate() {
  const stableFrames = useRef(0);

  useFrame(() => {
    const state = useSceneLoadStore.getState();
    const capsState = useCapsStore.getState();
    const MAX_STARTUP_WAIT_MS = capsState.caps?.budgets.loadTimeMs ?? 6000;

    if (state.stableFrameReady || state.hasFallbackTriggered) return;

    if (!areCriticalAssetsReady(state)) {
      if (Date.now() - state.startupStartedAt > MAX_STARTUP_WAIT_MS) {
        console.warn("[StartupReadinessGate] Critical assets timed out, enforcing fallback.");
        state.markFallbackTriggered();
      }
      stableFrames.current = 0;
      return;
    }

    stableFrames.current += 1;
    if (stableFrames.current >= STABLE_FRAME_THRESHOLD) {
      state.markStableFrameReady();
    } else if (Date.now() - state.startupStartedAt > MAX_STARTUP_WAIT_MS + 2000) {
      console.warn("[StartupReadinessGate] Stable frames timed out, enforcing fallback.");
      state.markFallbackTriggered();
    }
  });

  return null;
}
