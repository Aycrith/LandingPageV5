"use client";

import { useEffect, useRef } from "react";
import { useCursorStore } from "@/stores/cursorStore";
import { useScrollStore } from "@/stores/scrollStore";
import { ACT_VIEWPORT_PROFILES } from "@/canvas/viewportProfiles";

const ACT_COLORS = ACT_VIEWPORT_PROFILES.map((profile) => profile.accent);

export function InfiniteGridOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const colorRef = useRef(ACT_COLORS[0]);
  const offsetRef = useRef({ x: 0, y: 0 });
  const targetOffsetRef = useRef({ x: 0, y: 0 });
  const isVisibleRef = useRef(false);
  const opacityRef = useRef(0);

  useEffect(() => {
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

    const unsubCursor = useCursorStore.subscribe((state) => {
      targetOffsetRef.current = {
        x: (state.x - 0.5) * 40,
        y: (state.y - 0.5) * 40,
      };
    });

    const unsubScroll = useScrollStore.subscribe((state) => {
      colorRef.current = ACT_COLORS[state.activeAct] ?? ACT_COLORS[0];

      // Show grid only at act boundaries (transitions)
      const isAtBoundary = state.actProgress < 0.12 || state.actProgress > 0.88;
      isVisibleRef.current = isAtBoundary;

      // Calculate opacity: fade in/out at boundaries
      if (state.actProgress < 0.12) {
        opacityRef.current = Math.min(state.actProgress / 0.12, 1);
      } else if (state.actProgress > 0.88) {
        opacityRef.current = Math.min((1 - state.actProgress) / 0.12, 1);
      } else {
        opacityRef.current = 0;
      }
    });

    const CELL = 60;

    const draw = () => {
      // Early exit if not visible
      if (!isVisibleRef.current && opacityRef.current < 0.01) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }

      offsetRef.current.x += (targetOffsetRef.current.x - offsetRef.current.x) * 0.05;
      offsetRef.current.y += (targetOffsetRef.current.y - offsetRef.current.y) * 0.05;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.style.opacity = String(opacityRef.current);
      ctx.strokeStyle = colorRef.current;
      ctx.globalAlpha = 0.12 * opacityRef.current;
      ctx.lineWidth = 0.5;

      const ox = ((offsetRef.current.x % CELL) + CELL) % CELL;
      const oy = ((offsetRef.current.y % CELL) + CELL) % CELL;

      for (let x = ox - CELL; x < canvas.width + CELL; x += CELL) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = oy - CELL; y < canvas.height + CELL; y += CELL) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      unsubCursor();
      unsubScroll();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: 2, opacity: 0 }}
    />
  );
}
