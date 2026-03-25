"use client";

import { WORLD_PHASES } from "@/canvas/viewportProfiles";
import { useScrollStore } from "@/stores/scrollStore";
import { useUIStore } from "@/stores/uiStore";
import { PointerTracker } from "./PointerTracker";

export function DOMLayer() {
  const activeAct = useScrollStore((state) => state.activeAct);
  const setCtaFocused = useUIStore((state) => state.setCtaFocused);
  const finalPhase = WORLD_PHASES[WORLD_PHASES.length - 1];

  return (
    <div className="dom-layer">
      <PointerTracker />

      {WORLD_PHASES.map((phase) => (
        <section key={phase.slug} className="act-section">
          <div className="sr-only">
            <p>{phase.copy.eyebrow}</p>
            <h2>{phase.copy.title}</h2>
            <p>{phase.copy.subtitle}</p>
            {phase.copy.body ? <p>{phase.copy.body}</p> : null}
          </div>
        </section>
      ))}

      {finalPhase.copy.ctaLabel && finalPhase.copy.ctaHref ? (
        <a
          href={finalPhase.copy.ctaHref}
          target="_blank"
          rel="noopener noreferrer"
          className="world-cta-hitbox"
          aria-label={finalPhase.copy.ctaLabel}
          style={{
            opacity: activeAct === WORLD_PHASES.length - 1 ? 1 : 0,
            pointerEvents: activeAct === WORLD_PHASES.length - 1 ? "auto" : "none",
          }}
          onFocus={() => setCtaFocused(true)}
          onBlur={() => setCtaFocused(false)}
          onMouseEnter={() => setCtaFocused(true)}
          onMouseLeave={() => setCtaFocused(false)}
        >
          <span className="sr-only">{finalPhase.copy.ctaLabel}</span>
        </a>
      ) : null}
    </div>
  );
}
