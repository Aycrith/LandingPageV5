"use client";

import React, { useRef, useEffect, useState } from "react";

interface QuantumCollapseTextProps {
  children: React.ReactNode;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  className?: string;
  delay?: number;
}

/**
 * Typography that starts as a blurry, probabilistic state and "collapses"
 * into sharp existence when it enters the viewport — simulating quantum
 * wave-function collapse.
 *
 * Pre-collapse: blur(12px), wide letter-spacing, multiple low-opacity text-shadows
 * On entry: snaps to sharp focus via cubic-bezier(0.16, 1, 0.3, 1) overshoot
 */
export function QuantumCollapseText({
  children,
  as: Tag = "span",
  className = "",
  delay = 0,
}: QuantumCollapseTextProps) {
  const ref = useRef<HTMLElement>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const timer = window.setTimeout(() => setCollapsed(true), delay);
          observer.disconnect();
          return () => clearTimeout(timer);
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  const baseStyle: React.CSSProperties = {
    display: "inline-block",
    transition: `
      filter 0.6s cubic-bezier(0.16, 1, 0.3, 1),
      letter-spacing 0.6s cubic-bezier(0.16, 1, 0.3, 1),
      opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
      text-shadow 0.6s cubic-bezier(0.16, 1, 0.3, 1)
    `,
  };

  const uncollapsedStyle: React.CSSProperties = {
    filter: "blur(12px)",
    letterSpacing: "0.4em",
    opacity: 0.25,
    textShadow: [
      "0 0 40px rgba(0, 204, 255, 0.4)",
      "0 0 80px rgba(51, 0, 170, 0.3)",
      "0 0 120px rgba(0, 255, 238, 0.15)",
    ].join(", "),
  };

  const collapsedStyle: React.CSSProperties = {
    filter: "blur(0px)",
    letterSpacing: "inherit",
    opacity: 1,
    textShadow: [
      "0 0 8px rgba(0, 204, 255, 0.6)",
      "0 0 20px rgba(0, 255, 238, 0.2)",
    ].join(", "),
  };

  return (
    <Tag
      ref={ref as React.Ref<never>}
      className={className}
      style={{
        ...baseStyle,
        ...(collapsed ? collapsedStyle : uncollapsedStyle),
      }}
    >
      {children}
    </Tag>
  );
}
