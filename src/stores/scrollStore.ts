import { create } from "zustand";

export const NUM_ACTS = 5;

interface ScrollState {
  /** Global scroll progress — in infinite mode this grows without bound */
  progress: number;
  /** Canonical progress wrapped to [0,1) for spline sampling */
  canonical: number;
  /** Current scroll velocity (px/s normalized) */
  velocity: number;
  /** Scroll direction: 1 = down, -1 = up, 0 = idle */
  direction: number;
  /** Active act index 0-4 (wraps in infinite mode) */
  activeAct: number;
  /** Progress within the current act 0-1 */
  actProgress: number;
  /** Total number of full cycles completed */
  cycle: number;

  setScroll: (progress: number, velocity: number, direction: number) => void;
}

function wrapProgress(p: number): number {
  const m = p % 1;
  return m < 0 ? m + 1 : m;
}

export const useScrollStore = create<ScrollState>((set) => ({
  progress: 0,
  canonical: 0,
  velocity: 0,
  direction: 0,
  activeAct: 0,
  actProgress: 0,
  cycle: 0,

  setScroll: (progress, velocity, direction) => {
    // Allow progress to grow beyond 1 for infinite scrolling
    const canonical = wrapProgress(progress);
    const scaled = canonical * NUM_ACTS;
    const activeAct = Math.min(Math.floor(scaled), NUM_ACTS - 1);
    const actProgress = scaled - activeAct;
    const cycle = Math.floor(progress);

    set({ progress, canonical, velocity, direction, activeAct, actProgress, cycle });
  },
}));
