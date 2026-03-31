"use client";

import * as THREE from "three";
import { computeActPresence, computeCrossfadeBlend } from "@/lib/transition";
import { resolveMountedActs } from "./runtimeMounting";
import { WORLD_PHASES } from "./viewportProfiles";
import {
  createWorldMotionSnapshot,
  type WorldMotionSnapshot,
} from "./worldMotion";

export const WARMUP_CHECKPOINT_PROGRESS = [
  0.04,
  0.22,
  0.38,
  0.54,
  0.71,
  0.88,
  0.96,
] as const;

const ENTRY_WARMUP_PROGRESS = [0.22] as const;
const READINESS_WARMUP_PROGRESS = [0.22, 0.54, 0.71, 0.88] as const;
const DEFERRED_WARMUP_PROGRESS = [0.38, 0.54, 0.71, 0.88] as const;
const REQUIRED_CHECKPOINT_PROGRESS_BY_ACT = [
  [],
  [0.22],
  [0.38],
  [0.54],
  [0.71],
  [0.88],
] as const;
const NUM_ACTS = WORLD_PHASES.length;
const PHASE_FOCUS_LOOKAHEAD = 0.015;

const positionCurve = new THREE.CatmullRomCurve3(
  WORLD_PHASES.map(
    (phase) => new THREE.Vector3(...phase.cameraRailSegment.position)
  ),
  true,
  "catmullrom",
  0.5
);

const lookAtCurve = new THREE.CatmullRomCurve3(
  WORLD_PHASES.map((phase) => new THREE.Vector3(...phase.cameraRailSegment.lookAt)),
  true,
  "catmullrom",
  0.5
);

export interface WarmupCheckpointDescriptor {
  id: string;
  progress: number;
  activeAct: number;
  nextAct: number;
  actProgress: number;
  coverageActIndices: number[];
  mountedActIndices: number[];
  snapshot: WorldMotionSnapshot;
  camera: {
    position: THREE.Vector3;
    lookAt: THREE.Vector3;
    fov: number;
  };
}

function resolvePhaseProgress(progress: number) {
  const clamped = THREE.MathUtils.clamp(progress, 0, 1);
  const scaled = clamped * NUM_ACTS;
  const activeAct = Math.min(Math.floor(scaled), NUM_ACTS - 1);
  const actProgress = scaled - activeAct;
  const nextAct = (activeAct + 1) % NUM_ACTS;

  return {
    progress: clamped,
    activeAct,
    nextAct,
    actProgress,
  };
}

function buildSnapshot(progress: number) {
  const snapshot = createWorldMotionSnapshot();
  const { activeAct, nextAct, actProgress } = resolvePhaseProgress(progress);
  const currentProfile = WORLD_PHASES[activeAct];
  const nextProfile = WORLD_PHASES[nextAct];
  const currentWeight = computeActPresence(actProgress, currentProfile.transitionRig);
  const crossfade = computeCrossfadeBlend(actProgress, currentProfile.transitionRig);
  const rebirthBlend =
    activeAct === NUM_ACTS - 1
      ? THREE.MathUtils.smoothstep(
          actProgress,
          currentProfile.transitionRig.rebirth,
          1
        )
      : 0;

  snapshot.activeAct = activeAct;
  snapshot.nextAct = nextAct;
  snapshot.metricActIndex =
    activeAct === NUM_ACTS - 1 && rebirthBlend > 0.46 ? 0 : activeAct;
  snapshot.phaseBlend = actProgress;
  snapshot.rebirthBlend = rebirthBlend;
  snapshot.weights.fill(0);
  snapshot.weights[activeAct] = currentWeight;
  snapshot.weights[nextAct] = crossfade;
  if (activeAct === NUM_ACTS - 1) {
    snapshot.weights[0] += rebirthBlend;
  }

  snapshot.worldAnchor.set(
    THREE.MathUtils.lerp(
      currentProfile.worldAnchor[0],
      nextProfile.worldAnchor[0],
      actProgress
    ),
    THREE.MathUtils.lerp(
      currentProfile.worldAnchor[1],
      nextProfile.worldAnchor[1],
      actProgress
    ),
    THREE.MathUtils.lerp(
      currentProfile.worldAnchor[2],
      nextProfile.worldAnchor[2],
      actProgress
    )
  );
  snapshot.pointerOffset.set(0, 0, 0);

  return snapshot;
}

function buildCamera(progress: number) {
  const { activeAct, actProgress } = resolvePhaseProgress(progress);
  const exactIndex = progress * NUM_ACTS;
  const leftIndex = Math.floor(exactIndex) % NUM_ACTS;
  const rightIndex = (leftIndex + 1) % NUM_ACTS;
  const localT = exactIndex - Math.floor(exactIndex);

  return {
    position: positionCurve.getPointAt(progress),
    lookAt: lookAtCurve.getPointAt((progress + PHASE_FOCUS_LOOKAHEAD) % 1),
    fov: THREE.MathUtils.lerp(
      WORLD_PHASES[leftIndex].cameraRailSegment.fov,
      WORLD_PHASES[rightIndex].cameraRailSegment.fov,
      localT
    ),
    activeAct,
    actProgress,
  };
}

function resolveCoverageActIndices(snapshot: WorldMotionSnapshot) {
  return snapshot.weights.flatMap((weight, actIndex) =>
    weight > 0.01 ? [actIndex] : []
  );
}

function buildCheckpoint(progress: number): WarmupCheckpointDescriptor {
  const phase = resolvePhaseProgress(progress);
  const snapshot = buildSnapshot(progress);
  const camera = buildCamera(phase.progress);

  return {
    id: `cp-${progress.toFixed(2)}`,
    progress: phase.progress,
    activeAct: phase.activeAct,
    nextAct: phase.nextAct,
    actProgress: phase.actProgress,
    coverageActIndices: resolveCoverageActIndices(snapshot),
    mountedActIndices: resolveMountedActs({
      activeAct: phase.activeAct,
      totalActs: NUM_ACTS,
      warmupActIndex: null,
      warmupReady: true,
      rebirthBlend: snapshot.rebirthBlend,
      lookahead: 1,
    }),
    snapshot,
    camera: {
      position: camera.position,
      lookAt: camera.lookAt,
      fov: camera.fov,
    },
  };
}

export const WARMUP_CHECKPOINTS = WARMUP_CHECKPOINT_PROGRESS.map(buildCheckpoint);

export const WARMUP_CHECKPOINTS_BY_ID = Object.fromEntries(
  WARMUP_CHECKPOINTS.map((checkpoint) => [checkpoint.id, checkpoint])
) as Record<string, WarmupCheckpointDescriptor>;

export const ENTRY_WARMUP_CHECKPOINT_QUEUE = ENTRY_WARMUP_PROGRESS.map(
  (progress) => WARMUP_CHECKPOINTS_BY_ID[`cp-${progress.toFixed(2)}`]
);

export const READINESS_WARMUP_CHECKPOINT_QUEUE = READINESS_WARMUP_PROGRESS.map(
  (progress) => WARMUP_CHECKPOINTS_BY_ID[`cp-${progress.toFixed(2)}`]
);

export const DEFERRED_WARMUP_CHECKPOINT_QUEUE = DEFERRED_WARMUP_PROGRESS.map(
  (progress) => WARMUP_CHECKPOINTS_BY_ID[`cp-${progress.toFixed(2)}`]
);

export const WARMUP_CHECKPOINT_QUEUE = WARMUP_CHECKPOINT_PROGRESS.map(
  (progress) => WARMUP_CHECKPOINTS_BY_ID[`cp-${progress.toFixed(2)}`]
);

export const REQUIRED_CHECKPOINT_IDS_BY_ACT = REQUIRED_CHECKPOINT_PROGRESS_BY_ACT.map(
  (requiredProgresses) =>
    requiredProgresses.map(
      (progress) => WARMUP_CHECKPOINTS_BY_ID[`cp-${progress.toFixed(2)}`].id
    )
);

export function getWarmupCheckpointDescriptor(checkpointId: string) {
  return WARMUP_CHECKPOINTS_BY_ID[checkpointId] ?? null;
}
