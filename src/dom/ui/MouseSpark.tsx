"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Sparkle {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  color?: string;
  size?: number;
}

export function MouseSpark({
  className,
  color = "#ffffff",
  size = 6,
}: {
  className?: string;
  color?: string;
  size?: number;
}) {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (Math.random() > 0.3) return; // Only spawn on some frames

      const newSparkle: Sparkle = {
        id: Date.now() + Math.random(),
        x: e.clientX,
        y: e.clientY,
        targetX: e.clientX + (Math.random() - 0.5) * 40,
        targetY: e.clientY + 40 + Math.random() * 40,
        color,
        size: size + Math.random() * 4 - 2,
      };

      setSparkles((prev) => [...prev, newSparkle]);

      // Remove spark after a bit
      setTimeout(() => {
        setSparkles((prev) => prev.filter((s) => s.id !== newSparkle.id));
      }, 700);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [color, size]);

  return (
    <div className={cn("pointer-events-none fixed inset-0 z-50", className)}>
      <AnimatePresence>
        {sparkles.map((sparkle) => (
          <motion.div
            key={sparkle.id}
            initial={{ opacity: 1, scale: 1, x: sparkle.x, y: sparkle.y }}
            animate={{
              opacity: 0,
              scale: 0,
              y: sparkle.targetY,
              x: sparkle.targetX,
            }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="absolute rounded-full pointer-events-none shadow-[0_0_10px_2px_rgba(255,255,255,0.8)] mix-blend-screen"
            style={{
              width: sparkle.size,
              height: sparkle.size,
              backgroundColor: sparkle.color,
              boxShadow: `0 0 10px 2px ${sparkle.color}`,
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
