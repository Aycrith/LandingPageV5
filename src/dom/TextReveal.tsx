"use client";

import { useRef, useEffect, useMemo } from "react";

interface TextRevealProps {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
  trigger?: boolean;
}

export function TextReveal({
  text,
  className = "",
  delay = 0,
  stagger = 30,
  trigger = true,
}: TextRevealProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const hasRevealed = useRef(false);

  const chars = useMemo(() => text.split(""), [text]);

  useEffect(() => {
    if (!trigger || hasRevealed.current || !containerRef.current) return;
    hasRevealed.current = true;

    const spans = containerRef.current.querySelectorAll<HTMLSpanElement>(".char");
    spans.forEach((span, i) => {
      const charDelay = delay + i * stagger;
      span.style.transition = `transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${charDelay}ms, opacity 0.6s ease ${charDelay}ms`;
      span.style.transform = "translateY(0)";
      span.style.opacity = "1";
    });
  }, [trigger, delay, stagger]);

  return (
    <span ref={containerRef} className={`inline-block ${className}`}>
      {chars.map((char, i) => (
        <span
          key={i}
          className="char inline-block"
          style={{
            transform: "translateY(100%)",
            opacity: 0,
          }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  );
}
