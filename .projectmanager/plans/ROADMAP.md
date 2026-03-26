# Project Roadmap

## Current Phase
- [x] Phase 1: Foundation
- [ ] Phase 2: Scene Content & Acts ← **YOU ARE HERE**

## Phase 1: Foundation ✅
- [x] Next.js App Router project scaffold with Turbopack
- [x] Zustand state management (capsStore, sceneLoadStore, scrollStore, uiStore, viewportAuditStore)
- [x] Device capability detection & quality tier profiles (high/medium/low)
- [x] Core canvas pipeline (Experience → SceneManager → CameraRig)
- [x] Post-processing stack (Bloom, ChromaticAberration, Vignette) with act-driven blending
- [x] Startup readiness gate with stable-frame detection
- [x] Canvas & PostFx error boundaries
- [x] Curated hero layer with LOD resolution, viewport-fill fitting, scene bounds
- [x] Viewport profiles & world phase configuration (`viewportProfiles.ts`)
- [x] Scroll-driven act/progress state management
- [x] Successful production build

### Post-Phase 1 Refinements (ongoing during Phase 2)
- [x] StartupReadinessGate timing hardening (local `gateOpenAt` ref to handle Turbopack JIT delays)
- [x] CapsStore quality profile refinement (full `QUALITY_PROFILES` map with per-tier budgets)
- [x] VS Code / Copilot workflow configuration

## Phase 2: Scene Content & Acts (In Progress)
- [ ] Implement all scene acts (Act1–Act6+; Act6QuantumConsciousness started)
- [ ] Viewport audit telemetry pipeline completion
- [ ] Scroll-to-act transition animations & blending polish
- [ ] Material grade profiles per act/tier
- [ ] Hero asset catalog (GLTF models, LOD variants)
- [ ] Loading UX / progress feedback in DOM layer
- [ ] Establish testing infrastructure and initial test coverage

## Upcoming
- [ ] Phase 3: Performance & Quality Assurance
  - [ ] Per-tier performance budget validation
  - [ ] Mobile device testing & fallback paths
  - [ ] Bundle size optimization (current: ~565KB uncompressed first-load; verify compressed size vs <500KB target)
  - [ ] Lighthouse / Core Web Vitals audit
  - [ ] Reduced-motion accessibility path
  - [ ] Automated test suite (stores, startup gate, act transitions)
- [ ] Phase 4: Polish & Release
  - [ ] Final visual polish & art direction
  - [ ] SEO & Open Graph images (route handlers exist)
  - [ ] Analytics / telemetry integration
  - [ ] Deployment pipeline (Vercel / edge)
  - [ ] Documentation & handoff

## Completed
- [x] Phase 1: Foundation (see above)

## Build History
| Build ID | Date | First-Load JS (uncompressed) | Notes |
|---|---|---|---|
| `sL2tdbHtAPCk82XpPEER0` | Latest | ~565KB (main), ~514KB (error) | Clean build, Phase 2 entry |