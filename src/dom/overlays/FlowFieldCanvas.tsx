"use client";

import { useEffect, useRef } from "react";
import { useCursorStore } from "@/stores/cursorStore";

interface FlowFieldCanvasProps {
  actProgress: number;
  visible: boolean;
  color?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

export function FlowFieldCanvas({
  actProgress,
  visible,
  color = "#d0a2ff",
}: FlowFieldCanvasProps) {
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

    const PARTICLE_COUNT = 400;
    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: 0,
      vy: 0,
      life: Math.random() * 200,
      maxLife: 150 + Math.random() * 100,
    }));

    let t = 0;

    const flowAngle = (x: number, y: number) => {
      const { rawX, rawY } = useCursorStore.getState();
      const dx = x - rawX;
      const dy = y - rawY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const repel = dist < 150 ? ((150 - dist) / 150) * Math.PI : 0;
      return Math.sin(x * 0.005 + t * 0.8) * Math.cos(y * 0.004 + t * 0.6) * Math.PI * 2 + repel;
    };

    const draw = () => {
      t += 0.01;
      ctx.fillStyle = "rgba(0,0,0,0.03)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const opacity = Math.min(actProgress / 0.3, 1) * 0.6;
      ctx.strokeStyle = color;
      ctx.globalAlpha = opacity;
      ctx.lineWidth = 0.7;

      for (const p of particles) {
        const angle = flowAngle(p.x, p.y);
        p.vx = p.vx * 0.95 + Math.cos(angle) * 0.4;
        p.vy = p.vy * 0.95 + Math.sin(angle) * 0.4;

        const px = p.x;
        const py = p.y;
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        const lifeRatio = p.life / p.maxLife;
        ctx.globalAlpha = opacity * Math.sin(lifeRatio * Math.PI) * 0.5;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();

        if (p.life >= p.maxLife || p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) {
          p.x = Math.random() * canvas.width;
          p.y = Math.random() * canvas.height;
          p.vx = 0;
          p.vy = 0;
          p.life = 0;
          p.maxLife = 150 + Math.random() * 100;
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
  }, [visible, actProgress, color]);

  if (!visible) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: 3 }}
    />
  );
}
