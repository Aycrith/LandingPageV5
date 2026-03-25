"use client";

import { useEffect, useRef } from "react";
import createGlobe from "cobe";

interface CobeWidgetProps {
  actProgress: number;
  visible: boolean;
}

const MARKERS = [
  { location: [37.7749, -122.4194] as [number, number], size: 0.05 },
  { location: [51.5074, -0.1278] as [number, number], size: 0.04 },
  { location: [35.6762, 139.6503] as [number, number], size: 0.05 },
  { location: [-33.8688, 151.2093] as [number, number], size: 0.04 },
  { location: [19.076, 72.8777] as [number, number], size: 0.04 },
];

export function CobeWidget({ actProgress, visible }: CobeWidgetProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeRef = useRef<any>(null);
  const phiRef = useRef(0);

  useEffect(() => {
    if (!visible || !canvasRef.current) return;

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: Math.min(window.devicePixelRatio, 2),
      width: 300,
      height: 300,
      phi: 0,
      theta: 0.2,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.1, 0.3, 0.5],
      markerColor: [0.42, 0.78, 1],
      glowColor: [0.2, 0.5, 0.9],
      markers: MARKERS,
    });
    globeRef.current = globe;

    let animId: number;
    const animate = () => {
      phiRef.current += 0.004;
      globe.update({ phi: phiRef.current });
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      globe.destroy();
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-8 right-8"
      style={{
        zIndex: 8,
        opacity: actProgress,
        transition: "opacity 0.5s ease",
        width: 150,
        height: 150,
      }}
    >
      <canvas
        ref={canvasRef}
        width={300}
        height={300}
        style={{ width: 150, height: 150 }}
      />
    </div>
  );
}
