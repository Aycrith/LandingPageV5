"use client";

import { useEffect, useRef } from "react";
import { useScrollStore } from "@/stores/scrollStore";

const ACT_HUES = [280, 210, 270, 45, 300];

function hslToHex(h: number, s: number, l: number): string {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// 36 bezier path definitions (normalized 0-1 space)
const PATHS = Array.from({ length: 36 }, (_, i) => {
  const t = i / 36;
  const x1 = t;
  const y1 = Math.sin(t * Math.PI * 3) * 0.3 + 0.5;
  const cx1 = t + 0.1;
  const cy1 = y1 - 0.2 + (i % 3) * 0.1;
  const cx2 = t + 0.2;
  const cy2 = y1 + 0.25 - (i % 5) * 0.08;
  const x2 = t + 0.3;
  const y2 = Math.cos(t * Math.PI * 2 + 1) * 0.3 + 0.5;
  return { x1, y1, cx1, cy1, cx2, cy2, x2, y2 };
});

export function BackgroundPaths() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const unsub = useScrollStore.subscribe((state) => {
      const hue = ACT_HUES[state.activeAct] ?? 280;
      const color = hslToHex(hue, 0.5, 0.55);
      if (svgRef.current) {
        svgRef.current.querySelectorAll("path").forEach((p) => {
          p.setAttribute("stroke", color);
        });
      }
    });
    return unsub;
  }, []);

  return (
    <svg
      ref={svgRef}
      className="pointer-events-none fixed inset-0 w-full h-full"
      style={{ zIndex: 1 }}
      viewBox="0 0 1 1"
      preserveAspectRatio="none"
    >
      {PATHS.map((p, i) => (
        <path
          key={i}
          d={`M ${p.x1} ${p.y1} C ${p.cx1} ${p.cy1}, ${p.cx2} ${p.cy2}, ${p.x2} ${p.y2}`}
          fill="none"
          stroke={hslToHex(280, 0.5, 0.55)}
          strokeWidth="0.001"
          strokeOpacity={0.06 + (i % 4) * 0.01}
        />
      ))}
    </svg>
  );
}
