"use client";

import { useEffect, useEffectEvent, useMemo, useRef } from "react";
import { addAfterEffect, addEffect, useFrame, useThree } from "@react-three/fiber";
import { useViewportAuditStore } from "@/stores/viewportAuditStore";

const MAX_SAMPLES = 600;
const PUBLISH_EVERY_FRAMES = 12;

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

  return null;
}
