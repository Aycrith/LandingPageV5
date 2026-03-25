"use client";

import { useState } from "react";

/**
 * OdysseyHero - Lightning-bolt pre-intro section
 * Shows before Act 0 starts (progress < 0.0) with animated lightning arcs
 * Pure CSS + SVG, no solid background (transparent to show canvas)
 */
export function OdysseyHero() {
  const [isVisible] = useState(true);

  return (
    <div
      className={`fixed inset-0 pointer-events-none overflow-hidden transition-opacity duration-500 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      style={{ zIndex: 7, background: "transparent" }}
    >
      {/* SVG Lightning Container */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
        style={{ filter: "drop-shadow(0 0 8px #00ffff)" }}
      >
        {/* Animated Lightning Bolt 1 - Top Left */}
        <g
          style={{
            animation: "lightning-pulse 3s ease-in-out infinite",
            strokeWidth: 2,
            stroke: "#00ffff",
            fill: "none",
          }}
        >
          <polyline points="200,50 180,150 210,200 190,300 220,350 200,450" />
        </g>

        {/* Animated Lightning Bolt 2 - Top Right */}
        <g
          style={{
            animation: "lightning-pulse 3s ease-in-out infinite 0.5s",
            strokeWidth: 2,
            stroke: "#6366f1",
            fill: "none",
          }}
        >
          <polyline points="1750,80 1780,180 1750,250 1780,360 1750,420 1770,520" />
        </g>

        {/* Animated Lightning Bolt 3 - Center */}
        <g
          style={{
            animation: "lightning-pulse 3s ease-in-out infinite 1s",
            strokeWidth: 1.5,
            stroke: "#00ffff",
            fill: "none",
            opacity: 0.6,
          }}
        >
          <polyline points="950,100 930,220 970,300 940,420 980,500 950,600" />
        </g>
      </svg>

      {/* Logo / Navigation Bar */}
      <div className="absolute top-0 left-0 right-0 h-20 pointer-events-auto bg-gradient-to-b from-black/40 to-transparent border-b border-cyan-500/20 flex items-center justify-between px-8">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded"
            style={{
              background: "linear-gradient(135deg, #00ffff, #6366f1)",
              boxShadow: "0 0 12px rgba(0, 255, 255, 0.5)",
            }}
          />
          <span className="text-white font-bold tracking-wide text-lg">ODYSSEY</span>
        </div>

        {/* Feature Tags */}
        <div className="flex gap-2 text-xs">
          <div className="px-3 py-1 border border-cyan-500/40 rounded text-cyan-300 bg-cyan-500/5 hover:bg-cyan-500/10 transition-colors">
            Interactive
          </div>
          <div className="px-3 py-1 border border-indigo-500/40 rounded text-indigo-300 bg-indigo-500/5 hover:bg-indigo-500/10 transition-colors">
            Immersive
          </div>
          <div className="px-3 py-1 border border-pink-500/40 rounded text-pink-300 bg-pink-500/5 hover:bg-pink-500/10 transition-colors">
            Narrative
          </div>
        </div>
      </div>

      {/* Center Title / Tagline */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <h1
          className="text-6xl font-bold mb-4 text-center tracking-tight"
          style={{
            background: "linear-gradient(135deg, #00ffff, #6366f1, #ec4899)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            animation: "fade-in-up 1s ease-out 0.3s both",
          }}
        >
          Every Creation Begins With A Spark
        </h1>
        <p
          className="text-lg text-cyan-300/80 max-w-lg text-center"
          style={{
            animation: "fade-in-up 1s ease-out 0.6s both",
          }}
        >
          An immersive journey through emergence, structure, flow, quantum possibilities, and convergence.
        </p>
      </div>

      {/* Glow Orbs (subtle accent) */}
      <div
        className="absolute top-1/4 left-1/4 w-40 h-40 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(0,255,255,0.2) 0%, rgba(0,255,255,0) 70%)",
          filter: "blur(40px)",
          animation: "float 4s ease-in-out infinite",
        }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-40 h-40 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, rgba(99,102,241,0) 70%)",
          filter: "blur(40px)",
          animation: "float 5s ease-in-out infinite 1s",
        }}
      />

      {/* CSS Animations */}
      <style>{`
        @keyframes lightning-pulse {
          0%, 100% {
            opacity: 0;
            filter: drop-shadow(0 0 4px currentColor);
          }
          10% {
            opacity: 1;
            filter: drop-shadow(0 0 16px currentColor);
          }
          15% {
            opacity: 0.3;
            filter: drop-shadow(0 0 8px currentColor);
          }
          20% {
            opacity: 1;
            filter: drop-shadow(0 0 16px currentColor);
          }
          25% {
            opacity: 0;
            filter: drop-shadow(0 0 4px currentColor);
          }
          100% {
            opacity: 0;
            filter: drop-shadow(0 0 4px currentColor);
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
      `}</style>
    </div>
  );
}
