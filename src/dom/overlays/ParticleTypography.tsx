"use client";

import { useEffect, useRef } from "react";
import { useCursorStore } from "@/stores/cursorStore";

const ACT_WORDS = ["EMERGENCE", "STRUCTURE", "FLOW", "QUANTUM", "CONVERGENCE"];
const ACT_COLORS = ["#a855f7", "#3b82f6", "#c084fc", "#f59e0b", "#ec4899"];

interface TextParticle {
  x: number;
  y: number;
  ox: number;
  oy: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
}

interface ParticleTypographyProps {
  activeAct: number;
  actProgress: number;
}

export function ParticleTypography({ activeAct, actProgress }: ParticleTypographyProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<TextParticle[]>([]);
  const prevActRef = useRef(-1);

  const buildParticles = (canvas: HTMLCanvasElement, act: number) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const word = ACT_WORDS[act] ?? "";
    const color = ACT_COLORS[act] ?? "#ffffff";
    const fontSize = Math.min(canvas.width / word.length * 1.4, 120);

    // Render text to offscreen
    const off = document.createElement("canvas");
    off.width = canvas.width;
    off.height = 160;
    const octx = off.getContext("2d");
    if (!octx) return;
    octx.font = `bold ${fontSize}px monospace`;
    octx.fillStyle = "#ffffff";
    octx.textAlign = "center";
    octx.textBaseline = "middle";
    octx.fillText(word, off.width / 2, off.height / 2);

    const imageData = octx.getImageData(0, 0, off.width, off.height);
    const particles: TextParticle[] = [];
    const step = 4;

    for (let y = 0; y < off.height; y += step) {
      for (let x = 0; x < off.width; x += step) {
        const alpha = imageData.data[(y * off.width + x) * 4 + 3];
        if (alpha > 128) {
          const ox = x;
          const oy = y + (canvas.height / 2 - off.height / 2);
          particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            ox,
            oy,
            vx: 0,
            vy: 0,
            color,
            size: 1.5 + Math.random() * 1.5,
          });
        }
      }
    }

    particlesRef.current = particles;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      buildParticles(canvas, activeAct);
    };
    resize();
    window.addEventListener("resize", resize);

    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    if (activeAct === prevActRef.current) return;
    prevActRef.current = activeAct;
    const canvas = canvasRef.current;
    if (canvas) buildParticles(canvas, activeAct);
  }, [activeAct]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const visible = actProgress > 0.2 && actProgress < 0.8;
    const fade = visible
      ? Math.min((actProgress - 0.2) / 0.15, 1) * Math.min((0.8 - actProgress) / 0.1, 1)
      : 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const { rawX, rawY } = useCursorStore.getState();

      for (const p of particlesRef.current) {
        const dx = p.x - rawX;
        const dy = p.y - rawY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const repelRadius = 80;

        let ax = (p.ox - p.x) * 0.08;
        let ay = (p.oy - p.y) * 0.08;

        if (dist < repelRadius) {
          const force = (repelRadius - dist) / repelRadius;
          ax += (dx / dist) * force * 3;
          ay += (dy / dist) * force * 3;
        }

        p.vx = (p.vx + ax) * 0.85;
        p.vy = (p.vy + ay) * 0.85;
        p.x += p.vx;
        p.y += p.vy;

        ctx.globalAlpha = fade * 0.85;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      animRef.current = requestAnimationFrame(draw);
    };

    cancelAnimationFrame(animRef.current);
    if (fade > 0) animRef.current = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(animRef.current);
  }, [actProgress, activeAct]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: 5 }}
    />
  );
}
