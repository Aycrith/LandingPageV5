"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionItem {
  title: string;
  content: string;
}

export function Accordion({ items, className }: { items: AccordionItem[]; className?: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className={cn("w-full flex flex-col gap-2", className)}>
      {items.map((item, i) => {
        const isOpen = openIndex === i;

        return (
          <div 
            key={i} 
            className="border-b border-white/10 last:border-0 overflow-hidden"
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="w-full py-6 flex items-center justify-between text-left group"
            >
              <span className={cn(
                "text-2xl md:text-4xl font-light transition-colors duration-500",
                isOpen ? "text-accent" : "text-white/60 group-hover:text-white"
              )}>
                {item.title}
              </span>
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  "p-2 rounded-full border transition-colors",
                  isOpen ? "border-accent text-accent" : "border-white/10 text-white/40"
                )}
              >
                <ChevronDown className="w-5 h-5" />
              </motion.div>
            </button>
            
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <p className="pb-8 text-white/50 leading-relaxed font-light text-lg">
                    {item.content}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
