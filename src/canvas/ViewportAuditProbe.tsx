"use client";

import { useEffect, useEffectEvent, useMemo, useRef } from "react";
import * as THREE from "three";
import { addAfterEffect, addEffect, useFrame, useThree } from "@react-three/fiber";
import { useViewportAuditStore } from "@/stores/viewportAuditStore";
import { useCapsStore } from "@/stores/capsStore";
import { useSceneLoadStore } from "@/stores/sceneLoadStore";
import { useScrollStore } from "@/stores/scrollStore";

const MAX_SAMPLES = 600;
const PUBLISH_EVERY_FRAMES = 12;

type RenderableObject = THREE.Object3D & {
  isMesh?: boolean;
  isPoints?: boolean;
  isLine?: boolean;
  geometry?: THREE.BufferGeometry;
  material?: THREE.Material | THREE.Material[];
  frustumCulled?: boolean;
};

type InspectableMaterial = THREE.Material & {
  wireframe?: boolean;
};

function pushSample(samples: number[], value: number) {
  if (samples.length >= MAX_SAMPLES) {
    samples.shift();
  }
  samples.push(value);
}

function mean(samples: number[]): number {
  if (samples.length === 0) {
    return 0;
  }

  return samples.reduce((sum, sample) => sum + sample, 0) / samples.length;
}

function percentile(samples: number[], ratio: number): number {
  if (samples.length === 0) {
    return 0;
  }

  const sorted = [...samples].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * ratio))];
}

export function ViewportAuditProbe() {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const enabled = useMemo(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("audit") === "1",
    []
  );
  const cpuSamplesRef = useRef<number[]>([]);
  const deltaSamplesRef = useRef<number[]>([]);
  const frameStartRef = useRef(0);
  const frameCountRef = useRef(0);

  const publishTelemetry = useEffectEvent(() => {
    if (!enabled) {
      return;
    }

    const loadState = useSceneLoadStore.getState();
    const capsState = useCapsStore.getState();
    useViewportAuditStore.getState().reportTelemetry({
      hasFallbackTriggered: loadState.hasFallbackTriggered,
      startupTimeMs: loadState.stableFrameReady
        ? Date.now() - loadState.startupStartedAt
        : null,
      safeModeReason: (() => {
        if (typeof window === "undefined") return null;
        const urlSafeMode = new URLSearchParams(window.location.search).get(
          "safeMode"
        );
        if (urlSafeMode === "1") return "url_flag";
        const storedSafeMode = window.localStorage.getItem("lpv5-safe-mode");
        if (storedSafeMode === "1") return "stored_flag";
        if (loadState.hasFallbackTriggered) return "timeout";
        return null;
      })(),
      tier: capsState.caps?.tier ?? null,
    });

    if (!loadState.hasFallbackTriggered) {
      const meanMs = mean(deltaSamplesRef.current);
      if (capsState.caps && meanMs > capsState.caps.budgets.frameTimeMs * 1.5) {
        console.warn(
          `[Phase D Audit] Performance below budget threshold. Mean: ${meanMs.toFixed(2)}ms (Budget: ${capsState.caps.budgets.frameTimeMs}ms)`
        );
      }
    }
  });

  const publishMetrics = useEffectEvent(() => {
    if (!enabled || deltaSamplesRef.current.length === 0) {
      return;
    }

    const renderInfo = gl.info.render;
    const memoryInfo = gl.info.memory;
    const programsInfo = (gl.info as unknown as { programs?: unknown[] }).programs;

    useViewportAuditStore.getState().reportRenderPipeline({
      samples: deltaSamplesRef.current.length,
      meanCpuMs: mean(cpuSamplesRef.current),
      p95CpuMs: percentile(cpuSamplesRef.current, 0.95),
      maxCpuMs: percentile(cpuSamplesRef.current, 1),
      meanDeltaMs: mean(deltaSamplesRef.current),
      p95DeltaMs: percentile(deltaSamplesRef.current, 0.95),
      maxDeltaMs: percentile(deltaSamplesRef.current, 1),
      over33DeltaMs: deltaSamplesRef.current.filter((sample) => sample > 33).length,
      over50DeltaMs: deltaSamplesRef.current.filter((sample) => sample > 50).length,
      over100DeltaMs: deltaSamplesRef.current.filter((sample) => sample > 100).length,
      renderer: {
        frame: renderInfo.frame,
        calls: renderInfo.calls,
        triangles: renderInfo.triangles,
        points: renderInfo.points,
        lines: renderInfo.lines,
        geometries: memoryInfo.geometries,
        textures: memoryInfo.textures,
        programs: Array.isArray(programsInfo) ? programsInfo.length : 0,
      },
    });
    publishTelemetry();
  });

  useFrame((_, delta) => {
    if (!enabled) {
      return;
    }

    pushSample(deltaSamplesRef.current, delta * 1000);
    frameCountRef.current += 1;
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const stopBeforeRender = addEffect(() => {
      frameStartRef.current = performance.now();
    });

    const stopAfterRender = addAfterEffect(() => {
      pushSample(cpuSamplesRef.current, performance.now() - frameStartRef.current);

      if (frameCountRef.current % PUBLISH_EVERY_FRAMES === 0) {
        publishMetrics();
      }
    });

    return () => {
      publishMetrics();
      stopAfterRender();
      stopBeforeRender();
    };
  }, [enabled]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const telemetryWindow = window as Window & {
      __R3F_TELEMETRY?: () => unknown;
    };

    telemetryWindow.__R3F_TELEMETRY = () => {
      const renderInfo = gl.info.render;
      const memoryInfo = gl.info.memory;
      const programsInfo = (gl.info as unknown as { programs?: unknown[] }).programs;

      const meshes: Array<Record<string, unknown>> = [];
      scene.traverse((node) => {
        const child = node as RenderableObject;
        if (child.isMesh || child.isPoints || child.isLine) {
          let bboxData = null;
          if (child.geometry) {
            if (!child.geometry.boundingBox) {
              child.geometry.computeBoundingBox();
            }
            if (child.geometry.boundingBox) {
              const bbox = child.geometry.boundingBox.clone();
              bbox.applyMatrix4(child.matrixWorld);
              bboxData = {
                min: bbox.min.toArray(),
                max: bbox.max.toArray(),
              };
            }
          }

          const processMaterial = (mat: InspectableMaterial) => ({
            type: mat.type,
            transparent: mat.transparent,
            opacity: mat.opacity,
            blending: mat.blending,
            depthWrite: mat.depthWrite,
            depthTest: mat.depthTest,
            wireframe: mat.wireframe,
            side: mat.side,
            visible: mat.visible,
          });

          const materialsInfo = child.material
            ? Array.isArray(child.material)
              ? child.material.map(processMaterial)
              : [processMaterial(child.material)]
            : [];

          meshes.push({
            name: child.name || "Unnamed",
            type: child.type,
            uuid: child.uuid,
            visible: child.visible,
            renderOrder: child.renderOrder,
            position: child.getWorldPosition(new THREE.Vector3()).toArray(),
            materials: materialsInfo,
            boundingBox: bboxData,
            frustumCulled: child.frustumCulled,
          });
        }
      });

      const scrollState = useScrollStore.getState();

      return {
        gl: {
          render: {
            calls: renderInfo.calls,
            triangles: renderInfo.triangles,
            points: renderInfo.points,
            lines: renderInfo.lines,
          },
          memory: {
            geometries: memoryInfo.geometries,
            textures: memoryInfo.textures,
          },
          programs: Array.isArray(programsInfo) ? programsInfo.length : 0,
        },
        scroll: {
          progress: scrollState.progress,
          activeAct: scrollState.activeAct,
          actProgress: scrollState.actProgress,
        },
        meshes,
      };
    };

    return () => {
      delete telemetryWindow.__R3F_TELEMETRY;
    };
  }, [gl, scene]);

  return null;
}
