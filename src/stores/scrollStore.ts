import { create } from "zustand";

const NUM_ACTS = 6;

interface ScrollState {
  /** Global scroll progress 0-1 */
  progress: number;
  /** Current scroll velocity (px/s normalized) */
  velocity: number;
  /** Scroll direction: 1 = down, -1 = up, 0 = idle */
  direction: number;
  /** Active act index 0-4 */
  activeAct: number;
  /** Progress within the current act 0-1 */
  actProgress: number;
  /** Monotonic sequence for scroll mutations */
  sequence: number;
  /** High-resolution timestamp for the latest scroll update */
  updatedAt: number | null;

  setScroll: (progress: number, velocity: number, direction: number) => void;
}

export const useScrollStore = create<ScrollState>((set) => ({
  progress: 0,
  velocity: 0,
  direction: 0,
  activeAct: 0,
  actProgress: 0,
  sequence: 0,
  updatedAt: null,

  setScroll: (progress, velocity, direction) => {
    const clamped = Math.max(0, Math.min(1, progress));
    const scaled = clamped * NUM_ACTS;
    const activeAct = Math.min(Math.floor(scaled), NUM_ACTS - 1);
    const actProgress = scaled - activeAct;
    const updatedAt =
      typeof performance !== "undefined" ? performance.now() : Date.now();

    set((state) => ({
      progress: clamped,
      velocity,
      direction,
      activeAct,
      actProgress,
      sequence: state.sequence + 1,
      updatedAt,
    }));
  },
}));
