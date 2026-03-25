"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface ShatterButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shards?: number;
  duration?: number;
}

interface ShardStyle {
  top: string;
  left: string;
  animationStyle: React.CSSProperties;
}

export function ShatterButton({
  className,
  children,
  shards = 20,
  duration = 0.8,
  onClick,
  ...props
}: ShatterButtonProps) {
  const [isShattered, setIsShattered] = useState(false);
  const [shardStyles, setShardStyles] = useState<ShardStyle[]>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isShattered) return;
    setShardStyles(
      Array.from({ length: shards }, () => {
        const randomX = (Math.random() - 0.5) * 200;
        const randomY = (Math.random() - 0.5) * 200;
        const randomRot = (Math.random() - 0.5) * 720;
        const time = duration + (Math.random() * 0.2 - 0.1);

        return {
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
          animationStyle: {
            "--tx": `${randomX}px`,
            "--ty": `${randomY}px`,
            "--rot": `${randomRot}deg`,
            animation: `shatter ${time}s cubic-bezier(0.1, 0.9, 0.2, 1) forwards`,
            transformOrigin: "center center",
            opacity: 1,
          } as React.CSSProperties,
        };
      })
    );
    setIsShattered(true);

    if (onClick) onClick(e);

    setTimeout(() => {
      setIsShattered(false);
      setShardStyles([]);
    }, duration * 1000 + 200);
  };

  return (
    <div className="relative inline-block overflow-visible">
      <button
        type="button"
        className={cn(
          "relative isolate px-6 py-3 font-semibold text-white bg-accent rounded-lg transition-transform hover:scale-105 active:scale-95",
          isShattered && "opacity-0 scale-95 pointer-events-none transition-none",
          className
        )}
        onClick={handleClick}
        {...props}
      >
        {children}
      </button>

      {isShattered && (
        <div className="absolute inset-0 z-50 pointer-events-none flex flex-wrap" style={{ width: "100%", height: "100%" }}>
          {shardStyles.map((shardStyle, i) => (
            <div
              key={i}
              className="absolute w-4 h-4 rounded-sm bg-accent mix-blend-screen"
              style={{
                top: shardStyle.top,
                left: shardStyle.left,
                ...shardStyle.animationStyle,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
