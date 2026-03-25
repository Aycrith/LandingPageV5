"use client";

import { useScrollStore } from "@/stores/scrollStore";
import { useSceneLoadStore, isSceneStartupReady } from "@/stores/sceneLoadStore";
import { cn } from "@/lib/utils";
import { LoadingScreen } from "./LoadingScreen";
import { FloatingDock } from "./overlays/FloatingDock";
import { MouseSpark } from "./ui/MouseSpark";

import { CybercoreHero } from "./sections/CybercoreHero";
import { DataGridSection } from "./sections/DataGridSection";
import { InteractiveFlowSection } from "./sections/InteractiveFlowSection";
import { SpatialGallerySection } from "./sections/SpatialGallerySection";
import { FuturisticCTA } from "./sections/FuturisticCTA";

// Minimal wrapper for sections to manage pointer events and opacity fades 
function FixedSection({
  actIndex,
  children,
  className,
}: {
  actIndex: number;
  children: React.ReactNode;
  className?: string;
}) {
  const activeAct = useScrollStore((s) => s.activeAct);
  const actProgress = useScrollStore((s) => s.actProgress);
  const scrollIndex = activeAct + actProgress;
  
  // Crossfade between acts based on fractional scroll index
  const distance = Math.abs(scrollIndex - actIndex);
  const opacity = Math.max(0, 1 - distance * 1.5); 
  
  const isVisible = opacity > 0.01;
  const isActive = opacity > 0.8; 

  return (
    <div
      className={cn(
        "absolute inset-0 transition-opacity duration-300 pointer-events-none",
        isActive ? "z-10" : "z-0", // elevate the active layer to catch pointer events
        className
      )}
      style={{
        opacity,
        visibility: isVisible ? "visible" : "hidden",
      }}
    >
      <div 
        className={cn(
          "w-full h-full",
          isActive ? "pointer-events-auto" : "pointer-events-none"
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function GlobalOverlay() {
  const isLoaded = useSceneLoadStore(isSceneStartupReady);

  return (
    <>
      <MouseSpark color="rgba(100,200,255,0.6)" size={8} />

      {/* Primary Canvas Overlay - fixed full screen */}
      <div className="fixed inset-0 pointer-events-none z-10 w-full h-full text-white">
        
        <FixedSection actIndex={0}>
          <CybercoreHero />
        </FixedSection>

        <FixedSection actIndex={1}>
          <DataGridSection />
        </FixedSection>
        
        <FixedSection actIndex={2}>
          <InteractiveFlowSection />
        </FixedSection>

        <FixedSection actIndex={3}>
          <SpatialGallerySection />
        </FixedSection>

        <FixedSection actIndex={4}>
          <FuturisticCTA />
        </FixedSection>

      </div>

      {!isLoaded && <LoadingScreen />}

      {isLoaded && <FloatingDock />}
    </>
  );
}
