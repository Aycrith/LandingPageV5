"use client";

import { useEffect, useRef, ReactNode } from "react";
import Lenis from "lenis";
import { getWarmupCheckpointDescriptor, WARMUP_CHECKPOINTS } from "@/canvas/warmupCheckpoints";
import { useScrollStore } from "@/stores/scrollStore";
import { useSceneLoadStore } from "@/stores/sceneLoadStore";
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
  const pendingScrollRef = useRef<{
    progress: number;
    velocity: number;
    direction: number;
  } | null>(null);
  const auditTargetRef = useRef<{
    progress: number;
    velocity: number;
    direction: number;
  } | null>(null);
  const auditFlushTimerRef = useRef<number | null>(null);
  const setScroll = useScrollStore((s) => s.setScroll);

  useEffect(() => {
    if (!wrapperRef.current) return;

    function resolveWarmupCheckpoint(progress: number) {
      const checkpoint =
        [...WARMUP_CHECKPOINTS]
          .reverse()
          .find((candidate) => candidate.progress <= progress) ??
        WARMUP_CHECKPOINTS[0] ??
        null;

      return checkpoint ? getWarmupCheckpointDescriptor(checkpoint.id) : null;
    }

    const lenis = new Lenis({
      wrapper: wrapperRef.current,
      duration: 0.8,
      easing: (t) => 1 - Math.pow(1 - t, 2),
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
      pendingScrollRef.current = { progress, velocity, direction };
    });

    if (new URLSearchParams(window.location.search).get("audit") === "1") {
      function flushAuditTarget() {
        auditFlushTimerRef.current = null;
        if (auditTargetRef.current) {
          pendingScrollRef.current = auditTargetRef.current;
          auditTargetRef.current = null;
        }
      }

      window.__LPV5_VIEWPORT_AUDIT__ = {
        getState: useScrollStore.getState,
        getMetrics: useViewportAuditStore.getState,
        setProgress: (progress: number) => {
          const el = wrapperRef.current;
          if (!el) return;

          const clamped = Math.max(0, Math.min(1, progress));
          const currentProgress = useScrollStore.getState().progress;
          const direction =
            clamped > currentProgress ? 1 : clamped < currentProgress ? -1 : 0;
          const checkpoint = resolveWarmupCheckpoint(clamped);

          const loadState = useSceneLoadStore.getState();
          if (checkpoint) {
            loadState.setOffscreenWarmupActIndex(checkpoint.activeAct);
            loadState.setOffscreenWarmupCheckpointId(checkpoint.id);
          }

          auditTargetRef.current = {
            progress: clamped,
            velocity: 0,
            direction,
          };

          if (auditFlushTimerRef.current == null) {
            auditFlushTimerRef.current = window.setTimeout(flushAuditTarget, 72);
          }
        },
      };
    }

    function raf(time: number) {
      lenis.raf(time);
      const pendingScroll = pendingScrollRef.current;
      if (pendingScroll) {
        pendingScrollRef.current = null;
        setScroll(
          pendingScroll.progress,
          pendingScroll.velocity,
          pendingScroll.direction
        );
      }
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      if (auditFlushTimerRef.current != null) {
        window.clearTimeout(auditFlushTimerRef.current);
        auditFlushTimerRef.current = null;
      }
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
