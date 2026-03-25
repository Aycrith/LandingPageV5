"use client";

import { useEffect, useRef } from "react";
import { useCursorStore } from "@/stores/cursorStore";

interface ThermoGridProps {
  actProgress: number;
  visible: boolean;
}

export function ThermoGrid({ actProgress, visible }: ThermoGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const gridRef = useRef<Float32Array | null>(null);

  useEffect(() => {
    if (!visible) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const RES = 25;
    const COOLING = 0.98;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight * 0.4;

    const grid = new Float32Array(RES * RES);
    gridRef.current = grid;

    const cellW = canvas.width / RES;
    const cellH = canvas.height / RES;

    const draw = () => {
      const { rawX, rawY, isActive } = useCursorStore.getState();
      const opacity = Math.min(actProgress / 0.4, 1);

      // Inject heat at cursor
      if (isActive) {
        const gy = Math.floor(rawY / (window.innerHeight / RES));
        const startRow = Math.floor(RES * 0.6);
        const localY = gy - startRow;
        const gx = Math.floor(rawX / (window.innerWidth / RES));
        if (gx >= 0 && gx < RES && localY >= 0 && localY < RES) {
          const idx = localY * RES + gx;
          grid[idx] = Math.min(grid[idx] + 0.4, 1);
          // Spread to neighbors
          if (gx > 0) grid[idx - 1] = Math.min(grid[idx - 1] + 0.15, 1);
          if (gx < RES - 1) grid[idx + 1] = Math.min(grid[idx + 1] + 0.15, 1);
          if (localY > 0) grid[idx - RES] = Math.min(grid[idx - RES] + 0.1, 1);
          if (localY < RES - 1) grid[idx + RES] = Math.min(grid[idx + RES] + 0.1, 1);
        }
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let gy2 = 0; gy2 < RES; gy2++) {
        for (let gx2 = 0; gx2 < RES; gx2++) {
          const idx = gy2 * RES + gx2;
          const heat = grid[idx];
          grid[idx] *= COOLING;

          if (heat < 0.01) continue;

          // Color: cool=blue, warm=purple, hot=amber/white
          const r = Math.floor(heat * heat * 255);
          const g = Math.floor(heat * 0.4 * 255);
          const b = Math.floor((1 - heat) * 0.8 * 255);

          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.globalAlpha = heat * opacity * 0.7;
          ctx.fillRect(gx2 * cellW, gy2 * cellH, cellW - 1, cellH - 1);
        }
      }

      ctx.globalAlpha = 1;
      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, [visible, actProgress]);

  if (!visible) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed bottom-0 left-0 right-0"
      style={{ zIndex: 3, height: "40vh" }}
    />
  );
}
