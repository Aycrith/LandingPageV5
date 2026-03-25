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

export function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededRange(seed: number, min: number, max: number): number {
  return min + (max - min) * seededUnit(seed);
}
