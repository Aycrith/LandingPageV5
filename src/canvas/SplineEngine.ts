import * as THREE from "three";
import { ACT_VIEWPORT_PROFILES, type Vec3Tuple } from "./viewportProfiles";

function vec3(t: Vec3Tuple): THREE.Vector3 {
  return new THREE.Vector3(t[0], t[1], t[2]);
}

/**
 * Unified spline that stitches all per-act camera paths into one
 * continuous CatmullRomCurve3, forming a closed loop for infinite scrolling.
 *
 * The last act's end merges back into the first act's start so the user
 * can scroll endlessly.  The engine exposes a single `sample(t)` method
 * where `t ∈ (-∞, +∞)` — any value is wrapped modulo 1 automatically.
 */

// Collect every per-act waypoint into two flat arrays
function collectWaypoints(): {
  positions: THREE.Vector3[];
  lookAts: THREE.Vector3[];
  fovs: number[];
} {
  const positions: THREE.Vector3[] = [];
  const lookAts: THREE.Vector3[] = [];
  const fovs: number[] = [];

  for (const profile of ACT_VIEWPORT_PROFILES) {
    const path = profile.cameraPath;
    for (let i = 0; i < path.positions.length; i++) {
      positions.push(vec3(path.positions[i]));
      lookAts.push(vec3(path.lookAts[i]));
      fovs.push(path.fovs[i]);
    }
  }

  return { positions, lookAts, fovs };
}

export interface SplineSample {
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
  fov: number;
  /** Canonical progress in [0,1) after wrapping */
  canonical: number;
  /** Which act this position falls within (0..NUM_ACTS-1) */
  actIndex: number;
  /** Local progress within that act (0..1) */
  actProgress: number;
}

const NUM_ACTS = ACT_VIEWPORT_PROFILES.length;

export class SplineEngine {
  readonly posCurve: THREE.CatmullRomCurve3;
  readonly lookCurve: THREE.CatmullRomCurve3;
  readonly fovs: number[];
  readonly totalWaypoints: number;
  /** How many waypoints per act (assumed uniform for simplicity) */
  readonly waypointsPerAct: number;

  constructor() {
    const { positions, lookAts, fovs } = collectWaypoints();
    this.totalWaypoints = positions.length;
    this.waypointsPerAct = Math.ceil(this.totalWaypoints / NUM_ACTS);
    this.fovs = fovs;

    // Closed loop — CatmullRom automatically wraps
    this.posCurve = new THREE.CatmullRomCurve3(positions, true, "centripetal");
    this.lookCurve = new THREE.CatmullRomCurve3(lookAts, true, "centripetal");
  }

  /** Wrap any real-valued `t` into [0, 1) */
  private wrap(t: number): number {
    const m = t % 1;
    return m < 0 ? m + 1 : m;
  }

  /** Sample the unified spline at any real-valued `t`. */
  sample(t: number): SplineSample {
    const canonical = this.wrap(t);

    const position = this.posCurve.getPointAt(canonical);
    const lookAt = this.lookCurve.getPointAt(canonical);

    // Interpolate FOV
    const fovT = canonical * (this.fovs.length - 1);
    const fovIdx = Math.min(Math.floor(fovT), this.fovs.length - 2);
    const fovFrac = fovT - fovIdx;
    const fov = THREE.MathUtils.lerp(this.fovs[fovIdx], this.fovs[fovIdx + 1], fovFrac);

    // Determine act
    const actFloat = canonical * NUM_ACTS;
    const actIndex = Math.min(Math.floor(actFloat), NUM_ACTS - 1);
    const actProgress = actFloat - actIndex;

    const result: SplineSample = {
      position,
      lookAt,
      fov,
      canonical,
      actIndex,
      actProgress,
    };

    return result;
  }
}

/** Singleton — created once, reused everywhere */
let _instance: SplineEngine | null = null;
export function getSplineEngine(): SplineEngine {
  if (!_instance) _instance = new SplineEngine();
  return _instance;
}
