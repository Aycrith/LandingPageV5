"use client";

import { useEffect, useState } from "react";
import { useUIStore } from "@/stores/uiStore";

export function LoadingScreen() {
  const isLoading = useUIStore((s) => s.isLoading);
  const loadProgress = useUIStore((s) => s.loadProgress);
  const isReady = useUIStore((s) => s.isReady);
  const dismissLoading = useUIStore((s) => s.dismissLoading);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (isReady) {
      setFading(true);
      const timer = setTimeout(dismissLoading, 1200);
      return () => clearTimeout(timer);
    }
  }, [isReady, dismissLoading]);

  if (!isLoading) return null;

  const pct = Math.round(loadProgress * 100);

  return (
    <div
      className="loading-screen"
      style={{
        opacity: fading ? 0 : 1,
        transition: "opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <div className="flex flex-col items-center gap-6">
        <span
          className="text-xs tracking-[0.3em] uppercase text-white/30"
          style={{ fontFamily: "var(--font-heading), sans-serif" }}
        >
          Loading Experience
        </span>
        <div className="w-48 h-px bg-white/10 relative overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-white/60"
            style={{
              width: `${pct}%`,
              transition: "width 0.3s ease-out",
            }}
          />
        </div>
        <span className="text-xs text-white/20 tabular-nums">{pct}%</span>
      </div>
    </div>
  );
}
