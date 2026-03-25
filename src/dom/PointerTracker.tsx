"use client";

import { useEffect } from "react";
import { useCursorStore } from "@/stores/cursorStore";

export function PointerTracker() {
  useEffect(() => {
    const setCursor = useCursorStore.getState().setCursor;

    const handlePointerMove = (event: PointerEvent) => {
      setCursor(event.clientX, event.clientY);
    };

    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      setCursor(touch.clientX, touch.clientY);
    };

    setCursor(window.innerWidth * 0.5, window.innerHeight * 0.5);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  return null;
}
