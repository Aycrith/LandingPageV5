"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ExpandCardProps {
  id: string;
  title: string;
  subtitle: string;
  description: string;
}

export function ExpandCards({ items }: { items: ExpandCardProps[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <div className="flex flex-col md:flex-row gap-4 w-full h-[400px]">
      {items.map((item) => {
        const isActive = activeId === item.id;
        return (
          <motion.div
            key={item.id}
            layout
            onClick={() => setActiveId(isActive ? null : item.id)}
            className={cn(
              "relative rounded-2xl cursor-pointer overflow-hidden backdrop-blur-md bg-white/5 border border-white/10 transition-all duration-500",
              isActive ? "md:flex-[3]" : "md:flex-[1]",
              "flex-1"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent z-0" />
            
            {/* Ambient hover light */}
            <div className="absolute -inset-px opacity-0 hover:opacity-100 bg-gradient-to-r from-accent/20 to-transparent transition-opacity duration-500 pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full p-6 justify-end">
              <motion.h3 
                layout="position"
                className="text-xl md:text-2xl font-semibold mb-2"
              >
                {item.title}
              </motion.h3>
              
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="text-accent/80 font-mono text-xs uppercase mb-4 tracking-widest">
                      {item.subtitle}
                    </p>
                    <p className="text-white/60 text-sm leading-relaxed">
                      {item.description}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {!isActive && (
                <div className="absolute right-6 bottom-6 hidden md:block">
                  <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center">
                    <span className="text-white/60 text-lg">+</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
