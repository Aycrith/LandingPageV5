# LandingPageV5 — Evolution Strategy

**Status**: Active | **Updated**: 2026-03-24

## Architectural Analysis

### Current State (v0.1)

The project is a 5-act scroll-driven 3D experience built on:

| Layer | Technology | State |
|-------|-----------|-------|
| Rendering | React Three Fiber + Three.js 0.183 | Operational |
| Scroll | Lenis smooth scroll → Zustand store | Operational |
| Camera | Per-act CatmullRomCurve3 paths | **Replaced → SplineEngine** |
| Acts | 5 discrete components (mount/unmount) | **Now wrap-aware** |
| Assets | GLTF models, custom shaders, HDRI | Procured (CC0) |
| Audio | 5 ambient tracks, Web Audio crossfade | Operational |
| Quality | 3-tier adaptive (GPU detection) | Operational |
| Post-FX | Bloom, Vignette, Chromatic Aberration | Operational |
| Social | OG/Twitter route-based generation | Operational |

### Gaps Identified

1. **Finite scroll** — 5 acts, progress clamped 0-1, hard stop at end → **FIXED: infinite treadmill**
2. **Discrete camera paths** — Each act had independent CatmullRom curves → **FIXED: unified SplineEngine**
3. **Hard act boundaries** — Acts mounted/unmounted, no cross-dissolution → **FIXED: wrap-aware neighbor rendering**
4. **Color wrapping** — Fog/sky/particle colors didn't wrap Act5→Act1 → **FIXED: modular arithmetic**
5. **No spline-as-metamorphic-engine** paradigm → **FIXED: SplineEngine singleton**

### Evolution Dimensions Still Open

#### Next Immediate Step: Tuning & Instrumentation Pass
- [x] Baseline alignment and acceptance criteria
- [x] Startup hardening (fail-safe gate)
- [x] Failure fallback path
- [x] Tier-testability (`?forceTier=high`)
- [x] Codified budgets in `capsStore.ts`
- [x] Extended telemetry to `ViewportAuditProbe`
- [x] Test coverage expansion
- [x] Phase D mini-spike (threshold warnings)

#### Phase 2: Metamorphic Geometry
- Morph hero geometry between acts along the spline (Dark Star → Globe → Flow Surface → Quantum → Black Hole → Dark Star)
- Use `THREE.BufferGeometryUtils.mergeVertices` + vertex interpolation
- Each act's hero geometry becomes a waypoint in a shape-morphing timeline

#### Phase 3: Procedural World Generation
- Replace static act scenes with noise-driven procedural generation
- Use the spline `canonical` value as seed offset for terrain/particle/structure generation
- Worlds emerge, evolve, and dissolve as functions of spline position

#### Phase 4: Dimensional Reality Shifts
- At act boundaries, apply post-processing transitions (glitch, pixelate, dimensionality shift)
- "Tear" effects revealing the next reality underneath
- Audio crossfade already supports this; add visual "portal" geometry

#### Phase 5: Temporal Awareness
- Track scroll velocity to modulate metamorphic speed
- Fast scrolling = time-lapse montage (rapid transitions)
- Slow scrolling = deliberate, cinematic reveals
- Idle = ambient breathing animations

#### Phase 6: Emergent Particle Intelligence
- Particles respond to scroll history (not just current state)
- Each cycle through the continuum adds subtle visual accretion
- Particle density, color saturation, and motion complexity grow per cycle

## Performance Budget

| Metric | Desktop Target | Mobile Target |
|--------|---------------|---------------|
| FPS | 60 | 30 |
| Draw calls | < 100 | < 50 |
| Texture memory | < 128MB | < 64MB |
| Load time | < 3s | < 5s |
| Frame latency (ms) | < 16.6ms | < 33.3ms |
| Memory limits   | < 512MB JS Heap | < 256MB JS Heap |
| Geometry Budget | < 100k verts | < 50k verts |
| Startup Resilience | Must never stall | Fallback to safe mode > 6s |

## Dev vs Build Behavior

- `npm run dev` (Turbopack): Forces `low` tier via `capsStore.ts` to prevent GPU overload during development with HMR
- `npm run build && npm run start`: Full quality tier detection runs

This is intentional — development stability takes priority over visual fidelity during iteration.

## Integration Points

```
SplineEngine (src/canvas/SplineEngine.ts)
    ↓ sample(t)
CameraRig   ← position, lookAt, fov
SceneManager ← actIndex, actProgress (wrap-aware)
SkyBox       ← color interpolation (wrap-aware)
ParticleField ← accent color blend (wrap-aware)
ScrollWrapper ← infinite treadmill, cycle tracking
scrollStore   ← canonical progress, cycle count
```

## SplineEngine API

```typescript
const spline = getSplineEngine();
const sample = spline.sample(anyRealNumber); // wraps automatically
// sample.position: THREE.Vector3
// sample.lookAt: THREE.Vector3
// sample.fov: number
// sample.canonical: number (0..1)
// sample.actIndex: number (0..4)
// sample.actProgress: number (0..1)
```
