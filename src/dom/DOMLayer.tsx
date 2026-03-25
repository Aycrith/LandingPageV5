"use client";

import { ACT_VIEWPORT_PROFILES } from "@/canvas/viewportProfiles";
import { useCapsStore } from "@/stores/capsStore";
import { ActContent } from "./ActContent";
import { PointerTracker } from "./PointerTracker";
import { ActSupportOverlay } from "./ActSupportOverlay";
import { MouseSpark } from "./ui/MouseSpark";

export function DOMLayer() {
  const caps = useCapsStore((state) => state.caps);
  const showMouseSpark =
    caps?.tier === "high" && !caps.prefersReducedMotion;

  return (
    <div className="dom-layer">
      <PointerTracker />
      <ActSupportOverlay />
      {showMouseSpark ? (
        <MouseSpark color="rgba(126, 242, 198, 0.55)" size={6} />
      ) : null}
      {ACT_VIEWPORT_PROFILES.map((profile) => (
        <ActContent key={profile.slug} profile={profile} />
      ))}
    </div>
  );
}
