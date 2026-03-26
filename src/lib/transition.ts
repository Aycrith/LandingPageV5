import { MathUtils } from "three";
import type { TransitionRig } from "@/canvas/viewportProfiles";

/**
 * Compute a shaped blend factor for act transitions.
 *
 * Uses the transitionRig enter/exit thresholds to create distinct zones:
 *   [0 .. enter]           → entering phase (0 → 1 eased)
 *   [enter .. exit]        → fully present  (1)
 *   [exit .. 1]            → exiting phase  (1 → 0 eased)
 *
 * Returns a 0-1 value representing how "present" the current act is.
 */
export function computeActPresence(
  actProgress: number,
  rig: TransitionRig
): number {
  if (actProgress <= rig.enter) {
    return MathUtils.smoothstep(actProgress, 0, rig.enter);
  }
  if (actProgress >= rig.exit) {
    return 1 - MathUtils.smoothstep(actProgress, rig.exit, 1);
  }
  return 1;
}

/**
 * Compute a shaped crossfade blend factor between current and next act.
 *
 * Maps raw actProgress through the exit zone of the current act so the
 * blend to the next act begins at the exit threshold and reaches 1.0
 * at the act boundary. Uses smootherstep for a perceptually smooth curve.
 */
export function computeCrossfadeBlend(
  actProgress: number,
  currentRig: TransitionRig
): number {
  // Before exit zone: no crossfade
  if (actProgress <= currentRig.exit) return 0;
  // Ramp through the exit zone with smootherstep for second-derivative continuity
  return MathUtils.smootherstep(actProgress, currentRig.exit, 1);
}

/**
 * Compute a velocity-damped blend factor.
 *
 * When scrolling quickly, tighten the transition to feel more responsive.
 * When scrolling slowly, use the full eased curve for cinematic smoothness.
 */
export function velocityDampedBlend(
  baseBlend: number,
  velocity: number,
  sensitivity: number = 0.3
): number {
  const absVel = Math.abs(velocity);
  // At high velocity, bias toward a sharper transition
  const sharpBlend = MathUtils.smoothstep(baseBlend, 0.3, 0.7);
  const velocityFactor = MathUtils.clamp(absVel * sensitivity, 0, 1);
  return MathUtils.lerp(baseBlend, sharpBlend, velocityFactor);
}

/**
 * Compute blended value between current and next act using shaped crossfade.
 * Drop-in replacement for `lerp(a, b, actProgress)`.
 */
export function blendValue(
  current: number,
  next: number,
  actProgress: number,
  currentRig: TransitionRig
): number {
  const t = computeCrossfadeBlend(actProgress, currentRig);
  return MathUtils.lerp(current, next, t);
}
