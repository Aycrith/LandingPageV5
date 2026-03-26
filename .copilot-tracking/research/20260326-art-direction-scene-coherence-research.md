<!-- markdownlint-disable-file -->

# Task Research Notes: artistic_direction_scene_coherence

## Research Executed

### File Analysis

- `AGENTS.md`
  - Verified project conventions: client-only 3D canvas, runtime stability over ambition, strict hooks rules, preserve shader loading, and keep heavy runtime logic in `src/canvas/`.
- `README.md`
  - Confirmed current project framing as a 5-act scroll-driven 3D experience with adaptive quality and audit tooling.
- `docs/EVOLUTION_STRATEGY.md`
  - Verified intended architecture: continuous scroll-driven experience, SplineEngine-style continuity, wrap-aware transitions, performance budgets, and evolution toward metamorphic geometry.
- `ARTISTIC_ALIGNMENT_MANIFESTO.md`
  - Captured prior diagnosis: excessive overlapping alpha layers, high triangle count, and the need to move from accumulation to intentionality.
- `ArtDirectionRefinement.md`
  - Captured prior user intent emphasizing full-scene immersion, higher material fidelity, cinematic continuity, and procedural systems as support rather than dominant content.
- `WebGL_Performance_Report.md`
  - Verified concrete issues: 438,390 triangles in Act 0 and repeated warnings for 40 overlapping alpha meshes.
- `src/canvas/Experience.tsx`
  - Confirmed scene root: `Canvas` → `StartupReadinessGate` → `ViewportAuditProbe` → `CameraRig` → `SceneManager` → `PostProcessingStack`.
- `src/canvas/SceneManager.tsx`
  - Confirmed lighting, fog, environment, and cross-act interpolation are centralized and already structured for art-direction control.
- `src/canvas/SeamlessWorld.tsx`
  - Verified root cause of visual overload: multiple procedural layer families remain active as weighted overlays and can compete with curated heroes if not tightly art-directed.
- `src/canvas/CuratedHeroLayer.tsx`
  - Confirmed curated GLTF hero assets are already treated as primary anchors, with material grading and LOD support.
- `src/canvas/camera/CameraRig.tsx`
  - Verified current camera is smoother than legacy static setups, but still uses lightweight curve interpolation and mouse parallax rather than a more explicit cinematic shot grammar.
- `src/canvas/postfx/PostProcessingStack.tsx`
  - Confirmed post-processing is intentionally restrained but currently broad/global rather than acting as a precise narrative accent.
- `src/canvas/viewportProfiles.ts`
  - Verified the strongest existing control surface for art direction: each act already defines accent, lighting, fog, motion, post-FX, composition zone, safe text zone, and hero behavior.
- `src/canvas/acts/Act1Emergence.tsx`
  - Verified Seed act still contains layered procedural rings/glow/lens treatments that can read as placeholder rather than authored sculpture.
- `src/canvas/acts/Act2Structure.tsx`
  - Verified Scaffold act remains visually geometric and busy, with orbiting bodies competing with the globe/scaffold identity.
- `src/canvas/acts/Act3Flow.tsx`
  - Verified Circulation act has strong motion potential but the surface/ribbon/conduit stack risks feeling demo-like if not subordinated.
- `src/canvas/acts/Act4Quantum.tsx`
  - Verified Sentience/Quantum pairing currently introduces dual-hero complexity and a sixth-act branch that dilutes the original five-act emotional climb.
- `src/canvas/acts/Act5Convergence.tsx`
  - Verified Apotheosis climax is conceptually strong but the crown/vortex/trails composition is still more schematic than transcendent.
- `src/dom/ScrollWrapper.tsx`
  - Confirmed scroll remains normalized to `NUM_ACTS = 6`, which currently conflicts with README/evolution docs describing a 5-act narrative.
- `src/dom/ActContent.tsx`
  - Verified text overlays follow act-safe-zone logic; they are not the main cause of incoherence, though they influence composition constraints.

### Code Search Results

- `SceneManager|SeamlessWorld|CuratedHeroLayer|CameraRig|PostProcessingStack`
  - Found the actual orchestration path responsible for scene composition, camera motion, and act blending.
- `WORLD_PHASES`
  - Found six act definitions, including a later-added `quantum` act that extends beyond the documented five-act structure.
- `ambientParticleMode|overlayMode|postFxProfile|lightingRig|compositionZone`
  - Found that the codebase already has a robust vocabulary for disciplined art direction, but the implementation currently overuses simultaneous procedural presence.
- `High transparency overdraw risk`
  - Found repeated audit warnings documenting alpha-stacking as a root technical and visual problem.

### External Research

- #fetch:https://www.dragonfly.xyz/
  - Page content was mostly marketing/site shell and limited for visual analysis in fetched text; still confirms sparse branding and restrained information density rather than effects overload.
- #fetch:https://activetheory.net/
  - Fetched output was JS-gated; usable takeaway is that the site depends on runtime rendering, so architectural imitation should come from known behavioral patterns rather than scraped content.
- #fetch:https://lhbzr.com/
  - Fetched output was browser-gate shell only; confirms reliance on a tightly controlled, modern rendering experience.
- #fetch:https://mont-fort.com/
  - Content confirms a premium site strategy built on slow, deliberate section pacing and strong hierarchy rather than perpetual visual escalation.
- #fetch:https://www.adaline.ai/
  - Fetched output returned client error; no authoritative pattern extracted.
- #fetch:https://dogstudio.co/
  - Verified positioning around “emotional experiences” and featured immersive case studies; useful as qualitative support for narrative-first pacing.
- #fetch:https://21st.dev/community/components/aliimam/glsl-hills/default
  - Verified this reference is best suited as a restrained atmospheric or topographic backdrop, not as a competing hero centerpiece.
- #fetch:https://21st.dev/community/components/thanh/neon-orbs/default
  - Verified this reference is best used as contained luminous energy accenting structure, not as a dominant field across a full act.
- #fetch:https://21st.dev/community/components/dhiluxui/aura-core/default
  - Verified this reference is fundamentally an energy-source visual; best used sparingly around a focal core or circulation nexus.
- #fetch:https://21st.dev/community/components/aliimam/space-background/default
  - Verified this reference is appropriate as depth field and parallax atmosphere behind heroes, especially for sentience/cosmic acts.
- #fetch:https://21st.dev/community/components/ashishrajwaniai01/asmr-background/default
  - Verified this reference provides a mouse-reactive particulate friction field with vortex behavior; best used as a subtle environmental skin, not as primary content.
- #fetch:https://21st.dev/community/components/aliimam/stars-canvas/default
  - Verified this reference is best for climax-scale infinite depth and spatial continuation, especially in final apotheosis moments.

### Project Conventions

- Standards referenced: Next.js 16.2.1 + React 19.2 + R3F 9; strict hooks rules; client-only experience; runtime stability over ambition; hero assets should remain dominant; procedural systems should support, not compete.
- Instructions followed: only research file creation under `.copilot-tracking/research/`; no source edits; verified findings only; consolidate toward one chosen approach.

## Key Discoveries

### Project Structure

The project already contains most of the infrastructure needed for a disciplined art-directed experience. The strongest assets are not missing features but the existing control architecture: `WORLD_PHASES` encodes each act’s color system, lighting rig, fog profile, motion rig, composition zone, safe text zone, hero behavior, and post-FX profile. `SceneManager.tsx` smoothly blends those parameters, and `CuratedHeroLayer.tsx` already treats GLTF assets as hero anchors.

The main issue is not a lack of systemization; it is direction drift. Over time, additional procedural systems and a sixth `quantum` phase were layered in, making the scene read as an additive showcase of ideas rather than a singular authored experience. The resulting presentation conflicts with the documented five-act narrative in `README.md` and `docs/EVOLUTION_STRATEGY.md`.

### Implementation Patterns

Three patterns explain why the scene feels “like a crazy person hallucination” instead of a work of art:

1. **Hero dilution**
   - Curated hero assets exist, but many acts also stack rings, ribbons, conduits, particle clouds, glow meshes, trails, atmospheric fog planes, and environmental shaders in the same visual moment.
   - This causes the eye to lose the primary subject.

2. **Narrative over-extension**
   - The documented emotional arc is five acts: emergence → structure → flow → sentience → apotheosis.
   - The live scene has six acts because `WORLD_PHASES` includes `quantum`, and `scrollStore.ts` uses `NUM_ACTS = 6`.
   - This weakens the climax because apotheosis stops being the terminal emotional peak.

3. **Procedural systems lack a strict support contract**
   - The project has a repeated user intent that procedural systems must augment curated assets, not replace them.
   - Current implementation still allows procedural layers to become visually dominant in multiple acts, especially where multiple transparent or emissive systems overlap.

### Complete Examples

```typescript
// Existing strongest art-direction control surface
export interface WorldPhaseProfile {
  id: number;
  slug: string;
  heroLabel: string;
  heroAsset: HeroAssetId;
  accent: string;
  copy: ActCopy;
  previewCamera: CameraPose;
  settleCamera: CameraPose;
  worldAnchor: Vec3Tuple;
  stageVolume: {
    radius: number;
    depth: number;
    height: number;
  };
  materialGrade: MaterialGradeProfile;
  lightingRig: LightRig;
  fogProfile: FogProfile;
  uiRig: VolumetricUIRig;
  compositionZone: CompositionZone;
  motionRig: MotionRig;
  transitionRig: TransitionRig;
  maxModelViewportFill: number;
  heroModelBehavior: HeroModelBehavior;
  fxLayerBehavior: FxLayerBehavior;
  textSafeZone: TextSafeZone;
  postFxProfile: PostFxProfile;
  overlayMode: OverlayMode;
  ambientParticleMode: AmbientParticleMode;
  tierOverrides: Partial<Record<PresentationTier, TierPresentationOverride>>;
}
```

```typescript
// Verified source of current narrative drift
const NUM_ACTS = 6;

export const useScrollStore = create<ScrollState>((set) => ({
  progress: 0,
  velocity: 0,
  direction: 0,
  activeAct: 0,
  actProgress: 0,
  setScroll: (progress, velocity, direction) => {
    const clamped = Math.max(0, Math.min(1, progress));
    const scaled = clamped * NUM_ACTS;
    const activeAct = Math.min(Math.floor(scaled), NUM_ACTS - 1);
    const actProgress = scaled - activeAct;
```

```markdown
# Verified telemetry evidence
- Triangles: 438,390 in Act 0
- Draw calls: 72 in Act 0
- High transparency overdraw risk: 40 overlapping alpha meshes
```

### API and Schema Documentation

- `SceneManager.tsx` is the correct orchestration layer for lighting, fog, environment, and cross-act interpolation.
- `SeamlessWorld.tsx` is the correct place to gate and simplify support FX by act presence and tier.
- `CuratedHeroLayer.tsx` is the correct place to elevate hero materials, tighten silhouette control, and keep the focal subject dominant.
- `viewportProfiles.ts` is the correct source of truth for a future art bible because it already holds lighting, motion, composition, material, and text-zone parameters.

### Configuration Examples

```typescript
// Existing per-act art controls already present in viewportProfiles.ts
postFxProfile: {
  bloomThreshold: 0.92,
  bloomSmoothing: 0.028,
  bloomIntensity: 0.4,
  vignetteOffset: 0.24,
  vignetteDarkness: 0.72,
  chromaticOffset: 0,
},
overlayMode: "apotheosis",
ambientParticleMode: "sparse",
```

### Technical Requirements

- Preserve `src/app/page.tsx` dynamic canvas loading and client-only rendering.
- Keep heavy runtime logic in `src/canvas/` and continue coordinating state through Zustand.
- Maintain React hooks correctness and avoid render-time randomness unless deterministic or memoized.
- Respect current performance budgets and reduce alpha overdraw before adding any additional atmospheric effects.
- Use reference components as aesthetic prompts only; do not copy them wholesale into the composition if they compete with curated assets.

## Recommended Approach

Adopt a **Hero-First Curated Cinematic Direction** and remove all competing approaches from consideration.

This approach treats the scene as a five-movement visual symphony, not a component collage. The governing rule is:

> **At every moment, one thing is allowed to be loud. Everything else must be orchestration.**

### Chosen solution

1. **Return to the documented five-act arc**
   - Collapse or defer the sixth `quantum` act.
   - Reframe the experience as:
     - I — Seed: condensation / first pulse
     - II — Scaffold: structure / tension / architecture
     - III — Circulation: transport / metabolism / intent
     - IV — Sentience: awareness / duality / cognition
     - V — Apotheosis: bloom / collapse / rebirth

2. **Define a single visual job for every act**
   - Seed: one sculptural core emerging from silence, with only one atmospheric support layer.
   - Scaffold: hero framed by structural ribs and a restrained chromatic ring field behind, never around, the hero silhouette.
   - Circulation: motion-led act where flow lines and aura reveal movement pathways around a stable hero.
   - Sentience: widen the stage; atmosphere and depth increase while hero count decreases to one primary relationship.
   - Apotheosis: simplify geometry, expand depth, let starfield and lens-scale atmosphere carry transcendence.

3. **Use the “80 / 15 / 5 composition law”**
   - 80% of perceived attention belongs to hero asset and primary lighting.
   - 15% belongs to atmospheric support system.
   - 5% belongs to reactive or decorative detail.
   - Any effect that breaks this ratio should be reduced or removed.

4. **Create an art-direction lexicon in words, not just components**
   - Every act should be described using four tags before implementation:
     - **Substance** — what it feels made of
     - **Behavior** — how it moves
     - **Pressure** — how dense/intense the space feels
     - **Myth** — the symbolic narrative role
   - Example:
     - Seed = substance: obsidian glass; behavior: breathing ember; pressure: near-vacuum; myth: genesis.
     - Scaffold = substance: smoked alloy lattice; behavior: tensile bloom; pressure: architectural; myth: becoming.

5. **Make camera direction explicit and shot-based**
   - Current camera interpolation is technically smooth but not yet emotionally authored.
   - Each act should own one primary shot intention:
     - Seed: approach
     - Scaffold: orbit-reveal
     - Circulation: drift-through
     - Sentience: witness/hesitation
     - Apotheosis: withdrawal into infinity

6. **Reduce procedural systems before upgrading materials**
   - Material refinement will not solve incoherence if layer count stays excessive.
   - First reduce simultaneous visual claims, then improve hero shading, then reintroduce atmosphere selectively.

### Artistic brainstorming method for long-term consistency

Use a repeatable prompt lattice called **S.E.A.M.**

- **S — Symbol**
  - Choose one primary symbol per act: seed, rib, artery, bridge, crown.
- **E — Emotion**
  - Choose one emotional verb: condense, brace, carry, awaken, transcend.
- **A — Analog**
  - Choose one analogy from biology, astronomy, architecture, ritual, or myth.
- **M — Material**
  - Choose one dominant material family: obsidian glass, smoked titanium, wet membrane, ionized mist, stellar dust.

Implementation teams should not start by asking “what component do we add?”
They should start by answering:

- What is the symbol?
- What is the emotional verb?
- What real-world analogy is it borrowing from?
- What material family carries that analogy?

Only after those are fixed should shader/component selection happen.

## Implementation Guidance

- **Objectives**:
  - Re-establish one coherent artistic language across all acts.
  - Restore the curated hero assets as unmistakable focal anchors.
  - Eliminate procedural excess and narrative dilution.
  - Use the existing viewport profile system as the art-direction source of truth.

- **Key Tasks**:
  - Remove or defer the sixth `quantum` act from the main narrative path.
  - Audit each act for all support layers and cut any element that competes with hero readability.
  - Create a five-act art bible directly from `viewportProfiles.ts` using Symbol / Emotion / Analog / Material tags.
  - Rework camera rails into explicit shot intentions per act.
  - Use selected references only in these roles:
    - `glsl-hills` → restrained environmental contour for Seed
    - `neon-orbs` or ring shader → contained halo/depth field for Scaffold
    - `aura-core` → circulation energy sheath, not another hero
    - `space-background` + `asmr-background` → deep-space atmospheric bedding for Sentience
    - `stars-canvas` → final-scale infinite depth for Apotheosis
  - Reduce transparency stack count and overlapping emissive layers before adding any new effects.

- **Dependencies**:
  - Existing `WORLD_PHASES` configuration
  - `SceneManager.tsx`, `SeamlessWorld.tsx`, `CuratedHeroLayer.tsx`, `CameraRig.tsx`
  - Telemetry/audit tooling already in project
  - Curated GLTF hero assets in `public/models/`

- **Success Criteria**:
  - The experience reads as one authored five-act journey, not six stacked experiments.
  - Each act has one instantly legible hero focal point.
  - Procedural systems support hero readability instead of competing with it.
  - Alpha-overdraw pressure is materially reduced from the current 40-overlap warning state.
  - Camera motion feels intentional and cinematic, with a distinct shot grammar per act.
  - The artistic vocabulary can be reused for future brainstorming without drifting back into effect accumulation.