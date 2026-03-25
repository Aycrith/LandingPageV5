"use client";

import { useRef, useEffect, useState } from "react";

const ITEMS = [
  { label: "EMERGENCE", color: "#a855f7", bg: "#0d0014" },
  { label: "STRUCTURE", color: "#3b82f6", bg: "#000a1a" },
  { label: "FLOW", color: "#c084fc", bg: "#080014" },
  { label: "QUANTUM", color: "#f59e0b", bg: "#140800" },
  { label: "CONVERGENCE", color: "#ec4899", bg: "#14000a" },
];

export function ZoomGallery() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const section = sectionRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const total = section.offsetHeight - window.innerHeight;
      const scrolled = -rect.top;
      setProgress(Math.max(0, Math.min(1, scrolled / total)));
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const activeIdx = Math.min(Math.floor(progress * ITEMS.length), ITEMS.length - 1);
  const localProgress = (progress * ITEMS.length) % 1;

  return (
    <section
      ref={sectionRef}
      className="relative w-full"
      style={{ height: "300vh" }}
    >
      <div className="sticky top-0 w-full h-screen overflow-hidden flex items-center justify-center">
        <div className="relative w-full h-full">
          {ITEMS.map((item, i) => {
            const isActive = i === activeIdx;
            const isPrev = i < activeIdx;
            const scale = isActive ? 1 + localProgress * 0.08 : isPrev ? 1.1 : 0.88;
            const opacity = isActive ? 1 : isPrev ? 1 - localProgress : 0;

            return (
              <div
                key={i}
                className="absolute inset-0 flex items-center justify-center transition-none"
                style={{
                  transform: `scale(${scale})`,
                  opacity,
                  background: `rgba(${parseInt(item.bg.slice(1, 3), 16)}, ${parseInt(item.bg.slice(3, 5), 16)}, ${parseInt(item.bg.slice(5, 7), 16)}, 0.8)`,
                  zIndex: isActive ? 2 : 1,
                }}
              >
                <div className="text-center pointer-events-none">
                  <p className="text-xs tracking-[0.6em] mb-4" style={{ color: item.color, opacity: 0.6 }}>
                    ACT {i + 1} / {ITEMS.length}
                  </p>
                  <h2
                    className="text-[10vw] font-extralight tracking-[0.15em]"
                    style={{ color: item.color }}
                  >
                    {item.label}
                  </h2>
                  <div
                    className="mt-6 w-32 h-px mx-auto"
                    style={{ background: `linear-gradient(90deg, transparent, ${item.color}, transparent)` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress dots */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-10">
          {ITEMS.map((item, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === activeIdx ? 24 : 6,
                height: 6,
                background: i === activeIdx ? item.color : "rgba(255,255,255,0.2)",
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
