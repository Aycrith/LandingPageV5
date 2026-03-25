"use client";

import { useEffect, useState } from "react";
import { useScrollStore } from "@/stores/scrollStore";

/**
 * HeroVideoSection - Floating card with quantum-themed metrics
 * Shows as a corner panel during Act 3 (Quantum), progress 0.2-0.8
 * Position: bottom-right, 340px width, semi-transparent with backdrop blur
 * Displays act-themed stats/metrics (no video — matches quantum data theme)
 */
export function HeroVideoSection() {
  const [opacity, setOpacity] = useState(0);
  const [display, setDisplay] = useState(false);

  useEffect(() => {
    const unsub = useScrollStore.subscribe((state) => {
      const { activeAct, actProgress } = state;

      // Only show in Act 3 (Quantum), progress 0.2 - 0.8
      if (activeAct === 3 && actProgress >= 0.2 && actProgress <= 0.8) {
        // Fade in and out at the boundaries
        const fadeIn = Math.min((actProgress - 0.2) / 0.1, 1);
        const fadeOut = Math.min((0.8 - actProgress) / 0.1, 1);
        const fade = Math.min(fadeIn, fadeOut);

        setOpacity(fade);
        setDisplay(fade > 0.01);
      } else {
        setOpacity(0);
        setDisplay(false);
      }
    });

    return unsub;
  }, []);

  if (!display) return null;

  return (
    <div
      className="fixed bottom-8 right-8 pointer-events-auto"
      style={{
        zIndex: 8,
        opacity,
        transition: "opacity 0.3s ease",
      }}
    >
      {/* Card Container */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{
          width: 340,
          background: "rgba(8, 5, 13, 0.7)",
          borderColor: "rgba(208, 162, 255, 0.3)",
          backdropFilter: "blur(12px)",
          boxShadow:
            "0 8px 32px rgba(208, 162, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 border-b"
          style={{
            borderColor: "rgba(208, 162, 255, 0.2)",
            background: "linear-gradient(135deg, rgba(208, 162, 255, 0.05), rgba(99, 102, 241, 0.05))",
          }}
        >
          <h3 className="text-sm font-semibold text-purple-200">Quantum Metrics</h3>
          <p className="text-xs text-purple-300/60 mt-1">Live observation data</p>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {/* Metric 1: Superposition State */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-purple-300">Superposition</label>
              <span className="text-xs text-purple-400 font-mono">87%</span>
            </div>
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{
                background: "rgba(208, 162, 255, 0.15)",
              }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: "87%",
                  background: "linear-gradient(90deg, #d0a2ff, #c084fc)",
                }}
              />
            </div>
          </div>

          {/* Metric 2: Entanglement Index */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-purple-300">Entanglement</label>
              <span className="text-xs text-purple-400 font-mono">64%</span>
            </div>
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{
                background: "rgba(208, 162, 255, 0.15)",
              }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: "64%",
                  background: "linear-gradient(90deg, #a78bfa, #d0a2ff)",
                }}
              />
            </div>
          </div>

          {/* Metric 3: Wave Coherence */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-purple-300">Wave Coherence</label>
              <span className="text-xs text-purple-400 font-mono">92%</span>
            </div>
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{
                background: "rgba(208, 162, 255, 0.15)",
              }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: "92%",
                  background: "linear-gradient(90deg, #d0a2ff, #fbbf24)",
                }}
              />
            </div>
          </div>

          {/* Metric 4: Probability Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-purple-300">Probability Field</label>
              <span className="text-xs text-purple-400 font-mono">73%</span>
            </div>
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{
                background: "rgba(208, 162, 255, 0.15)",
              }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: "73%",
                  background: "linear-gradient(90deg, #ec4899, #d0a2ff)",
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-3 border-t text-center"
          style={{
            borderColor: "rgba(208, 162, 255, 0.2)",
            background: "rgba(208, 162, 255, 0.02)",
          }}
        >
          <p className="text-xs text-purple-300/50">Observation ongoing</p>
        </div>
      </div>
    </div>
  );
}
