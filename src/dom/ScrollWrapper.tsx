"use client";

import { useEffect, useRef, ReactNode } from "react";
import Lenis from "lenis";
import { useScrollStore, NUM_ACTS } from "@/stores/scrollStore";
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

/**
 * Infinite scroll — the DOM content is duplicated 3× to create a "treadmill"
 * effect.  When the user scrolls past the midpoint zone, we silently reset
 * the scroll position back one full cycle, keeping the visual continuity
 * seamless via the SplineEngine's wrap-around sampling.
 */
const SCROLL_COPIES = 3;

export function ScrollWrapper({ children }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const setScroll = useScrollStore((s) => s.setScroll);
  const accumulatedCycles = useRef(0);

  useEffect(() => {
    if (!wrapperRef.current) return;

    const lenis = new Lenis({
      wrapper: wrapperRef.current,
      duration: 1.4,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.5,
    });
    lenisRef.current = lenis;

    lenis.on("scroll", (e: Lenis) => {
      const el = wrapperRef.current;
      if (!el) return;

      const sectionHeight = el.clientHeight; // viewport
      const oneCycleHeight = sectionHeight * NUM_ACTS;
      const maxScroll = el.scrollHeight - el.clientHeight;

      // Raw scrolled fraction across the duplicated content
      const rawFraction = maxScroll > 0 ? e.animatedScroll / oneCycleHeight : 0;
      const progress = rawFraction + accumulatedCycles.current;

      const direction = e.direction;
      const velocity = e.velocity / 10;
      setScroll(progress, velocity, direction);

      // Treadmill reset: when we've scrolled past cycle 2 of 3, silently
      // jump back to cycle 1 maintaining visual continuity
      if (rawFraction >= 2) {
        accumulatedCycles.current += 1;
        lenis.scrollTo(e.animatedScroll - oneCycleHeight, {
          immediate: true,
          force: true,
        });
      } else if (rawFraction < 0.01 && accumulatedCycles.current > 0 && direction === -1) {
        // Scrolling back up: extend backwards
        accumulatedCycles.current -= 1;
        lenis.scrollTo(e.animatedScroll + oneCycleHeight, {
          immediate: true,
          force: true,
        });
      }
    });

    if (new URLSearchParams(window.location.search).get("audit") === "1") {
      window.__LPV5_VIEWPORT_AUDIT__ = {
        getState: useScrollStore.getState,
        getMetrics: useViewportAuditStore.getState,
        setProgress: (progress: number) => {
          const el = wrapperRef.current;
          const instance = lenisRef.current;
          if (!el || !instance) return;

          const sectionHeight = el.clientHeight;
          const oneCycleHeight = sectionHeight * NUM_ACTS;
          const canonical = ((progress % 1) + 1) % 1;
          const targetScroll = canonical * oneCycleHeight;

          accumulatedCycles.current = Math.floor(progress);
          instance.scrollTo(targetScroll, { immediate: true, force: true });
          setScroll(progress, 0, 0);
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
      {/* Render content 3× for treadmill infinite scroll */}
      {Array.from({ length: SCROLL_COPIES }, (_, i) => (
        <div key={i} className="scroll-cycle">
          {children}
        </div>
      ))}
    </div>
  );
}
