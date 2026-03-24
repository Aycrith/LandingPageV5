/**
 * Deterministic pseudo-random helpers for render-safe procedural data.
 * These are pure functions (no global mutable state), so they satisfy
 * strict React hooks purity rules while still giving organic variation.
 */
export function seededUnit(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function seededSigned(seed: number): number {
  return seededUnit(seed) * 2 - 1;
}
