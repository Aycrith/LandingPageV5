"use client";

import { useEffect, useRef, useState } from "react";

interface HandwrittenTitleProps {
  title: string;
  color?: string;
  className?: string;
}

// Simple SVG stroke paths approximating handwritten text
const PATHS: Record<string, string> = {
  Flow: "M10,40 C20,10 30,10 40,40 C45,55 50,55 55,40 M60,20 C65,20 70,30 65,40 C60,50 55,50 60,40 M72,30 C72,50 76,50 80,40 C84,30 84,20 80,20 C76,20 72,30 72,40 M88,30 L95,30 M92,30 L92,50",
};

export function HandwrittenTitle({
  title,
  color = "#d0a2ff",
  className = "",
}: HandwrittenTitleProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const [triggered, setTriggered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setTriggered(true); },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const path = pathRef.current;
    if (!path || !triggered) return;
    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;
    path.style.transition = "none";
    // Force reflow
    void path.getBoundingClientRect();
    path.style.transition = "stroke-dashoffset 1.8s cubic-bezier(0.4, 0, 0.2, 1)";
    path.style.strokeDashoffset = "0";
  }, [triggered]);

  const pathD = PATHS[title] ?? `M10,40 L${title.length * 10 + 10},40`;

  return (
    <div ref={containerRef} className={`inline-block ${className}`}>
      <svg
        viewBox="0 0 110 60"
        style={{ width: `${Math.max(title.length * 14, 100)}px`, height: 60 }}
        fill="none"
      >
        <path
          ref={pathRef}
          d={pathD}
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity={0.85}
        />
      </svg>
    </div>
  );
}
