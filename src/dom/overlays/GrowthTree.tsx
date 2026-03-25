"use client";

import { useEffect, useRef, useState } from "react";

interface GrowthTreeProps {
  triggered: boolean;
  color?: string;
}

interface Branch {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  opacity: number;
  drawn: boolean;
}

function buildTree(
  x: number,
  y: number,
  angle: number,
  length: number,
  depth: number,
  branches: Branch[]
) {
  if (depth === 0 || length < 2) return;
  const x2 = x + Math.cos(angle) * length;
  const y2 = y + Math.sin(angle) * length;
  branches.push({ x1: x, y1: y, x2, y2, opacity: 0, drawn: false });
  const spread = 0.35 + depth * 0.04;
  buildTree(x2, y2, angle - spread, length * 0.72, depth - 1, branches);
  buildTree(x2, y2, angle + spread, length * 0.72, depth - 1, branches);
  if (depth > 3) {
    buildTree(x2, y2, angle - spread * 0.4, length * 0.55, depth - 2, branches);
  }
}

export function GrowthTree({ triggered, color = "#d0a2ff" }: GrowthTreeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [ready, setReady] = useState(false);
  const branchesRef = useRef<Branch[]>([]);
  const drawIndexRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 300;
    canvas.height = 250;

    const branches: Branch[] = [];
    buildTree(150, 240, -Math.PI / 2, 60, 8, branches);
    branchesRef.current = branches;
    drawIndexRef.current = 0;
    setReady(true);
  }, []);

  useEffect(() => {
    if (!triggered || !ready) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const branches = branchesRef.current;
    let idx = 0;

    const draw = () => {
      const batchSize = 3;
      for (let i = 0; i < batchSize && idx < branches.length; i++, idx++) {
        const b = branches[idx];
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.6 - (idx / branches.length) * 0.3;
        ctx.lineWidth = Math.max(0.5, 4 - (idx / branches.length) * 3.5);
        ctx.beginPath();
        ctx.moveTo(b.x1, b.y1);
        ctx.lineTo(b.x2, b.y2);
        ctx.stroke();
      }

      if (idx < branches.length) {
        animRef.current = requestAnimationFrame(draw);
      }
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [triggered, ready, color]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none"
      style={{ width: 300, height: 250 }}
    />
  );
}
