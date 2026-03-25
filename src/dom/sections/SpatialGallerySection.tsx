"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const PANELS = [
  { id: "p1", title: "Entanglement", sub: "Particles linked across space" },
  { id: "p2", title: "Superposition", sub: "All possibilities existing simultaneously" },
  { id: "p3", title: "Probability Wave", sub: "Collapsing state by observation" }
];

export function SpatialGallerySection() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cards = container.querySelectorAll(".spatial-card") as NodeListOf<HTMLDivElement>;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const mouseX = e.clientX;
      const mouseY = e.clientY;

      cards.forEach((card, index) => {
        const diffX = mouseX - cx;
        const diffY = mouseY - cy;
        const depth = index + 1;

        card.style.transform = `translate3d(${diffX * 0.05 * depth}px, ${diffY * 0.05 * depth}px, ${-index * 50}px) rotateY(${diffX * 0.01}deg) rotateX(${-diffY * 0.01}deg)`;
      });
    };

    container.addEventListener("mousemove", handleMouseMove);
    return () => container.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <section 
      ref={containerRef}
      className="relative w-full h-screen flex items-center justify-center pointer-events-none perspective-[1000px]"
    >
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Glow from the warp drive behind */}
      </div>

      <div className="relative z-10 w-full max-w-lg preserve-3d">
        {PANELS.map((panel, idx) => (
          <motion.div
            key={panel.id}
            initial={{ opacity: 0, y: 100, rotateX: 30 }}
            whileInView={{ opacity: 1 - idx * 0.2, y: idx * 40, rotateX: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, delay: idx * 0.2 }}
            className={cn(
              "spatial-card absolute inset-x-0 cursor-crosshair pointer-events-auto rounded-3xl border border-white/10 bg-background/60 backdrop-blur-2xl p-8 hover:!opacity-100 hover:border-accent/50 hover:bg-white/5 transition-colors duration-500",
              idx === 0 ? "relative" : "mt-[-280px]"
            )}
            style={{
              zIndex: 10 - idx,
              willChange: "transform, opacity",
            }}
          >
            <div className="flex justify-between items-start mb-16">
              <span className="text-white/30 font-mono text-sm">0{idx + 1}</span>
              <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center group-hover:border-accent/50 transition-colors">
                <span className="w-1 h-1 bg-white/50 rounded-full" />
              </div>
            </div>
            
            <h3 className="text-3xl md:text-5xl font-light tracking-tight mb-4">
              {panel.title}
            </h3>
            <p className="text-white/40 font-light font-mono text-xs uppercase tracking-widest">
              {panel.sub}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
