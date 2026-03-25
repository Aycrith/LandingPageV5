import { create } from "zustand";

interface CursorState {
  x: number;        // normalized 0–1 (left→right)
  y: number;        // normalized 0–1 (top→bottom)
  rawX: number;     // pixels
  rawY: number;     // pixels
  velX: number;     // px/ms
  velY: number;
  isActive: boolean;
  setCursor: (rawX: number, rawY: number) => void;
}

let _lastX = 0;
let _lastY = 0;
let _lastTime = 0;

export const useCursorStore = create<CursorState>((set) => ({
  x: 0.5,
  y: 0.5,
  rawX: 0,
  rawY: 0,
  velX: 0,
  velY: 0,
  isActive: false,
  setCursor: (rawX, rawY) => {
    const now = performance.now();
    const dt = Math.max(now - _lastTime, 1);
    const velX = (rawX - _lastX) / dt;
    const velY = (rawY - _lastY) / dt;
    _lastX = rawX;
    _lastY = rawY;
    _lastTime = now;
    set({
      rawX,
      rawY,
      x: rawX / (typeof window !== "undefined" ? window.innerWidth : 1),
      y: rawY / (typeof window !== "undefined" ? window.innerHeight : 1),
      velX,
      velY,
      isActive: true,
    });
  },
}));
