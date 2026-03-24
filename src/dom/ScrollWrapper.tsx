"use client";

import { useEffect, useRef, ReactNode } from "react";
import Lenis from "lenis";
import { useScrollStore } from "@/stores/scrollStore";
import { useViewportAuditStore } from "@/stores/viewportAuditStore";

interface Props {
  children: ReactNode;
}

declare global {
  interface Window {
    __LPV5_VIEWPORT_AUDIT__?: {
      getState: typeof useScrollStore.getState;
      getMetrics: typeof useViewportAuditStore.getState;
      setProgress: (progress: number) => void;
    };
  }
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

    if (new URLSearchParams(window.location.search).get("audit") === "1") {
      window.__LPV5_VIEWPORT_AUDIT__ = {
        getState: useScrollStore.getState,
        getMetrics: useViewportAuditStore.getState,
        setProgress: (progress: number) => {
          const el = wrapperRef.current;
          const instance = lenisRef.current;
          if (!el || !instance) return;

          const clamped = Math.max(0, Math.min(1, progress));
          const maxScroll = el.scrollHeight - el.clientHeight;
          const targetScroll = maxScroll * clamped;

          instance.scrollTo(targetScroll, { immediate: true, force: true });
          setScroll(clamped, 0, 0);
        },
      };
    }

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      delete window.__LPV5_VIEWPORT_AUDIT__;
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
