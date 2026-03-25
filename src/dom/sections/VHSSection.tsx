"use client";

import { useEffect, useRef, useState } from "react";

const GLITCH_LINES = [
  "TEMPORAL ANOMALY DETECTED",
  "SIGNAL DEGRADATION: 47%",
  "CONVERGENCE IMMINENT",
  "REALITY BUFFER OVERFLOW",
  "TIMELINE COLLAPSE IN PROGRESS",
];

function GlitchText({ text, color = "#ff7eb3" }: { text: string; color?: string }) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setOffset((Math.random() - 0.5) * 8);
      setTimeout(() => setOffset(0), 80);
    }, 2000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative inline-block">
      <span
        className="absolute top-0 left-0 opacity-70"
        style={{ color: "#00ffff", transform: `translateX(${-offset}px)`, clipPath: "inset(0 0 50% 0)" }}
        aria-hidden
      >
        {text}
      </span>
      <span
        className="absolute top-0 left-0 opacity-70"
        style={{ color: "#ff0055", transform: `translateX(${offset}px)`, clipPath: "inset(50% 0 0 0)" }}
        aria-hidden
      >
        {text}
      </span>
      <span style={{ color }}>{text}</span>
    </div>
  );
}

export function VHSSection() {
  const [visibleLines, setVisibleLines] = useState<number[]>([]);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let idx = 0;
    const interval = setInterval(() => {
      if (idx < GLITCH_LINES.length) {
        setVisibleLines((prev) => [...prev, idx]);
        idx++;
      } else {
        clearInterval(interval);
      }
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-screen overflow-hidden flex items-center justify-center"
      style={{ background: "rgba(5, 0, 5, 0.75)" }}
    >
      {/* Scanlines */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.3) 0px, rgba(0,0,0,0.3) 1px, transparent 1px, transparent 3px)",
        }}
      />
      {/* Film grain */}
      <div
        className="absolute inset-0 pointer-events-none z-10 opacity-10"
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")",
          backgroundSize: "128px 128px",
        }}
      />

      <div className="relative z-20 text-left font-mono px-8 max-w-2xl w-full">
        <p className="text-xs tracking-[0.4em] uppercase text-[#ff7eb3] opacity-50 mb-8">
          ▶ PLAYBACK — ACT V
        </p>
        {GLITCH_LINES.map((line, i) => (
          <div
            key={i}
            className="mb-3 text-sm md:text-base tracking-widest transition-opacity duration-300"
            style={{ opacity: visibleLines.includes(i) ? 1 : 0 }}
          >
            <GlitchText text={line} color={i === 2 ? "#ffffff" : "#ff7eb3"} />
          </div>
        ))}
        <div className="mt-12 flex items-center gap-3 opacity-40">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs tracking-[0.3em] text-red-400">REC</span>
          <span className="text-xs tracking-[0.3em] text-white/30">00:00:00:00</span>
        </div>
      </div>
    </section>
  );
}
