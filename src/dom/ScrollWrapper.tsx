"use client";

import { useEffect, useRef, ReactNode } from "react";
import Lenis from "lenis";
import { useScrollStore } from "@/stores/scrollStore";

interface Props {
  children: ReactNode;
}

export function ScrollWrapper({ children }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const setScroll = useScrollStore((s) => s.setScroll);

  useEffect(() => {
    if (!wrapperRef.current) return;

    const lenis = new Lenis({
      wrapper: wrapperRef.current,
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.5,
    });
    lenisRef.current = lenis;

    lenis.on("scroll", (e: Lenis) => {
      const el = wrapperRef.current;
      if (!el) return;
      const maxScroll = el.scrollHeight - el.clientHeight;
      const progress = maxScroll > 0 ? e.animatedScroll / maxScroll : 0;
      const direction = e.direction;
      const velocity = e.velocity / 10; // normalize
      setScroll(progress, velocity, direction);
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [setScroll]);

  return (
    <div ref={wrapperRef} className="scroll-wrapper">
      {children}
    </div>
  );
}
