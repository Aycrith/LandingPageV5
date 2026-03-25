"use client";

import { motion } from "framer-motion";
import { Accordion } from "@/dom/ui/Accordion";

const flowData = [
  {
    title: "Organic Particles",
    content: "The flow field algorithm recalculates 60 times a second, guiding thousands of instances across an invisible mathematical topography."
  },
  {
    title: "Velocity Mapping",
    content: "Speed and trajectory are mapped to color gradients, creating an instinctual visual representation of the scene's underlying physics."
  },
  {
    title: "Fluid Dynamics",
    content: "Approximations of Navier-Stokes equations operate within the fragment shader, pushing noise into highly stylized, liquid abstractions."
  }
];

export function InteractiveFlowSection() {
  return (
    <section className="relative w-full min-h-screen flex items-center justify-end pointer-events-none py-24 px-6 md:px-12">
      <div className="relative z-10 w-full max-w-2xl pointer-events-auto">
        <motion.div
           initial={{ opacity: 0, x: 50 }}
           whileInView={{ opacity: 1, x: 0 }}
           viewport={{ once: true, margin: "-100px" }}
           transition={{ duration: 1 }}
           className="bg-background/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 md:p-12"
        >
          <h2 className="text-3xl md:text-5xl font-light mb-12">
            Simulated <br/>
            <span className="text-accent italic">Ecosystems</span>
          </h2>

          <Accordion items={flowData} />
        </motion.div>
      </div>
    </section>
  );
}
