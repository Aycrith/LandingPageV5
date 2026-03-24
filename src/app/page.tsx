"use client";

import dynamic from "next/dynamic";
import { LoadingScreen } from "@/dom/LoadingScreen";
import { DOMLayer } from "@/dom/DOMLayer";
import { ScrollWrapper } from "@/dom/ScrollWrapper";

const Experience = dynamic(() => import("@/canvas/Experience"), {
  ssr: false,
});

export default function Home() {
  return (
    <>
      <LoadingScreen />
      <div className="canvas-container">
        <Experience />
      </div>
      <ScrollWrapper>
        <DOMLayer />
      </ScrollWrapper>
    </>
  );
}
