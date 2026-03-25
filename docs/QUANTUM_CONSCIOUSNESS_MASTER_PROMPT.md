# QUANTUM CONSCIOUSNESS — Master Implementation Prompt
## 3D Infinite-Scroll Landing Page Experience

> **Video source:** "How Did Matter Become Conscious?" — The Opening (YouTube @theopeningproject)
> **Video ID:** `nHjxQJg-oCw` | **Duration:** ~30 min | **58K views, 2.3K likes**

---

## 0  HOW TO USE THIS DOCUMENT

Upload this markdown file **together with the 8 reference PNG screenshots** from `docs/reference_frames/` into the target AI coding agent (Google Stitch, Cursor, Copilot, Claude, etc.).

Paste this preamble before the prompt body:

> *"I am providing the core prompt below alongside eight target visual reference frames extracted from a documentary on quantum consciousness. Match the 3D `<Canvas>` density, hex-color styling, bloom filters, fog parameters, and particle behavior directly to the mood and tone set in these images. The codebase already exists — adapt the existing architecture described in §2."*

### Reference frame inventory

| # | File | Timestamp | Visual content | Maps to |
|---|------|-----------|----------------|---------|
| 1 | `reference-01-void-00m51s.png` | 0:51 | Deep black void, orbital light rings, scattered stars, subtle nebula dust | Phase 1 — Cosmic Void environment |
| 1a | `reference-01alt-void-25m40s.png` | 25:40 | Alternate void shot — late-video perspective | Phase 1 — secondary reference |
| 2 | `reference-02-microtubule-16m53s.png` | 16:53 | Dense microtubule lattice — thousands of glowing spheres (red/magenta/cyan/white) connected as honeycomb cylinder | Phase 2 — Hero 3D object |
| 2a | `reference-02alt-microtubule-18m45s.png` | 18:45 | Alternate microtubule close-up | Phase 2 — secondary reference |
| 3 | `reference-03-neural-17m08s.png` | 17:08 | Firing neural dendrites and neurons — vibrant oranges, reds, electric white flashes through branching structures | Phase 3 — Interactive data flow |
| 3a | `reference-03alt-neural-18m28s.png` | 18:28 | Alternate neural web detail shot | Phase 3 — secondary reference |
| 4 | `reference-04-collapse-17m37s.png` | 17:37 | Bright cyan/white energy cluster — blurry quantum superposition echoes snapping into sharp focus | Phase 4 — State collapse overlays |
| 4a | `reference-04alt-collapse-23m51s.png` | 23:51 | Alternate wavefunction collapse visual | Phase 4 — secondary reference |

---

## 1  EXISTING CODEBASE ARCHITECTURE (DO NOT RECREATE)

This project already has a fully wired Next.js 16 + React 19 + React Three Fiber v9 + Three.js 0.183 codebase. **Modify the existing files** — do not scaffold from scratch.

### 1.1  Technology stack (already installed)

```json
{
  "@react-three/drei": "^10.7.7",
  "@react-three/fiber": "^9.5.0",
  "@react-three/postprocessing": "^3.0.4",
  "@react-three/rapier": "^2.2.0",
  "framer-motion": "^12.38.0",
  "gsap": "^3.14.2",
  "lenis": "^1.3.20",
  "next": "16.2.1",
  "postprocessing": "^6.39.0",
  "react": "19.2.4",
  "three": "^0.183.2",
  "zustand": "^5.0.12",
  "tailwind-merge": "^3.5.0"
}
```

### 1.2  Two-layer architecture (already implemented)

```
┌─────────────────────────────────────────────┐
│  LoadingScreen              z-index: 100    │  ← Dismisses after startup
├─────────────────────────────────────────────┤
│  DOM Layer (ScrollWrapper → DOMLayer)       │
│    z-index: 10  pointer-events: none        │
│    5 × 100vh <ActContent> sections          │
│    GlobalOverlay (fixed overlays per act)   │
├─────────────────────────────────────────────┤
│  Canvas Layer (Experience → R3F <Canvas>)   │
│    z-index: 0   position: fixed inset: 0   │
│    SceneManager → 5 Act components          │
│    CameraRig → spline paths + parallax     │
│    PostProcessingStack                      │
│    ParticleField (5k–50k GPU particles)     │
└─────────────────────────────────────────────┘
```

### 1.3  Scroll → 3D pipeline (already wired)

```
Lenis smooth scroll
  → scrollStore.setScroll(progress, velocity, direction)
    → progress: 0–1 global
    → activeAct: Math.floor(progress * 5), clamped 0–4
    → actProgress: fractional (progress * 5) mod 1
  → CameraRig reads scrollStore → CatmullRomCurve3 spline per act
  → ParticleField reads scrollStore → uScrollVelocity, uActProgress uniforms
  → SceneManager reads scrollStore → per-act fog/ambient/accent color interpolation
  → ActContent reads scrollStore → per-section fade-in/out opacity + translateY
```

### 1.4  File map — components to modify

| File path | Current role | Quantum consciousness modification |
|-----------|-------------|-------------------------------------|
| `src/canvas/acts/Act1Emergence.tsx` | DarkStar model + orbital rings + icosahedron | → **Cosmic void + nascent particle field** |
| `src/canvas/acts/Act2Structure.tsx` | Globe wireframe + satellite orbits + rock ground | → **Microtubule lattice hero object** |
| `src/canvas/acts/Act3Flow.tsx` | Hologram model + wave surface + ribbon tubes | → **Neural network firing dendrites** |
| `src/canvas/acts/Act4Quantum.tsx` | Twin attractors + orbital particles + energy beam | → **Quantum superposition + wave collapse** |
| `src/canvas/acts/Act5Convergence.tsx` | Black hole + vortex + accretion disks + spiral | → **Consciousness emergence convergence** |
| `src/canvas/particles/ParticleField.tsx` | 50K GPU particles, FBM displacement, nebula noise | → Re-theme colors/behavior per act |
| `src/canvas/shaders/particles.vert.glsl` | FBM noise, scroll wind, mouse attraction | → Add neural pulse waves |
| `src/canvas/shaders/particles.frag.glsl` | Soft circle, glow falloff, depth fog | → Add firing flash + bloom prep |
| `src/canvas/environment/SkyBox.tsx` | 5-act gradient skybox + inline star hash | → Deep void blacks + violet nebula tints |
| `src/canvas/postfx/PostProcessingStack.tsx` | Bloom + Vignette + ChromAb (tier-gated) | → Increase bloom, add chromatic aberration for collapse |
| `src/canvas/materials/CrystalMaterial.tsx` | Fresnel + iridescence shader | → Tune to quantum energy palette |
| `src/canvas/materials/HologramMaterial.tsx` | Scanlines + glitch + fresnel | → Neural pulse overlay material |
| `src/canvas/materials/WireframePulse.tsx` | Dual traveling pulses + fresnel wireframe | → Microtubule lattice wireframe |
| `src/canvas/camera/CameraRig.tsx` | Startup settle + scroll splines + mouse parallax | → Z-axis tunnel flight behavior |
| `src/canvas/viewportProfiles.ts` | 5 act camera poses + spline data | → Tunnel-forward camera paths |
| `src/canvas/SceneManager.tsx` | Per-act fog/light interpolation, HDRI, 3-point lighting | → Deep void color palettes |
| `src/dom/DOMLayer.tsx` | 5 act content sections | → Quantum consciousness copy |
| `src/dom/sections/CybercoreHero.tsx` | HUD border + morphing text + ripple button | → Wavefunction probability text |
| `src/dom/ActContent.tsx` | Fade in/out + TextReveal | → Add text scramble/collapse effects |
| `src/dom/ui/MorphingText.tsx` | Cycling word morpher | → Quantum terminology cycling |
| `src/dom/ui/ShatterButton.tsx` | Particle shatter on click | → Wavefunction collapse CTA |
| `src/stores/scrollStore.ts` | Global scroll state | → No change needed |
| `src/stores/capsStore.ts` | GPU capability detection + quality tiers | → No change needed |

### 1.5  Quality tier system (already implemented)

| Tier | Particles | Shadows | Post-FX | DPR |
|------|-----------|---------|---------|-----|
| High | 50,000 | Yes | Bloom+Vignette+ChromAb | [1, 1.15] |
| Medium | 18,000 | No | Bloom+Vignette | [0.9, 1] |
| Low | 5,000 | No | None | [0.75, 0.9] |

### 1.6  Critical stability notes

- **React 19 + postprocessing circular ref crash:** Use callback refs on `<EffectComposer>` children — `ref.current` causes circular `JSON.stringify` crash
- **Conditional hooks:** Never wrap `useGLTF` in try/catch; use `useGLTF.preload()` separately
- **Deterministic randomness:** Use `seededUnit(seed)` / `mulberry32(seed)` from `src/lib/random.ts` — never `Math.random()` in render
- **Mutable hot path:** Per-frame buffer writes in `useFrame` need scoped `react-hooks/immutability` suppression
- **Conservative GPU defaults:** Start at medium/low unless strong GPU evidence; cap particle counts and DPR

---

## 2  VISUAL DESIGN SPECIFICATION

### 2.1  Color system — Quantum consciousness palette

```javascript
// Replace existing ACT_COLORS in SceneManager.tsx
const ACT_COLORS = [
  // Act 1 — Cosmic Void: deep space black, faint cyan glow
  { accent: "#4EEAFF", fog: "#000000", ambient: 0.08 },
  // Act 2 — Microtubule Lattice: magenta/cyan bio-glow
  { accent: "#FF3CAC", fog: "#020008", ambient: 0.18 },
  // Act 3 — Neural Networks: hot orange/white electric
  { accent: "#FF6B35", fog: "#050200", ambient: 0.22 },
  // Act 4 — Quantum Collapse: bright cyan→white snap
  { accent: "#00FFE0", fog: "#000805", ambient: 0.15 },
  // Act 5 — Consciousness Emergence: warm white convergence
  { accent: "#FFFFFF", fog: "#020203", ambient: 0.25 },
];
```

### 2.2  SkyBox gradient palettes

```javascript
// Deep void blacks with violet/cyan nebula tints
const SKY_PALETTES = [
  { top: "#000000", mid: "#020010", bottom: "#000000" },  // Act 1
  { top: "#030008", mid: "#0A0020", bottom: "#020005" },  // Act 2
  { top: "#050200", mid: "#0D0500", bottom: "#020100" },  // Act 3
  { top: "#000805", mid: "#001510", bottom: "#000503" },  // Act 4
  { top: "#020203", mid: "#060608", bottom: "#010102" },  // Act 5
];
```

---

## 3  PHASE-BY-PHASE IMPLEMENTATION

### PHASE 1: THE COSMIC VOID (Act 1 — Emergence)
**Reference:** `reference-01-void-00m51s.png`, `reference-01alt-void-25m40s.png`

**What the reference frame shows:**
- Absolute `#000000` pitch-black background
- Thin orbital light rings (2–3 concentric ellipses) with bright nodes at intersections
- Hundreds of scattered `GL_POINTS` stars at varying brightness
- Subtle grey nebula/dust clouds in the background (lower-left quadrant)
- High contrast — the bright elements pop against total darkness
- Depth of field: distant stars slightly blurred/dimmer

**Implementation in `Act1Emergence.tsx`:**
- Keep the existing orbital ring geometry (7 rings) — they match the reference perfectly
- Change ring material colors from `#7ef2c6` to `#4EEAFF` (cold cyan)
- Reduce pointLight intensity to create more contrast against the void
- Ensure background is absolute black by setting `scene.background = new THREE.Color(0x000000)`
- The existing icosahedron core + additive glow mesh works well — make it smaller and dimmer
- ParticleField should use very low density here (sparse void), mostly white/dim cyan

**Camera behavior:** Wide FOV (50+), very slow forward drift on Z-axis. User feels suspended in vast emptiness.

---

### PHASE 2: THE MICROTUBULE LATTICE (Act 2 — Structure)
**Reference:** `reference-02-microtubule-16m53s.png`, `reference-02alt-microtubule-18m45s.png`

**What the reference frame shows:**
- Thousands of small, distinct glowing spheres arranged in a dense honeycomb-lattice cylinder
- Alternating colors: **red/magenta, white, cyan** spheres
- Spheres are connected by faint structural lines (bonds)
- The lattice forms an infinite tubular structure extending into depth
- Interior of the tube is visible — creates a "looking down a tunnel" effect
- Individual spheres have soft glow halos (bloom effect)

**Implementation in `Act2Structure.tsx`:**
- **Replace** the globe wireframe with an `InstancedMesh` cylindrical lattice:
  - Generate positions via parametric helix: `θ = i * goldenAngle`, `y = i * spacing`, `r = tubeRadius`
  - Use `InstancedMesh` with `sphereGeometry(0.04, 12, 12)` for ~2000 nodes
  - Alternate 3 instance colors via instanceColor attribute: `#FF3CAC` (magenta), `#FFFFFF` (white), `#4EEAFF` (cyan)
- **Bond lines:** `LineSegments` connecting nearest-neighbor spheres with `LineBasicMaterial({ color: "#FF3CAC", transparent: true, opacity: 0.3 })`
- **Glow:** Each sphere gets bloom from PostProcessingStack (already wired) — lower `luminanceThreshold` to 0.6 for this act
- **Scroll interaction:** As actProgress increases, camera Z pushes forward into the tube → tunnel flight
- **Ground:** Remove rock ground — pure black void background

**Camera behavior:** Start facing the tube from outside, then dolly forward into the interior as scrollProgress advances. FOV narrows slightly (48→42) to enhance tunnel compression.

---

### PHASE 3: NEURAL NETWORK FIRING (Act 3 — Flow)
**Reference:** `reference-03-neural-17m08s.png`, `reference-03alt-neural-18m28s.png`

**What the reference frame shows:**
- Extremely intricate web of firing dendrites and neurons
- Vibrant **oranges (#FF6B35), blood reds (#CC2200), striking white (#FFFFFF)** electric flashes
- Branch-like tree structures emanating from central nodes
- White "firing" pulses traveling along paths with intense bloom
- Dense volumetric fog — structures fade into black at distance
- Very high visual density — feels overwhelming and biological

**Implementation in `Act3Flow.tsx`:**
- **Replace** the hologram model + wave surface with a procedural neural network:
  - Generate 30–50 neuron nodes (random positions in a 10×10×10 cube, use `seededUnit`)
  - For each node pair within distance threshold: create `CatmullRomCurve3` dendrite paths (2–3 control points with jitter)
  - Render dendrites as `TubeGeometry(curve, 40, 0.008, 4)` with `MeshBasicMaterial({ color: "#FF6B35" })`
  - Neuron bodies: `sphereGeometry(0.08)` with emissive orange material
- **Firing pulses:** Animated bright-white sphere traveling along each dendrite path:
  - `useFrame` advances a `t` parameter along each curve
  - Firing sphere: `sphereGeometry(0.03)` with `emissiveIntensity: 8` (triggers bloom)
  - Stagger firing with `seededUnit(i) * period` so they don't all fire simultaneously
- **Fog:** Set `scene.fog = new THREE.FogExp2("#050200", 0.12)` for dense exponential falloff
- **Post-processing:** Bloom intensity pushed to 2.5 for this act, threshold lowered to 0.5

**Camera behavior:** Orbiting slowly around the network. Mouse parallax shifts viewing angle. Scroll pushes deeper into the web.

---

### PHASE 4: QUANTUM WAVE COLLAPSE (Act 4 — Quantum)
**Reference:** `reference-04-collapse-17m37s.png`, `reference-04alt-collapse-23m51s.png`

**What the reference frame shows:**
- Bright cyan/white cluster of energy in rapid multi-state echo
- **Chromatic aberration** — color fringing around bright elements
- Blurry "echo" effect: the same element appears in multiple positions simultaneously (superposition)
- Aggressive snap into sharp resolution (collapse moment)
- Background is near-black with subtle deep teal tint

**Implementation in `Act4Quantum.tsx`:**
- Keep the existing **twin attractor dodecahedra** concept — perfect for superposition visualization
- **Superposition echo:** Render 5–7 ghost copies of the main geometry at slightly offset positions:
  - Each ghost: same geometry, `opacity: 0.15 * (1 - actProgress)`, `AdditiveBlending`
  - Ghost positions: mainPos + `seededUnit(i) * spreadRadius * (1 - actProgress)`
  - As actProgress → 1: spread collapses to 0, ghosts merge into one sharp object = **wavefunction collapse**
- **Chromatic aberration:** In PostProcessingStack, boost `ChromaticAberration` offset to `0.008 * (1 - actProgress)` for this act (blurry at start, sharp at end)
- **Color:** Primary `#00FFE0` (bright teal/cyan), secondary `#FFFFFF` (white flash on collapse)
- **Energy beam:** Keep existing `LineSegments` energy beam — change color to cyan
- **Particle behavior:** Fast, chaotic orbits that slow and converge as actProgress increases

**Camera behavior:** Start pulled back (wide superposition view). As collapse happens, camera rushes forward and FOV tightens dramatically (50→35) creating visual "snap."

---

### PHASE 5: CONSCIOUSNESS EMERGENCE (Act 5 — Convergence)
**Reference:** Synthesis of all previous phases — all elements converge.

**Implementation in `Act5Convergence.tsx`:**
- Keep the existing **black hole vortex + spiral particles** — perfect metaphor for consciousness emergence
- **Color shift:** Transition from act-specific colors to unified warm white `#FFFFFF` with subtle golden `#FFE0A0` rim
- **Accretion disks:** Keep existing ring geometry but shift color to warm white/gold
- **Spiral particles:** Converge inward as consciousness "crystallizes"
- **Final moment:** At actProgress > 0.9, brief flash (emissiveIntensity spike to 5.0) then everything settles into clarity
- **CTA zone:** This is where the DOM `FuturisticCTA` overlay appears with `ShatterButton`

---

## 4  DOM OVERLAY MODIFICATIONS

### 4.1  Text content — Quantum consciousness theme

```javascript
// In DOMLayer.tsx, replace act definitions:
const acts = [
  {
    id: 0,
    title: "The Void",
    subtitle: "Before consciousness, there was only potential",
    body: "In the quantum vacuum, virtual particles flicker in and out of existence. The void is not empty — it seethes with probability.",
  },
  {
    id: 1,
    title: "Microtubules",
    subtitle: "Where quantum meets biology",
    body: "Inside every neuron, protein lattices form quantum computers at the cellular scale. Tubulin dimers process information at the edge of classical physics.",
  },
  {
    id: 2,
    title: "Neural Fire",
    subtitle: "Billions of connections ignite simultaneously",
    body: "Consciousness emerges from the orchestrated firing of 86 billion neurons. Each synapse is a quantum decision point.",
  },
  {
    id: 3,
    title: "Superposition",
    subtitle: "All states exist until observed",
    body: "Before measurement, a quantum system exists in all possible states simultaneously. Consciousness may be the observer that collapses the wave function.",
  },
  {
    id: 4,
    title: "Emergence",
    subtitle: "Matter becomes aware of itself",
    body: "From quantum uncertainty to neural complexity to subjective experience. The universe developed a way to know itself.",
    cta: true,
  },
];
```

### 4.2  MorphingText words (CybercoreHero.tsx)

```javascript
const words = [
  "SUPERPOSITION",
  "ENTANGLEMENT",
  "DECOHERENCE",
  "OBSERVATION",
  "CONSCIOUSNESS",
];
```

### 4.3  Typography collapse effect (ActContent.tsx enhancement)

For the "quantum superposition" text effect described in Phase 3 of the original brief:

```css
/* Add to globals.css */
.quantum-text-entering {
  filter: blur(8px);
  letter-spacing: 0.5em;
  opacity: 0.3;
  text-shadow:
    0 0 20px rgba(0, 255, 224, 0.5),
    0 0 40px rgba(0, 255, 224, 0.3),
    0 0 60px rgba(0, 255, 224, 0.1);
  transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.quantum-text-visible {
  filter: blur(0);
  letter-spacing: 0;
  opacity: 1;
  text-shadow: none;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

This simulates elements "violently snapping into focus from multiple blurred probabilistic states."

---

## 5  SHADER MODIFICATIONS

### 5.1  Particle vertex shader — neural pulse addition

Add to `particles.vert.glsl` after existing FBM displacement:

```glsl
// Neural pulse wave — expands radially from a center point
uniform float uPulseTime;
uniform vec3 uPulseOrigin;
float pulseDist = length(pos.xyz - uPulseOrigin);
float pulseWave = sin(pulseDist * 3.0 - uPulseTime * 4.0) * 0.5 + 0.5;
pulseWave *= smoothstep(10.0, 0.0, pulseDist); // fade at distance
pos.xyz += normalize(pos.xyz - uPulseOrigin) * pulseWave * 0.5;

// Pulse brightens particles it passes through
vAlpha *= 1.0 + pulseWave * 2.0;
```

### 5.2  Particle fragment shader — firing flash

Add to `particles.frag.glsl`:

```glsl
// Hot core for neurons near firing threshold
float hotCore = smoothstep(0.3, 0.0, dist) * pulseIntensity;
color += vec3(1.0, 0.9, 0.7) * hotCore * 3.0; // white-hot flash
```

---

## 6  CAMERA Z-AXIS TUNNEL FLIGHT

The original brief's core mechanic: Y-scroll → Z-axis camera depth.

**In `CameraRig.tsx`**, the spline system already moves the camera along `CatmullRomCurve3` paths. Modify `viewportProfiles.ts` camera paths to emphasize **forward Z-axis movement**:

```typescript
// Act 1: Floating in void, slow forward drift
cameraPath: {
  positions: [[0, 0, 20], [0, 0.2, 12], [0, 0, 5]],
  lookAts: [[0, 0, 0], [0, 0, 0], [0, 0, -10]],
  fovs: [55, 50, 46],
},

// Act 2: Approach and enter microtubule
cameraPath: {
  positions: [[0, 0, 8], [0, 0.5, 3], [0, 0, -2]],
  lookAts: [[0, 0, 0], [0, 0, -5], [0, 0, -15]],
  fovs: [48, 42, 38],
},

// Act 3: Inside neural web
cameraPath: {
  positions: [[3, 2, 5], [0, 0, 0], [-2, -1, -5]],
  lookAts: [[0, 0, 0], [-1, 0, -3], [0, 0, -10]],
  fovs: [52, 50, 48],
},

// Act 4: Quantum collapse — rush forward
cameraPath: {
  positions: [[0, 0, 12], [0, 0, 5], [0, 0, 1.5]],
  lookAts: [[0, 0, 0], [0, 0, 0], [0, 0, 0]],
  fovs: [50, 42, 35],
},

// Act 5: Final convergence
cameraPath: {
  positions: [[0, 1, 6], [0, 0.5, 3], [0, 0, 1.8]],
  lookAts: [[0, 0, 0], [0, 0, 0], [0, 0, 0]],
  fovs: [45, 40, 36],
},
```

---

## 7  AGENT VISION PROMPTS (for each reference image)

Paste these descriptions directly under each uploaded image when feeding multi-modal agents:

### Image 1 — `reference-01-void-00m51s.png`
> *"Reference Image 1 (The Void Layer): Use this to establish the environment parameters. Notice the absolute #000000 pitch-black background, offset by thin concentric orbital rings with bright point nodes. Scattered GL_POINTS stars at varying brightness. Subtle grey nebula dust in lower quadrants. High contrast — bright elements against total void. The existing `Act1Emergence.tsx` already has orbital rings and an icosahedron core — tune their colors to cold cyan #4EEAFF and reduce ambient to 0.08 for maximum darkness."*

### Image 2 — `reference-02-microtubule-16m53s.png`
> *"Reference Image 2 (The Hero Microtubule Layer): This is the exact geometric configuration expected for the Hero 3D interactive element. Look at the honeycomb-like lattice formed by alternating glowing spheres (magenta #FF3CAC, white #FFFFFF, cyan #4EEAFF). Do not attempt a solid mesh. Build this using InstancedMesh in React Three Fiber aligning sphere nodes mathematically into a parametric helix cylinder. Bond lines connect nearest neighbors. The existing `Act2Structure.tsx` has InstancedMesh orbital patterns — replace the globe with this lattice."*

### Image 3 — `reference-03-neural-17m08s.png`
> *"Reference Image 3 (Interactive Data Flow): When the user scrolls, the grid must 'fire' like these neural webs. Emulate the visual noise — use the existing PostProcessingStack bloom passes for electric bright-white firing moments traveling along CatmullRomCurve3 dendrite paths. Let structural strands fade into black via dense FogExp2(#050200, 0.12). The existing `Act3Flow.tsx` already has ribbon tubes and wave surfaces — replace with procedural neuron node graph."*

### Image 4 — `reference-04-collapse-17m37s.png`
> *"Reference Image 4 (State Collapse Overlays): Look at the chromatic aberration and blurry 'echo' representing quantum superposition. Render 5-7 additive-blended ghost copies at slightly offset positions that collapse to zero spread as actProgress→1. Boost ChromaticAberration offset to 0.008*(1-actProgress). For DOM text, combine CSS blur(8px)→blur(0) with letter-spacing: 0.5em→0 transition to simulate probability states snapping into existence. The existing `Act4Quantum.tsx` twin attractors are a perfect base."*

---

## 8  POST-PROCESSING PARAMETERS PER ACT

```typescript
// In PostProcessingStack.tsx, make bloom/chromab act-aware:
const ACT_POSTFX = [
  // Act 1: Subtle — void should feel empty
  { bloomThreshold: 0.85, bloomIntensity: 1.0, chromabOffset: 0.001 },
  // Act 2: Medium — microtubule glow
  { bloomThreshold: 0.6, bloomIntensity: 1.8, chromabOffset: 0.002 },
  // Act 3: Heavy — neural firing bloom
  { bloomThreshold: 0.5, bloomIntensity: 2.5, chromabOffset: 0.003 },
  // Act 4: Dynamic — reduces as collapse occurs
  { bloomThreshold: 0.7, bloomIntensity: 2.0, chromabOffset: 0.008 }, // chromab fades with progress
  // Act 5: Clean convergence
  { bloomThreshold: 0.8, bloomIntensity: 1.2, chromabOffset: 0.001 },
];
```

---

## 9  PERFORMANCE BUDGETS (hard limits)

| Metric | Desktop (high) | Desktop (medium) | Mobile (low) |
|--------|---------------|-------------------|--------------|
| Frame rate | 60fps | 60fps | 30fps |
| Draw calls | < 100 | < 60 | < 35 |
| InstancedMesh nodes | 2000 | 800 | 300 |
| Neuron dendrites | 50 | 25 | 12 |
| Particles | 50,000 | 18,000 | 5,000 |
| Ghost copies (Act 4) | 7 | 4 | 2 |
| Texture memory | < 128MB | < 64MB | < 32MB |

---

## 10  IMPLEMENTATION ORDER (recommended)

1. **SceneManager.tsx** — Update `ACT_COLORS` palette, fog parameters
2. **SkyBox.tsx** — Update gradient palettes to deep void blacks
3. **viewportProfiles.ts** — Update camera paths for Z-axis tunnel flight
4. **Act1Emergence.tsx** — Re-color existing orbital rings + void theme
5. **Act2Structure.tsx** — Replace globe with InstancedMesh microtubule lattice
6. **Act3Flow.tsx** — Replace hologram with procedural neural network
7. **Act4Quantum.tsx** — Add superposition ghost copies + collapse mechanic
8. **Act5Convergence.tsx** — Re-theme to consciousness emergence
9. **PostProcessingStack.tsx** — Act-aware bloom/chromab parameters
10. **particles.vert.glsl** / **particles.frag.glsl** — Neural pulse uniforms
11. **ParticleField.tsx** — Wire new uniforms
12. **DOMLayer.tsx** — Quantum consciousness copy
13. **CybercoreHero.tsx** — Quantum terminology
14. **globals.css** — Quantum text collapse CSS
15. **ActContent.tsx** — Wire quantum-text-entering/visible classes

---

## 11  EXISTING ASSETS (already on disk)

| Asset | Path | Use |
|-------|------|-----|
| Dark Star GLTF | `/models/dark_star/scene.gltf` | Act 1 hero (keep or replace) |
| Satellites | `/models/satellites/scene.gltf` | Remove — not quantum themed |
| Quantum Leap | `/models/quantum_leap/scene.gltf` | Act 4 attractors |
| Black Hole | `/models/black_hole/scene.gltf` | Act 5 convergence |
| Nebula noise | `/textures/volumetric/nebula-noise-1k-seamless.png` | ParticleField density mask |
| Rock PBR | `/textures/pbr/rock063/` | Remove — acts should float in void |
| Metal PBR | `/textures/pbr/metal049a/` | Optional for Act 3 neuron bodies |
| Ground PBR | `/textures/pbr/ground103/` | Remove |
| HDRI | `/env/hdri/kloppenheim_07_4k.exr` | Keep for reflections (high tier only) |
| Audio tracks | `/audio/acts/act1-5` | Re-map to quantum ambience |

---

## 12  CHECKLIST — VERIFY BEFORE SHIPPING

- [ ] All 5 acts render without WebGL context loss
- [ ] Scroll progress 0→1 produces smooth continuous Z-axis camera flight
- [ ] `?forceTier=low` renders at 30fps without crashes
- [ ] `?forceTier=high` renders at 60fps with all post-processing
- [ ] No `Math.random()` calls in render path (ESLint: react-hooks/purity)
- [ ] No conditional hooks (ESLint: rules-of-hooks)
- [ ] All `InstancedMesh` uses deterministic `seededUnit()` positioning
- [ ] PostProcessingStack uses callback refs (no circular ref crash)
- [ ] LoadingScreen dismisses within 3s on desktop
- [ ] DOM text "quantum collapse" CSS transition fires when entering viewport
- [ ] Mouse parallax shifts both camera and particle field
- [ ] `next build` succeeds with zero TypeScript errors
- [ ] Playwright viewport audit passes: `npm run audit:viewport`
