"use client";

import { useRef, useEffect, useState } from "react";
import { useScrollStore } from "@/stores/scrollStore";
import { TextReveal } from "./TextReveal";
import { MagneticButton } from "./MagneticButton";

interface ActContentProps {
  id: number;
  title: string;
  subtitle: string;
  body?: string;
  cta?: boolean;
}

export function ActContent({ id, title, subtitle, body, cta }: ActContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [opacity, setOpacity] = useState(0);
  const [translateY, setTranslateY] = useState(40);

  useEffect(() => {
    let rafId: number;
    const update = () => {
      const { activeAct, actProgress } = useScrollStore.getState();
      const isActive = activeAct === id;
      const isNear = Math.abs(activeAct - id) <= 1;

      if (!isNear) {
        setIsVisible(false);
        setOpacity(0);
        rafId = requestAnimationFrame(update);
        return;
      }

      if (isActive) {
        let o = 1;
        if (actProgress < 0.3) {
          o = actProgress / 0.3;
        } else if (actProgress > 0.8) {
          o = 1 - (actProgress - 0.8) / 0.2;
        }

        const ty = (1 - Math.min(actProgress / 0.3, 1)) * 40;
        setOpacity(o);
        setTranslateY(ty);
        setIsVisible(o > 0.05);
      } else {
        setOpacity(0);
        setIsVisible(false);
      }

      rafId = requestAnimationFrame(update);
    };
    rafId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafId);
  }, [id]);

  return (
    <section ref={containerRef} className="act-section">
      <div
        className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center"
        style={{
          opacity,
          transform: `translateY(${translateY}px)`,
          willChange: "transform, opacity",
        }}
      >
        <h2
          className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white"
          style={{ fontFamily: "var(--font-heading), sans-serif" }}
        >
          <TextReveal text={title} trigger={isVisible} stagger={40} />
        </h2>
        <p className="mt-4 text-lg md:text-xl text-white/40 max-w-md">
          {subtitle}
        </p>
        {body && (
          <p className="mt-6 text-sm md:text-base text-white/25 max-w-lg leading-relaxed">
            {body}
          </p>
        )}
        {cta && (
          <div className="mt-10">
            <MagneticButton
              href="mailto:hello@example.com"
              className="px-8 py-4 border border-white/20 rounded-full text-white/80 text-sm uppercase tracking-widest hover:border-white/50 hover:text-white transition-colors duration-500"
            >
              Get in Touch
            </MagneticButton>
          </div>
        )}
      </div>
    </section>
  );
}
