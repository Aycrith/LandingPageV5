"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { ACT_VIEWPORT_PROFILES } from "./viewportProfiles";
import {
  areCriticalAssetsReady,
  areNearScrollAssetsReady,
  useSceneLoadStore,
} from "@/stores/sceneLoadStore";
import { useCapsStore } from "@/stores/capsStore";

const STABLE_FRAME_THRESHOLD =
  ACT_VIEWPORT_PROFILES[0].fxLayerBehavior.stableFrames;
const AUDIT_STARTUP_WAIT_MS = 120_000;

function resolveStartupWaitMs(defaultMs: number) {
  if (typeof window === "undefined") {
    return defaultMs;
  }

  const search = new URLSearchParams(window.location.search);
  return search.get("audit") === "1" ? AUDIT_STARTUP_WAIT_MS : defaultMs;
}

export function StartupReadinessGate() {
  const stableFrames = useRef(0);
  const intervalStableCount = useRef(0);
  // Track when this gate first started processing frames. Using a local ref
  // rather than startupStartedAt ensures the timeout is relative to when the
  // canvas is actually rendering, not to store or module initialisation time.
  // In dev mode Turbopack JIT-compilation can consume several seconds before
  // the first frame fires, which would prematurely exhaust the startup budget.
  const gateOpenAt = useRef<number | null>(null);

  // Interval-based parallel path: marks stableFrameReady even when the
  // WebGL/rAF loop is throttled (headless Playwright, background tabs).
  // Runs every 100 ms — semantically "N consecutive calm checks" instead of
  // "N rendered frames". The useFrame path below fires first on real hardware.
  useEffect(() => {
    const id = setInterval(() => {
      const state = useSceneLoadStore.getState();
      const capsState = useCapsStore.getState();
      const auditMode =
        typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).get("audit") === "1";

      if (state.stableFrameReady || state.hasFallbackTriggered) {
        clearInterval(id);
        return;
      }

      const MAX_MS = resolveStartupWaitMs(
        capsState.caps?.budgets.loadTimeMs ?? 6000
      );
      if (gateOpenAt.current === null) gateOpenAt.current = Date.now();
      const elapsed = Date.now() - gateOpenAt.current;

      const startupPipelineReady =
        areCriticalAssetsReady(state) &&
        areNearScrollAssetsReady(state) &&
        state.assetManifestReady &&
        state.warmupReady &&
        state.compileReady;

      if (!startupPipelineReady) {
        intervalStableCount.current = 0;
        if (elapsed > MAX_MS) {
          state.markFallbackTriggered();
          clearInterval(id);
        }
        return;
      }

      if (auditMode) {
        state.markStableFrameReady();
        clearInterval(id);
        return;
      }

      intervalStableCount.current += 1;
      if (intervalStableCount.current >= STABLE_FRAME_THRESHOLD) {
        state.markStableFrameReady();
        clearInterval(id);
      } else if (elapsed > MAX_MS + 2000) {
        state.markFallbackTriggered();
        clearInterval(id);
      }
    }, 50);

    return () => clearInterval(id);
  }, []);

  useFrame(() => {
    const state = useSceneLoadStore.getState();
    const capsState = useCapsStore.getState();
    const auditMode =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("audit") === "1";
    const MAX_STARTUP_WAIT_MS = resolveStartupWaitMs(
      capsState.caps?.budgets.loadTimeMs ?? 6000
    );

    if (state.stableFrameReady || state.hasFallbackTriggered) return;

    if (gateOpenAt.current === null) {
      gateOpenAt.current = Date.now();
    }
    const elapsed = Date.now() - gateOpenAt.current;

    const startupPipelineReady =
      areCriticalAssetsReady(state) &&
      areNearScrollAssetsReady(state) &&
      state.assetManifestReady &&
      state.warmupReady &&
      state.compileReady;

    if (!startupPipelineReady) {
      if (elapsed > MAX_STARTUP_WAIT_MS) {
        console.warn(
          "[StartupReadinessGate] Startup pipeline timed out, enforcing fallback."
        );
        state.markFallbackTriggered();
      }
      stableFrames.current = 0;
      return;
    }

    if (auditMode) {
      state.markStableFrameReady();
      return;
    }

    stableFrames.current += 1;
    if (stableFrames.current >= STABLE_FRAME_THRESHOLD) {
      state.markStableFrameReady();
    } else if (elapsed > MAX_STARTUP_WAIT_MS + 2000) {
      console.warn("[StartupReadinessGate] Stable frames timed out, enforcing fallback.");
      state.markFallbackTriggered();
    }
  });

  return null;
}
