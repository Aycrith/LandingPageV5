"use client";

import { useRef, useCallback, ReactNode } from "react";

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  href?: string;
  strength?: number;
}

export function MagneticButton({
  children,
  className = "",
  href,
  strength = 0.3,
}: MagneticButtonProps) {
  const buttonRef = useRef<HTMLAnchorElement | HTMLButtonElement>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      buttonRef.current.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
    },
    [strength]
  );

  const handleMouseLeave = useCallback(() => {
    if (!buttonRef.current) return;
    buttonRef.current.style.transform = "translate(0, 0)";
    buttonRef.current.style.transition = "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)";
    setTimeout(() => {
      if (buttonRef.current) buttonRef.current.style.transition = "";
    }, 400);
  }, []);

  const props = {
    ref: buttonRef as React.Ref<HTMLAnchorElement>,
    className: `inline-block cursor-pointer ${className}`,
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
  };

  if (href) {
    return (
      <a {...props} href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }

  return (
    <button
      {...(props as unknown as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      ref={buttonRef as React.Ref<HTMLButtonElement>}
    >
      {children}
    </button>
  );
}
