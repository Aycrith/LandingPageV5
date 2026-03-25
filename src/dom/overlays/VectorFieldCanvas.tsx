"use client";

import { useEffect, useRef } from "react";
import { useCursorStore } from "@/stores/cursorStore";

interface VectorFieldCanvasProps {
  actProgress: number;
  visible: boolean;
}

export function VectorFieldCanvas({ actProgress, visible }: VectorFieldCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    if (!visible) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const GRID = 24;
    let t = 0;

    const draw = () => {
      t += 0.015;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const { rawX, rawY } = useCursorStore.getState();
      const opacity = Math.min(actProgress / 0.4, 1) * 0.5;

      const cw = canvas.width / GRID;
      const ch = canvas.height / GRID;

      for (let gx = 0; gx < GRID; gx++) {
        for (let gy = 0; gy < GRID; gy++) {
          const x = (gx + 0.5) * cw;
          const y = (gy + 0.5) * ch;

          const dx = x - rawX;
          const dy = y - rawY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const isLocked = Math.sin(gx * 7.3 + gy * 3.7) > 0.97;

          let angle: number;
          if (isLocked) {
            angle = Math.atan2(dy, dx) + Math.PI / 2;
            ctx.strokeStyle = "#c084fc";
            ctx.globalAlpha = opacity * 0.8;
          } else if (dist < 200) {
            angle = Math.atan2(dy, dx);
            ctx.strokeStyle = "#ffd06f";
            ctx.globalAlpha = opacity * (1 - dist / 200) * 0.9;
          } else {
            angle = Math.sin(gx * 0.4 + t) * Math.cos(gy * 0.35 + t * 0.8) * Math.PI;
            ctx.strokeStyle = "#6dc7ff";
            ctx.globalAlpha = opacity * 0.35;
          }

          const len = Math.min(cw, ch) * 0.35;
          const ex = x + Math.cos(angle) * len;
          const ey = y + Math.sin(angle) * len;

          ctx.beginPath();
          ctx.moveTo(x - Math.cos(angle) * len * 0.3, y - Math.sin(angle) * len * 0.3);
          ctx.lineTo(ex, ey);
          ctx.lineWidth = isLocked ? 1.5 : 0.8;
          ctx.stroke();

          // Arrowhead
          const hw = isLocked ? 3 : 2;
          ctx.beginPath();
          ctx.moveTo(ex, ey);
          ctx.lineTo(ex - Math.cos(angle - 0.4) * hw, ey - Math.sin(angle - 0.4) * hw);
          ctx.lineTo(ex - Math.cos(angle + 0.4) * hw, ey - Math.sin(angle + 0.4) * hw);
          ctx.closePath();
          ctx.fillStyle = ctx.strokeStyle;
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;
      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [visible, actProgress]);

  if (!visible) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: 3 }}
    />
  );
}
