"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface RippleButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  rippleColor?: string;
  duration?: string;
}

export function RippleButton({
  className,
  children,
  rippleColor = "rgba(255, 255, 255, 0.4)",
  duration = "600ms",
  onClick,
  ...props
}: RippleButtonProps) {
  const [buttonRipples, setButtonRipples] = useState<
    Array<{ x: number; y: number; size: number; key: number }>
  >([]);

  useEffect(() => {
    if (buttonRipples.length > 0) {
      const timeout = setTimeout(() => {
        setButtonRipples([]);
      }, parseInt(duration, 10));

      return () => clearTimeout(timeout);
    }
  }, [buttonRipples, duration]);

  const createRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const newRipple = { x, y, size, key: Date.now() };
    setButtonRipples((prevRipples) => [...prevRipples, newRipple]);

    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      className={cn(
        "relative overflow-hidden rounded-md bg-transparent px-4 py-2 font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      onClick={createRipple}
      {...props}
    >
      <div className="relative z-10">{children}</div>
      <span className="pointer-events-none absolute inset-0">
        {buttonRipples.map((ripple) => (
          <span
            className="absolute animate-ripple rounded-full"
            key={ripple.key}
            style={{
              width: ripple.size,
              height: ripple.size,
              top: ripple.y,
              left: ripple.x,
              backgroundColor: rippleColor,
              animationDuration: duration,
              transform: "scale(0)",
              opacity: 1,
            }}
          />
        ))}
      </span>
    </button>
  );
}
