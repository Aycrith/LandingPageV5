"use client";

import { useRef, useEffect } from "react";

const PANELS = [
  { title: "Emergence", sub: "Genesis of form from chaos", color: "#a855f7", bg: "#0d0014" },
  { title: "Structure", sub: "Orbital mechanics of data", color: "#3b82f6", bg: "#000a1a" },
  { title: "Flow", sub: "Wave dynamics and resonance", color: "#c084fc", bg: "#0a0014" },
  { title: "Quantum", sub: "Superposition of possibility", color: "#f59e0b", bg: "#140a00" },
  { title: "Convergence", sub: "Singularity of meaning", color: "#ec4899", bg: "#14000a" },
];

export function StackedPanelsSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / rect.width;
      const dy = (e.clientY - cy) / rect.height;

      panelRefs.current.forEach((panel, i) => {
        if (!panel) return;
        const depth = (i + 1) / PANELS.length;
        const tx = dx * 20 * depth;
        const ty = dy * 10 * depth;
        panel.style.transform = `translateX(${tx}px) translateY(${ty}px) translateZ(${i * -20}px)`;
      });
    };

    container.addEventListener("mousemove", handleMouseMove);
    return () => container.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative w-full overflow-hidden"
      style={{ height: "100vh", perspective: "800px" }}
    >
      {PANELS.map((panel, i) => (
        <div
          key={i}
          ref={(el) => { panelRefs.current[i] = el; }}
          className="absolute inset-x-8 rounded-2xl border border-white/10 flex items-center justify-between px-12 py-8 transition-transform duration-100 ease-out"
          style={{
            top: `${8 + i * 14}%`,
            background: `linear-gradient(135deg, ${panel.bg} 0%, ${panel.bg}dd 100%)`,
            boxShadow: `0 0 40px ${panel.color}20`,
            zIndex: PANELS.length - i,
            willChange: "transform",
            opacity: 0.55,
          }}
        >
          <div>
            <p className="text-xs tracking-[0.4em] uppercase mb-1" style={{ color: panel.color, opacity: 0.7 }}>
              Act {i + 1}
            </p>
            <h3 className="text-3xl md:text-4xl font-light tracking-wider text-white">
              {panel.title}
            </h3>
            <p className="mt-2 text-sm opacity-40 text-white tracking-widest">
              {panel.sub}
            </p>
          </div>
          <div
            className="w-12 h-12 rounded-full border"
            style={{ borderColor: panel.color, boxShadow: `0 0 20px ${panel.color}` }}
          />
        </div>
      ))}
    </section>
  );
}
