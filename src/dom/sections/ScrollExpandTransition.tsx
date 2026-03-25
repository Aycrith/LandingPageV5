"use client";

import { useEffect, useState } from "react";
import { useScrollStore } from "@/stores/scrollStore";

/**
 * ScrollExpandTransition - Cinematic bridge between Acts 0 and 1
 * Acts as a horizontal scan-line wipe transition
 * Shows during Act 0, progress 0.85-0.98
 * Pure CSS clip-path reveal animation, no background fill
 */
export function ScrollExpandTransition() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const unsub = useScrollStore.subscribe((state) => {
      // Only active in Act 0, from progress 0.85 to 0.98
      if (state.activeAct === 0 && state.actProgress >= 0.85 && state.actProgress <= 0.98) {
        // Map progress from [0.85, 0.98] → [0, 1]
        const normalizedProgress = (state.actProgress - 0.85) / (0.98 - 0.85);
        setProgress(normalizedProgress);
      } else {
        setProgress(0);
      }
    });
    return unsub;
  }, []);

  // Calculate clip-path: wipe from left to right
  const clipPathPercent = progress * 100;

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{
        zIndex: 6,
        background: "transparent",
        opacity: progress > 0 ? 1 : 0,
        transition: progress > 0 ? "none" : "opacity 0.3s ease",
      }}
    >
      {/* Horizontal Scan-Line Wipe Container */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          clipPath: `inset(0 ${100 - clipPathPercent}% 0 0)`,
          background: "transparent",
        }}
      >
        {/* Scan-line effect (horizontal lines moving left to right) */}
        <div
          className="absolute inset-0"
          style={{
            background: `repeating-linear-gradient(
              0deg,
              rgba(0, 255, 255, 0.03) 0px,
              rgba(0, 255, 255, 0.03) 2px,
              transparent 2px,
              transparent 4px
            )`,
          }}
        />

        {/* Bright wipe edge (glowing line at the reveal edge) */}
        <div
          className="absolute top-0 bottom-0"
          style={{
            left: `${clipPathPercent}%`,
            width: "2px",
            background: "linear-gradient(90deg, transparent, #00ffff, #6366f1, transparent)",
            boxShadow: "0 0 20px rgba(0, 255, 255, 0.8), 0 0 40px rgba(99, 102, 241, 0.4)",
            transform: "translateX(-1px)",
          }}
        />

        {/* Data visualization elements (subtle grid pattern behind wipe) */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(90deg, transparent 0%, rgba(0, 255, 255, 0.05) 50%, transparent 100%)`,
          }}
        />

        {/* Reveal text (appears as wipe progresses) */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{
            opacity: Math.min(progress * 2, 1), // Fade in during first half
          }}
        >
          <div className="text-center">
            <div
              className="text-5xl font-bold mb-2"
              style={{
                background: "linear-gradient(135deg, #00ffff, #6366f1)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              STRUCTURE
            </div>
            <div className="text-lg text-cyan-300/60">Order crystallizes from chaos</div>
          </div>
        </div>
      </div>

      {/* Styles */}
      <style>{`
        /* Smooth transition animation */
      `}</style>
    </div>
  );
}