import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";

export interface PreparedSceneLease<TObject extends THREE.Object3D, TMeta> {
  object: TObject;
  meta: TMeta;
}

interface PreparedScenePoolEntry<TObject extends THREE.Object3D, TMeta> {
  sourceUuid: string;
  available: Array<PreparedSceneLease<TObject, TMeta>>;
}

const preparedScenePools = new Map<
  string,
  PreparedScenePoolEntry<THREE.Object3D, unknown>
>();

function createPreparedSceneLease<TObject extends THREE.Object3D, TMeta>(
  source: TObject,
  prepare: (clone: TObject) => TMeta
): PreparedSceneLease<TObject, TMeta> {
  const object = cloneSkeleton(source) as TObject;
  object.updateMatrixWorld(true);
  return {
    object,
    meta: prepare(object),
  };
}

function getPreparedScenePool<TObject extends THREE.Object3D, TMeta>(
  cacheKey: string,
  source: TObject
): PreparedScenePoolEntry<TObject, TMeta> {
  const cachedEntry = preparedScenePools.get(cacheKey) as
    | PreparedScenePoolEntry<TObject, TMeta>
    | undefined;

  if (cachedEntry && cachedEntry.sourceUuid === source.uuid) {
    return cachedEntry;
  }

  const nextEntry: PreparedScenePoolEntry<TObject, TMeta> = {
    sourceUuid: source.uuid,
    available: [],
  };
  preparedScenePools.set(
    cacheKey,
    nextEntry as PreparedScenePoolEntry<THREE.Object3D, unknown>
  );
  return nextEntry;
}

export function primePreparedSceneLease<TObject extends THREE.Object3D, TMeta>(
  cacheKey: string,
  source: TObject,
  prepare: (clone: TObject) => TMeta
): PreparedSceneLease<TObject, TMeta> {
  const pool = getPreparedScenePool<TObject, TMeta>(cacheKey, source);

  if (pool.available.length === 0) {
    pool.available.push(createPreparedSceneLease(source, prepare));
  }

  return pool.available[0];
}

export function acquirePreparedSceneLease<TObject extends THREE.Object3D, TMeta>(
  cacheKey: string,
  source: TObject,
  prepare: (clone: TObject) => TMeta
): PreparedSceneLease<TObject, TMeta> {
  const pool = getPreparedScenePool<TObject, TMeta>(cacheKey, source);
  return pool.available.pop() ?? createPreparedSceneLease(source, prepare);
}

export function releasePreparedSceneLease<TObject extends THREE.Object3D, TMeta>(
  cacheKey: string,
  source: TObject,
  lease: PreparedSceneLease<TObject, TMeta>
) {
  const pool = getPreparedScenePool<TObject, TMeta>(cacheKey, source);
  pool.available.push(lease);
}

export function usePreparedSceneLease<TObject extends THREE.Object3D, TMeta>(
  cacheKey: string,
  source: TObject,
  prepare: (clone: TObject) => TMeta
): PreparedSceneLease<TObject, TMeta> {
  const lease = useMemo(
    () => acquirePreparedSceneLease(cacheKey, source, prepare),
    [cacheKey, prepare, source]
  );

  useEffect(
    () => () => releasePreparedSceneLease(cacheKey, source, lease),
    [cacheKey, lease, source]
  );

  return lease;
}
