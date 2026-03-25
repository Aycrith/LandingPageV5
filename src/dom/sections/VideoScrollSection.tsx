"use client";

import { useRef, useEffect, useState } from "react";

export function VideoScrollSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.28);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
      },
      { threshold: Array.from({ length: 101 }, (_, i) => i / 100) }
    );

    const onScroll = () => {
      const rect = section.getBoundingClientRect();
      const windowH = window.innerHeight;
      // 0 = just entered viewport from bottom, 1 = top is at viewport top
      const progress = Math.max(0, Math.min(1, (windowH - rect.top) / (windowH + rect.height)));
      const s = 0.28 + progress * 0.72;
      setScale(s);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    observer.observe(section);

    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden flex items-center justify-center"
      style={{ height: "200vh" }}
    >
      <div className="sticky top-0 w-full h-screen flex items-center justify-center overflow-hidden">
        <div
          ref={innerRef}
          className="relative overflow-hidden rounded-2xl"
          style={{
            width: "80vw",
            aspectRatio: "16/9",
            transform: `scale(${scale})`,
            transformOrigin: "center center",
            transition: "transform 0.05s linear",
          }}
        >
          {/* Gradient placeholder — replace with <video> when source is available */}
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(135deg, #0a0014 0%, #0d001f 30%, #14000a 70%, #000a1a 100%)",
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-white/20 text-7xl font-thin tracking-widest">FLOW → QUANTUM</p>
          </div>
          {/* Scan line overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 4px)",
            }}
          />
        </div>
      </div>
    </section>
  );
}
