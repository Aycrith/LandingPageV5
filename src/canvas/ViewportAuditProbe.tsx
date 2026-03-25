"use client";

import { useEffect, useEffectEvent, useMemo, useRef } from "react";
import * as THREE from "three";
import { addAfterEffect, addEffect, useThree } from "@react-three/fiber";
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

interface RendererSnapshot {
  frame: number;
  calls: number;
  triangles: number;
  points: number;
  lines: number;
  geometries: number;
  textures: number;
  programs: number;
}

interface CompositionSnapshot {
  visibleMeshCount: number;
  transparentMeshCount: number;
  additiveMeshCount: number;
  linesCount: number;
  pointsCount: number;
}

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

function collectMeshSnapshot(scene: THREE.Scene) {
  const meshes: Array<Record<string, unknown>> = [];
  const composition: CompositionSnapshot = {
    visibleMeshCount: 0,
    transparentMeshCount: 0,
    additiveMeshCount: 0,
    linesCount: 0,
    pointsCount: 0,
  };

  scene.traverse((node) => {
    const child = node as RenderableObject;
    if (!(child.isMesh || child.isPoints || child.isLine) || !child.visible) {
      return;
    }

    composition.visibleMeshCount += 1;
    if (child.isPoints) {
      composition.pointsCount += 1;
    }
    if (child.isLine) {
      composition.linesCount += 1;
    }

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

    const processMaterial = (material: InspectableMaterial) => {
      if (material.transparent && material.opacity > 0.01) {
        composition.transparentMeshCount += 1;
      }
      if (material.blending === THREE.AdditiveBlending && material.opacity > 0.01) {
        composition.additiveMeshCount += 1;
      }

      return {
        type: material.type,
        transparent: material.transparent,
        opacity: material.opacity,
        blending: material.blending,
        depthWrite: material.depthWrite,
        depthTest: material.depthTest,
        wireframe: material.wireframe,
        side: material.side,
        visible: material.visible,
      };
    };

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
  });

  return { meshes, composition };
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
  const lastFrameAtRef = useRef<number | null>(null);
  const frameCountRef = useRef(0);
  const latestRendererRef = useRef<RendererSnapshot>({
    frame: 0,
    calls: 0,
    triangles: 0,
    points: 0,
    lines: 0,
    geometries: 0,
    textures: 0,
    programs: 0,
  });
  const latestCompositionRef = useRef<CompositionSnapshot>({
    visibleMeshCount: 0,
    transparentMeshCount: 0,
    additiveMeshCount: 0,
    linesCount: 0,
    pointsCount: 0,
  });

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
  });

  const publishMetrics = useEffectEvent(() => {
    if (!enabled || deltaSamplesRef.current.length === 0) {
      return;
    }

    const { composition } = collectMeshSnapshot(scene);
    latestCompositionRef.current = composition;
    useViewportAuditStore.getState().reportComposition(composition);
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
      renderer: latestRendererRef.current,
    });
    publishTelemetry();
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const stopBeforeRender = addEffect(() => {
      frameStartRef.current = performance.now();
    });

    const stopAfterRender = addAfterEffect(() => {
      const frameEndedAt = performance.now();
      pushSample(cpuSamplesRef.current, frameEndedAt - frameStartRef.current);
      if (lastFrameAtRef.current !== null) {
        pushSample(deltaSamplesRef.current, frameEndedAt - lastFrameAtRef.current);
      }
      lastFrameAtRef.current = frameEndedAt;
      frameCountRef.current += 1;

      const renderInfo = gl.info.render;
      const memoryInfo = gl.info.memory;
      const programsInfo = (gl.info as unknown as { programs?: unknown[] }).programs;

      latestRendererRef.current = {
        frame: renderInfo.frame,
        calls: renderInfo.calls,
        triangles: renderInfo.triangles,
        points: renderInfo.points,
        lines: renderInfo.lines,
        geometries: memoryInfo.geometries,
        textures: memoryInfo.textures,
        programs: Array.isArray(programsInfo) ? programsInfo.length : 0,
      };

      if (frameCountRef.current % PUBLISH_EVERY_FRAMES === 0) {
        publishMetrics();
      }
    });

    return () => {
      publishMetrics();
      stopAfterRender();
      stopBeforeRender();
    };
  }, [enabled, gl, publishMetrics]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const telemetryWindow = window as Window & {
      __R3F_TELEMETRY?: () => unknown;
    };

    telemetryWindow.__R3F_TELEMETRY = () => {
      const meshSnapshot = collectMeshSnapshot(scene);
      const scrollState = useScrollStore.getState();
      const metrics = useViewportAuditStore.getState();

      return {
        renderer: latestRendererRef.current,
        composition: latestCompositionRef.current,
        sceneState: metrics.sceneState,
        scroll: {
          progress: scrollState.progress,
          activeAct: scrollState.activeAct,
          actProgress: scrollState.actProgress,
        },
        meshes: meshSnapshot.meshes,
      };
    };

    return () => {
      delete telemetryWindow.__R3F_TELEMETRY;
    };
  }, [scene]);

  return null;
}
