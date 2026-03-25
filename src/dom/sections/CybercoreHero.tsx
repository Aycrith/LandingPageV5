"use client";

import { motion } from "framer-motion";
import { MorphingText } from "@/dom/ui/MorphingText";
import { RippleButton } from "@/dom/ui/RippleButton";

export function CybercoreHero() {
  const texts = [
    "IMMERSION",
    "INTERACTION",
    "EXPANSION",
    "EVOLUTION",
    "EMERGENCE"
  ];

  return (
    <section className="relative w-full h-screen overflow-hidden bg-transparent flex flex-col items-center justify-center pt-24 pb-12 pointer-events-none">
      
      {/* HUD Borders / Framework framing */}
      <div className="absolute inset-8 border border-white/5 rounded-3xl pointer-events-none" />
      <div className="absolute inset-8 border border-white/10 rounded-3xl [clip-path:polygon(0_0,20px_0,0_20px)] pointer-events-none" />
      <div className="absolute inset-8 border border-white/10 rounded-3xl [clip-path:polygon(100%_0,calc(100%-20px)_0,100%_20px)] pointer-events-none" />
      
      <motion.div 
        className="relative z-10 flex flex-col items-center max-w-4xl text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      >
        <div className="flex items-center gap-3 mb-8">
           <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
           <p className="text-xs tracking-[0.4em] uppercase text-accent/80 font-mono">
             System Activated
           </p>
        </div>

        <MorphingText 
           texts={texts} 
           className="text-6xl md:text-8xl tracking-tight mb-8 pointer-events-auto" 
        />

        <p className="text-lg md:text-xl text-white/40 max-w-2xl font-light mb-12">
           Beyond boundaries. An architectural manifesto rendered in complete real-time fidelity.
        </p>

        <div className="pointer-events-auto mt-4">
          <RippleButton 
             className="bg-transparent border border-white/10 hover:border-accent hover:bg-accent/5 hover:text-accent text-white font-mono text-xs tracking-wider rounded-none px-8 py-4 transition-all duration-500"
          >
            ENTER THE NEXUS
          </RippleButton>
        </div>
      </motion.div>

      {/* Bottom scroll indicator */}
      <motion.div 
        className="absolute bottom-12 flex flex-col items-center gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
      >
        <span className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-mono rotate-90 mb-8">
          SCROLL
        </span>
        <div className="w-px h-16 bg-gradient-to-b from-white/20 to-transparent" />
      </motion.div>
    </section>
  );
}
