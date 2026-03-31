"use client";

import { useEffect, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { ACESFilmicToneMapping } from "three";
import { Stats, OrbitControls } from "@react-three/drei";
import { SceneManager } from "./SceneManager";
import { CameraRig } from "./camera/CameraRig";
import { PostProcessingStack } from "./postfx/PostProcessingStack";
import { StartupReadinessGate } from "./StartupReadinessGate";
import { SceneStartupController } from "./SceneStartupController";
import { SceneWarmupHost } from "./SceneWarmupHost";
import { ShaderWarmupHost } from "./ShaderWarmupHost";
import { ViewportAuditProbe } from "./ViewportAuditProbe";
import { PostFxErrorBoundary } from "./CanvasErrorBoundary";
import { ACT_VIEWPORT_PROFILES } from "./viewportProfiles";
import {
  useCapsStore,
  detectCapabilities,
} from "@/stores/capsStore";
import { useUIStore } from "@/stores/uiStore";
import {
  getSceneStartupProgress,
  isSceneStartupReady,
  useSceneLoadStore,
} from "@/stores/sceneLoadStore";
import { useViewportAuditStore } from "@/stores/viewportAuditStore";
import { SceneDigest } from "./SceneDigest";

const STARTUP_PROFILE = ACT_VIEWPORT_PROFILES[0];

export default function Experience() {
  const caps = useCapsStore((s) => s.caps);
  const setCaps = useCapsStore((s) => s.setCaps);
  const resetViewportAudit = useViewportAuditStore((s) => s.reset);
  const startupStartedAt = useSceneLoadStore((s) => s.startupStartedAt);
  const startupProgress = useSceneLoadStore(getSceneStartupProgress);
  const startupReady = useSceneLoadStore(isSceneStartupReady);
  const hasFallbackTriggered = useSceneLoadStore((s) => s.hasFallbackTriggered);

  useEffect(() => {
    useUIStore.getState().reset();
    useSceneLoadStore.getState().resetStartup();
    const detected = detectCapabilities();
    setCaps(detected);
    resetViewportAudit();
    useUIStore.getState().setLoadProgress(0);
  }, [resetViewportAudit, setCaps]);

  useEffect(() => {
    useUIStore.getState().setLoadProgress(startupProgress);
  }, [startupProgress]);

  useEffect(() => {
    if (!startupReady) return;

    const elapsed = Date.now() - startupStartedAt;
    const remaining = Math.max(
      STARTUP_PROFILE.fxLayerBehavior.minimumVeilMs - elapsed,
      0
    );

    const timer = window.setTimeout(() => {
      useSceneLoadStore.getState().markStartupReady();
      useUIStore.getState().setLoadProgress(1);
      useUIStore.getState().setReady();
    }, remaining);

    return () => clearTimeout(timer);
  }, [startupReady, startupStartedAt]);

  const debugMode = useMemo(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("debug") === "1",
    []
  );
  const auditMode = useMemo(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("audit") === "1",
    []
  );
  const safeModeRequested = useMemo(() => {
    if (typeof window === "undefined") {
      return false;
    }

    const search = new URLSearchParams(window.location.search);
    return search.get("safeMode") === "1" || window.localStorage.getItem("lpv5-safe-mode") === "1";
  }, []);

  useEffect(() => {
    if ((!hasFallbackTriggered && !safeModeRequested) || !caps) {
      return;
    }

    useSceneLoadStore.getState().markStartupReady();
    useUIStore.getState().setLoadProgress(1);
    useUIStore.getState().setReady();
  }, [caps, hasFallbackTriggered, safeModeRequested]);

  if (!caps) return null;

  return (
    <>
      <Canvas
        gl={{
          antialias: caps.tier !== "low",
          alpha: false,
          powerPreference:
            caps.tier === "high" ? "high-performance" : "low-power",
          failIfMajorPerformanceCaveat: false,
          toneMapping: ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
        }}
        dpr={caps.dpr}
        performance={{ min: 0.3, max: 1, debounce: 250 }}
        shadows={caps.enableShadows ? "percentage" : false}
        camera={{
          position: STARTUP_PROFILE.previewCamera.position,
          fov: STARTUP_PROFILE.previewCamera.fov,
          near: 0.1,
          far: 200,
        }}
        style={{ background: "#020405" }}
        onCreated={(state) => {
          if (state.gl.getContext().isContextLost()) {
            useSceneLoadStore.getState().markFallbackTriggered();
          }
        }}
      >
        <SceneStartupController />
        {auditMode ? <ShaderWarmupHost /> : null}
        {auditMode ? <SceneWarmupHost /> : null}
        <StartupReadinessGate />
        {auditMode ? <ViewportAuditProbe /> : null}
        {process.env.NODE_ENV === "development" && <SceneDigest />}
        <CameraRig />
        {!hasFallbackTriggered && (
          <>
            <SceneManager />
            <PostFxErrorBoundary>
              <PostProcessingStack />
            </PostFxErrorBoundary>
          </>
        )}
        {debugMode && (
          <>
            <Stats />
            <OrbitControls makeDefault={false} />
          </>
        )}
      </Canvas>
      {hasFallbackTriggered ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#050507",
            color: "#666",
            fontSize: "0.8rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Visuals limited (Safe Mode)
        </div>
      ) : null}
    </>
  );
}
