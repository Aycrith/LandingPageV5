"use client";

import { motion } from "framer-motion";
import { ExpandCards } from "@/dom/ui/ExpandCards";

const featureData = [
  {
    id: "f1",
    title: "Quantum Simulation",
    subtitle: "Real-time Processing",
    description: "Harnessing the power of WebGL to compute abstract states continuously, creating a visually unbroken narrative flow."
  },
  {
    id: "f2",
    title: "Neural Pathways",
    subtitle: "Adaptive State Machine",
    description: "A logic layer that senses viewport constraints, adjusting GPU pressure in real-time without user intervention."
  },
  {
    id: "f3",
    title: "Architectural Purity",
    subtitle: "Zero-Overhead Design",
    description: "DOM elements seamlessly orchestrate with canonical React three-fiber graphs, collapsing z-indexes into unity."
  }
];

export function DataGridSection() {
  return (
    <section className="relative w-full min-h-screen flex items-center justify-center pointer-events-none py-24">
      {/* Decorative Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none z-0" />
      
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6">
        <motion.div 
          className="mb-16 md:w-1/2"
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-[10px] uppercase font-mono tracking-widest text-white/70">
              Structural Data
            </span>
          </div>
          <h2 className="text-4xl md:text-6xl font-light tracking-tight mb-6">
            Foundation <br/>
            <span className="text-white/40 italic">Constructs</span>
          </h2>
          <p className="text-white/50 font-light leading-relaxed">
            Beneath the rendering layer exists a hardened infrastructure mapping inputs to mathematical equivalents. Information flows instantly.
          </p>
        </motion.div>

        {/* Expand Cards wrapper - Re-enable pointers */}
        <motion.div 
          className="pointer-events-auto"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <ExpandCards items={featureData} />
        </motion.div>
      </div>
    </section>
  );
}
