"use client";

import { ActContent } from "./ActContent";

const acts = [
  {
    id: 0,
    title: "Emergence",
    subtitle: "From the void, light finds form",
    body: "Every creation begins with a single spark — an idea that refuses to stay silent.",
  },
  {
    id: 1,
    title: "Structure",
    subtitle: "Order crystallizes from chaos",
    body: "Systems. Frameworks. The architecture of thought made tangible.",
  },
  {
    id: 2,
    title: "Flow",
    subtitle: "Currents shape the unseen",
    body: "When craft meets intuition, work becomes effortless motion.",
  },
  {
    id: 3,
    title: "Quantum",
    subtitle: "Reality splits and recombines",
    body: "Explore every possibility. Hold contradictions. Find truth in paradox.",
  },
  {
    id: 4,
    title: "Convergence",
    subtitle: "All paths lead here",
    body: "Let's build something together.",
    cta: true,
  },
];

export function DOMLayer() {
  return (
    <div className="dom-layer">
      {acts.map((act) => (
        <ActContent key={act.id} {...act} />
      ))}
    </div>
  );
}
