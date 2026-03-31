import { useMemo } from "react";
import * as THREE from "three";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
import type { CameraPose, Vec3Tuple } from "@/canvas/viewportProfiles";
import type { Budgets, QualityTier } from "@/stores/capsStore";

export interface SceneBounds {
  box: THREE.Box3;
  center: THREE.Vector3;
  size: THREE.Vector3;
  height: number;
  width: number;
  depth: number;
  radius: number;
}

export type DetailLod = "cinematic" | "balanced" | "streamlined";

export interface RenderBudgetSnapshot {
  estimatedFps: number;
  pressure: "nominal" | "elevated" | "critical";
  score: number;
  within: {
    frameTime: boolean;
    scrollLatency: boolean;
    drawCalls: boolean;
    triangles: boolean;
    geometries: boolean;
    textures: boolean;
    textureMemory: boolean;
    programs: boolean;
    points: boolean;
    jsHeap: boolean;
    longTasks: boolean;
    loadTime: boolean;
  };
  violations: string[];
}

export function tupleToVector3(tuple: Vec3Tuple): THREE.Vector3 {
  return new THREE.Vector3(tuple[0], tuple[1], tuple[2]);
}

export function measureSceneBounds(object: THREE.Object3D): SceneBounds {
  const box = new THREE.Box3().setFromObject(object);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  return {
    box,
    center,
    size,
    height: Math.max(size.y, 0.0001),
    width: Math.max(size.x, 0.0001),
    depth: Math.max(size.z, 0.0001),
    radius: Math.max(size.length() * 0.5, 0.0001),
  };
}

export function useSceneBounds(object: THREE.Object3D): SceneBounds {
  return useMemo(() => measureSceneBounds(object), [object]);
}

export function useStableSceneClone<T extends THREE.Object3D>(object: T): T {
  return useMemo(() => cloneSkeleton(object) as T, [object]);
}

export function getViewportHeightAtDistance(
  distance: number,
  fov: number
): number {
  return 2 * Math.tan(THREE.MathUtils.degToRad(fov) * 0.5) * distance;
}

export function computeViewportFillRatio(
  rawHeight: number,
  appliedScale: number,
  visibleHeight: number
): number {
  return (rawHeight * appliedScale) / Math.max(visibleHeight, 0.0001);
}

export function resolveDetailLod({
  distance,
  fillRatio,
  tier,
  prefersReducedMotion = false,
}: {
  distance: number;
  fillRatio: number;
  tier: QualityTier;
  prefersReducedMotion?: boolean;
}): DetailLod {
  if (prefersReducedMotion || tier === "low") {
    return "streamlined";
  }

  const coverageSignal = THREE.MathUtils.clamp(fillRatio * 2.4, 0, 1.4);
  const distanceSignal = THREE.MathUtils.clamp(1 - distance / 10, 0, 1);
  const emphasis = coverageSignal * 0.72 + distanceSignal * 0.58;

  if (tier === "high") {
    if (emphasis >= 0.9 || fillRatio >= 0.32) {
      return "cinematic";
    }
    if (emphasis >= 0.42 || fillRatio >= 0.16) {
      return "balanced";
    }
    return "streamlined";
  }

  if (emphasis >= 0.58 || fillRatio >= 0.22) {
    return "balanced";
  }

  return "streamlined";
}

function getPoseDistance(pose: CameraPose): number {
  return tupleToVector3(pose.position).distanceTo(tupleToVector3(pose.lookAt));
}

export function getMaxScaleForViewportFill({
  rawHeight,
  maxFill,
  pose,
}: {
  rawHeight: number;
  maxFill: number;
  pose: CameraPose;
}): number {
  const visibleHeight =
    getViewportHeightAtDistance(getPoseDistance(pose), pose.fov) * maxFill;

  return visibleHeight / Math.max(rawHeight, 0.0001);
}

export function fitScaleToViewportFill({
  desiredScale,
  rawHeight,
  maxFill,
  previewCamera,
  settleCamera,
}: {
  desiredScale: number;
  rawHeight: number;
  maxFill: number;
  previewCamera: CameraPose;
  settleCamera: CameraPose;
}): number {
  const previewMaxScale = getMaxScaleForViewportFill({
    rawHeight,
    maxFill,
    pose: previewCamera,
  });
  const settleMaxScale = getMaxScaleForViewportFill({
    rawHeight,
    maxFill,
    pose: settleCamera,
  });

  return Math.min(desiredScale, previewMaxScale, settleMaxScale);
}

export function evaluateRenderBudget({
  budgets,
  meanDeltaMs,
  p95ScrollLatencyMs,
  textureMemoryMB,
  jsHeapMB,
  longTaskCount,
  renderer,
  startupTimeMs,
}: {
  budgets: Budgets;
  meanDeltaMs: number;
  p95ScrollLatencyMs: number;
  textureMemoryMB: number;
  jsHeapMB: number | null;
  longTaskCount: number;
  renderer: {
    calls: number;
    triangles: number;
    points: number;
    geometries: number;
    textures: number;
    programs: number;
  };
  startupTimeMs: number | null;
}): RenderBudgetSnapshot {
  const estimatedFps = meanDeltaMs > 0 ? 1000 / meanDeltaMs : budgets.fps;
  const within = {
    frameTime: meanDeltaMs <= budgets.frameTimeMs,
    scrollLatency: p95ScrollLatencyMs <= budgets.scrollLatencyMs,
    drawCalls: renderer.calls <= budgets.drawCalls,
    triangles: renderer.triangles <= budgets.triangles,
    geometries: renderer.geometries <= budgets.geometries,
    textures: renderer.textures <= budgets.textures,
    textureMemory: textureMemoryMB <= budgets.textureMemoryMB,
    programs: renderer.programs <= budgets.programs,
    points: renderer.points <= budgets.points,
    jsHeap: jsHeapMB == null || jsHeapMB <= budgets.jsHeapMB,
    longTasks: longTaskCount <= budgets.maxLongTasks,
    loadTime: startupTimeMs == null || startupTimeMs <= budgets.loadTimeMs,
  };

  const violations = Object.entries(within)
    .filter(([, isWithin]) => !isWithin)
    .map(([metric]) => metric);
  const score = Math.round(
    (Object.values(within).filter(Boolean).length / Object.values(within).length) *
      100
  );

  return {
    estimatedFps,
    pressure:
      violations.length === 0
        ? "nominal"
        : violations.length <= 2
          ? "elevated"
          : "critical",
    score,
    within,
    violations,
  };
}
