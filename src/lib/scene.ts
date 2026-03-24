import { useMemo } from "react";
import * as THREE from "three";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
import type { CameraPose, Vec3Tuple } from "@/canvas/viewportProfiles";

export interface SceneBounds {
  box: THREE.Box3;
  center: THREE.Vector3;
  size: THREE.Vector3;
  height: number;
  width: number;
  depth: number;
  radius: number;
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
