"use client";

import {
  createContext,
  useContext,
  type MutableRefObject,
  type ReactNode,
} from "react";
import * as THREE from "three";

export interface WorldMotionSnapshot {
  activeAct: number;
  nextAct: number;
  metricActIndex: number;
  phaseBlend: number;
  rebirthBlend: number;
  weights: number[];
  worldAnchor: THREE.Vector3;
  pointerOffset: THREE.Vector3;
}

export type WorldMotionRef = MutableRefObject<WorldMotionSnapshot>;

const WorldMotionContext = createContext<WorldMotionRef | null>(null);

export function createWorldMotionSnapshot(): WorldMotionSnapshot {
  return {
    activeAct: 0,
    nextAct: 1,
    metricActIndex: 0,
    phaseBlend: 0,
    rebirthBlend: 0,
    weights: [1, 0, 0, 0, 0, 0],
    worldAnchor: new THREE.Vector3(),
    pointerOffset: new THREE.Vector3(),
  };
}

export function copyWorldMotionSnapshot(
  target: WorldMotionSnapshot,
  source: WorldMotionSnapshot
) {
  target.activeAct = source.activeAct;
  target.nextAct = source.nextAct;
  target.metricActIndex = source.metricActIndex;
  target.phaseBlend = source.phaseBlend;
  target.rebirthBlend = source.rebirthBlend;

  for (let index = 0; index < source.weights.length; index += 1) {
    target.weights[index] = source.weights[index] ?? 0;
  }
  target.weights.length = source.weights.length;
  target.worldAnchor.copy(source.worldAnchor);
  target.pointerOffset.copy(source.pointerOffset);
}

export function WorldMotionProvider({
  motionRef,
  children,
}: {
  motionRef: WorldMotionRef;
  children: ReactNode;
}) {
  return (
    <WorldMotionContext.Provider value={motionRef}>
      {children}
    </WorldMotionContext.Provider>
  );
}

export function useWorldMotionRef(): WorldMotionRef {
  const motionRef = useContext(WorldMotionContext);

  if (!motionRef) {
    throw new Error("World motion context is not available.");
  }

  return motionRef;
}

export function getActWeight(
  snapshot: WorldMotionSnapshot,
  actIndex: number
): number {
  return snapshot.weights[actIndex] ?? 0;
}

export function isActVisible(
  snapshot: WorldMotionSnapshot,
  actIndex: number,
  threshold = 0.01
): boolean {
  return getActWeight(snapshot, actIndex) > threshold;
}
