"use client";

import { useRef, useEffect, useState } from "react";
import { useCursorStore } from "@/stores/cursorStore";

const PRODUCTS = [
  {
    id: 1,
    name: "Quantum Field",
    tagline: "Superposition of visual states",
    color: "#f59e0b",
    accent: "#ffd06f",
    bg: "#140800",
    icon: "◈",
  },
  {
    id: 2,
    name: "Flow Engine",
    tagline: "Continuous wave propagation",
    color: "#c084fc",
    accent: "#d0a2ff",
    bg: "#080014",
    icon: "◎",
  },
];

export function SpatialShowcase() {
  const [active, setActive] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const handleMove = () => {
      const { x, y } = useCursorStore.getState();
      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        const rx = (x - 0.5) * (i === active ? 20 : 8);
        const ry = (y - 0.5) * (i === active ? -15 : -6);
        card.style.transform = `perspective(800px) rotateY(${rx}deg) rotateX(${ry}deg)`;
      });
    };

    const unsub = useCursorStore.subscribe(handleMove);
    return unsub;
  }, [active]);

  const product = PRODUCTS[active];

  return (
    <section
      ref={containerRef}
      className="relative w-full h-screen flex items-center justify-center overflow-hidden"
      style={{
        background: `rgba(${parseInt(product.bg.slice(1, 3), 16)}, ${parseInt(product.bg.slice(3, 5), 16)}, ${parseInt(product.bg.slice(5, 7), 16)}, 0.7)`,
        transition: "background 0.8s ease"
      }}
    >
      {/* Pulsing glow */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 600,
          height: 600,
          background: `radial-gradient(circle, ${product.color}15 0%, transparent 70%)`,
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-12">
        {/* Tab selector */}
        <div className="flex gap-4">
          {PRODUCTS.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setActive(i)}
              className="px-6 py-2 rounded-full text-xs tracking-widest uppercase transition-all duration-300"
              style={{
                border: `1px solid ${i === active ? p.color : "rgba(255,255,255,0.1)"}`,
                color: i === active ? p.color : "rgba(255,255,255,0.3)",
                background: i === active ? `${p.color}15` : "transparent",
              }}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Cards */}
        <div className="flex gap-8">
          {PRODUCTS.map((p, i) => (
            <div
              key={p.id}
              ref={(el) => { cardRefs.current[i] = el; }}
              onClick={() => setActive(i)}
              className="cursor-pointer rounded-2xl border p-10 flex flex-col items-center gap-4 transition-all duration-500"
              style={{
                width: i === active ? 320 : 240,
                opacity: i === active ? 1 : 0.4,
                border: `1px solid ${i === active ? p.color : "rgba(255,255,255,0.06)"}`,
                background: `linear-gradient(135deg, ${p.bg} 0%, rgba(255,255,255,0.02) 100%)`,
                boxShadow: i === active ? `0 0 60px ${p.color}25` : "none",
                willChange: "transform",
                transformStyle: "preserve-3d",
              }}
            >
              <span className="text-6xl" style={{ color: p.color }}>{p.icon}</span>
              <h3 className="text-xl font-light tracking-widest text-white">{p.name}</h3>
              <p className="text-xs text-center opacity-40 tracking-wider" style={{ color: p.accent }}>
                {p.tagline}
              </p>
              {i === active && (
                <div
                  className="w-full h-px mt-2"
                  style={{ background: `linear-gradient(90deg, transparent, ${p.color}, transparent)` }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
