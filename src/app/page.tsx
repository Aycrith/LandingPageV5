"use client";

import dynamic from "next/dynamic";
import { LoadingScreen } from "@/dom/LoadingScreen";
import { DOMLayer } from "@/dom/DOMLayer";
import { ScrollWrapper } from "@/dom/ScrollWrapper";
import { AudioManager } from "@/dom/AudioManager";
import { CanvasErrorBoundary } from "@/canvas/CanvasErrorBoundary";

const Experience = dynamic(() => import("@/canvas/Experience"), {
  ssr: false,
});

export default function Home() {
  return (
    <>
      <LoadingScreen />
      <div className="canvas-container">
        <CanvasErrorBoundary>
          <Experience />
        </CanvasErrorBoundary>
      </div>
      <ScrollWrapper>
        <DOMLayer />
      </ScrollWrapper>
      <AudioManager />
    </>
  );
}
