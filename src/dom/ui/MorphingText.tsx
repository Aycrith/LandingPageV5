"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface MorphingTextProps {
  texts: string[];
  className?: string;
  morphTime?: number;
  cooldownTime?: number;
}

export function MorphingText({
  texts,
  className,
  morphTime = 1,
  cooldownTime = 2.5,
}: MorphingTextProps) {
  const text1Ref = useRef<HTMLSpanElement>(null);
  const text2Ref = useRef<HTMLSpanElement>(null);
  const textIndex = useRef(0);
  const time = useRef(new Date());
  const morph = useRef(0);
  const cooldown = useRef(cooldownTime);

  useEffect(() => {
    let animationFrameId: number;

    const text1 = text1Ref.current;
    const text2 = text2Ref.current;
    if (!text1 || !text2) return;

    text1.textContent = texts[textIndex.current % texts.length];
    text2.textContent = texts[(textIndex.current + 1) % texts.length];

    const doMorph = () => {
      morph.current -= cooldown.current;
      cooldown.current = 0;

      let fraction = morph.current / morphTime;

      if (fraction > 1) {
        cooldown.current = cooldownTime;
        fraction = 1;
      }

      setMorph(fraction);

      if (fraction === 1) {
        textIndex.current++;
        text1.textContent = texts[textIndex.current % texts.length];
        text2.textContent = texts[(textIndex.current + 1) % texts.length];
        morph.current = 0;
      }
    };

    const setMorph = (fraction: number) => {
      if (!text1 || !text2) return;

      text2.style.filter = `blur(${Math.min(8 / fraction - 8, 100)}px)`;
      text2.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`;

      fraction = 1 - fraction;
      text1.style.filter = `blur(${Math.min(8 / fraction - 8, 100)}px)`;
      text1.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`;

      text1.textContent = texts[textIndex.current % texts.length];
      text2.textContent = texts[(textIndex.current + 1) % texts.length];
    };

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const newTime = new Date();
      const shouldIncrementIndex = cooldown.current > 0;
      const dt = (newTime.getTime() - time.current.getTime()) / 1000;
      time.current = newTime;

      cooldown.current -= dt;

      if (cooldown.current <= 0) {
        if (shouldIncrementIndex) {
          textIndex.current++;
        }
        doMorph();
      } else {
        doMorph();
      }
    };

    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, [texts, morphTime, cooldownTime]);

  return (
    <div className={cn("relative h-[4em] w-full flex items-center justify-center filter drop-shadow-md", className)}>
      <span
        ref={text1Ref}
        className="absolute inset-0 flex items-center justify-center text-center font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent to-white"
        style={{
          filter: "blur(0px)",
          opacity: 1,
        }}
      />
      <span
        ref={text2Ref}
        className="absolute inset-0 flex items-center justify-center text-center font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent to-white"
        style={{
          filter: "blur(100px)",
          opacity: 0,
        }}
      />
    </div>
  );
}
