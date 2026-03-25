"use client";

import { motion } from "framer-motion";
import { ShatterButton } from "@/dom/ui/ShatterButton";

export function FuturisticCTA() {
  return (
    <section className="relative w-full min-h-screen flex flex-col items-center justify-center pointer-events-none p-6 md:p-24">
      {/* 
        No background color/gradient here! 
        We rely completely on the R3F GradientBlurBg shader below this DOM layer. 
      */}

      <motion.div 
        className="relative z-10 w-full max-w-4xl rounded-[2rem] border border-white/5 bg-background/20 backdrop-blur-3xl overflow-hidden p-12 md:p-24 text-center pointer-events-auto flex flex-col items-center shadow-2xl"
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <motion.div
           initial={{ opacity: 0, y: 20 }}
           whileInView={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.3, duration: 1 }}
        >
          <span className="inline-block py-1 px-3 rounded-full border border-white/10 bg-white/5 text-[10px] uppercase font-mono tracking-widest text-white/50 mb-8">
            Singularity Reached
          </span>
        </motion.div>

        <h2 className="text-5xl md:text-8xl font-thin tracking-tight text-white mb-6">
          <span className="block text-white/40 italic mb-2">Initialize</span>
          The Future.
        </h2>

        <p className="text-lg md:text-xl text-white/40 max-w-xl mx-auto font-light leading-relaxed mb-16">
          You&apos;ve explored the structural void and the fluid dynamics of interaction. Are you ready to deploy?
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-6 justify-center w-full">
           <ShatterButton className="w-full sm:w-auto min-w-[200px] text-sm tracking-widest uppercase">
             Begin Deployment
           </ShatterButton>
           <button className="text-xs uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors duration-300">
             or View Documentation
           </button>
        </div>
      </motion.div>
    </section>
  );
}
