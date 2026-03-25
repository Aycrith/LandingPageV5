"use client";

import { useScrollStore } from "@/stores/scrollStore";
import { useCapsStore } from "@/stores/capsStore";
import { InfiniteGridOverlay } from "./overlays/InfiniteGridOverlay";
import { FlowFieldCanvas } from "./overlays/FlowFieldCanvas";
import { VectorFieldCanvas } from "./overlays/VectorFieldCanvas";

export function ActSupportOverlay() {
  const activeAct = useScrollStore((state) => state.activeAct);
  const actProgress = useScrollStore((state) => state.actProgress);
  const caps = useCapsStore((state) => state.caps);

  if (!caps || caps.prefersReducedMotion) {
    return null;
  }

  return (
    <>
      <InfiniteGridOverlay />
      <FlowFieldCanvas
        visible={caps.tier === "high" && activeAct === 2}
        actProgress={actProgress}
        color="#d0a2ff"
      />
      <VectorFieldCanvas
        visible={caps.tier !== "low" && activeAct === 3}
        actProgress={actProgress}
      />
    </>
  );
}
