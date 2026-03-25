"use client";

import { useEffect, useRef } from "react";
import { useCursorStore } from "@/stores/cursorStore";

interface MouseParallaxState {
  x: number;
  y: number;
  tiltX: number;
  tiltY: number;
}

/** Returns a ref to normalized mouse position { x: -1..1, y: -1..1 } */
export function useMouseParallax() {
  const mouse = useRef<MouseParallaxState>({
    x: 0,
    y: 0,
    tiltX: 0,
    tiltY: 0,
  });

  // Subscribe to cursorStore instead of independent mousemove listener
  useEffect(() => {
    const unsub = useCursorStore.subscribe((state) => {
      // Convert cursorStore normalized [0,1] to NDC [-1,1]
      mouse.current.x = state.x * 2 - 1;
      mouse.current.y = -(state.y * 2 - 1); // Flip Y axis
    });

    return unsub;
  }, []);

  // Mobile device orientation detection (separate from mouse tracking)
  useEffect(() => {
    const onOrientation = (e: DeviceOrientationEvent) => {
      const beta = e.beta ?? 0;
      const gamma = e.gamma ?? 0;

      // Normalize typical tilt ranges into [-1,1]
      mouse.current.tiltX = Math.max(-1, Math.min(1, gamma / 45));
      mouse.current.tiltY = Math.max(-1, Math.min(1, beta / 45));
    };

    window.addEventListener("deviceorientation", onOrientation);

    return () => {
      window.removeEventListener("deviceorientation", onOrientation);
    };
  }, []);

  return mouse;
}
