import { create } from "zustand";

const NUM_ACTS = 5;

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

  setScroll: (progress: number, velocity: number, direction: number) => void;
}

export const useScrollStore = create<ScrollState>((set) => ({
  progress: 0,
  velocity: 0,
  direction: 0,
  activeAct: 0,
  actProgress: 0,

  setScroll: (progress, velocity, direction) => {
    const clamped = Math.max(0, Math.min(1, progress));
    const scaled = clamped * NUM_ACTS;
    const activeAct = Math.min(Math.floor(scaled), NUM_ACTS - 1);
    const actProgress = scaled - activeAct;

    set({ progress: clamped, velocity, direction, activeAct, actProgress });
  },
}));
