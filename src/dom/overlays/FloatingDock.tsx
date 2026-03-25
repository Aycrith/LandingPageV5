"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Compass, Layers, Zap, Orbit } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { id: "hero", label: "Emergence", icon: Home },
  { id: "structure", label: "Structure", icon: Layers },
  { id: "flow", label: "Flow", icon: Compass },
  { id: "quantum", label: "Quantum", icon: Orbit },
  { id: "convergence", label: "Convergence", icon: Zap },
];

export function FloatingDock() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] pointer-events-auto">
      <div className="flex items-center gap-4 bg-background/40 backdrop-blur-xl border border-white/10 px-4 py-3 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)]">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isHovered = hoveredIndex === index;
          
          return (
            <button
              key={item.id}
              className="relative flex items-center justify-center p-3 rounded-xl transition-colors hover:bg-white/10 text-white/50 hover:text-accent group"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => {
                // To be wired to Act scrolling
              }}
            >
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.8 }}
                    className="absolute -top-12 px-3 py-1.5 bg-background/80 backdrop-blur border border-white/10 text-white text-xs whitespace-nowrap rounded-md"
                  >
                    {item.label}
                  </motion.div>
                )}
              </AnimatePresence>
              
              <motion.div
                animate={{
                  scale: isHovered ? 1.2 : 1,
                  y: isHovered ? -5 : 0
                }}
                transition={{ type: "spring", bounce: 0.5 }}
              >
                <Icon className="w-5 h-5" />
              </motion.div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
