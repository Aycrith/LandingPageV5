# Current Phase: Active Development — Phase 2: Scene Content & Acts

## Objectives
- [x] Set up project structure (Next.js app with Turbopack, React 19, Three.js/R3F)
- [x] Define initial requirements and architecture
- [x] Begin implementation
- [x] Establish state management layer (Zustand stores)
- [x] Implement device capability detection & quality tiering (`capsStore`)
- [x] Build core 3D canvas pipeline (`Experience.tsx`, `SceneManager`, `CameraRig`)
- [x] Implement post-processing stack (`PostProcessingStack.tsx`)
- [x] Create startup readiness gate with stable-frame detection
- [x] Build error boundaries for canvas & post-FX resilience
- [x] Implement curated hero layer with LOD, viewport-fill, and scene bounds logic
- [x] Successful production build (Phase 1 complete)
- [ ] Finalize viewport audit & telemetry pipeline
- [ ] Complete all scene acts (Act6QuantumConsciousness observed; others TBD)
- [ ] Performance tuning across quality tiers (high/medium/low)
- [ ] End-to-end scroll-driven act transitions polish
- [ ] Material grade profiles per act/tier
- [ ] Hero asset catalog (GLTF models, LOD variants)
- [ ] Loading UX / progress feedback in DOM layer
- [ ] Production build optimization & deployment

## Summary

The project is a **scroll-driven, multi-act 3D experience** built with Next.js (App Router), React Three Fiber, and Zustand. **Phase 1 (Foundation) is complete.** The project has entered **Phase 2 (Scene Content & Acts)** with active refinement of core systems alongside new content development.

Recent activity (last 24 hours) shows:
- **`capsStore.ts` edits** — Continued refinement of the device capability detection and quality tier profiles. The store structure is mature with full `Budgets` interface and `QUALITY_PROFILES` map.
- **`StartupReadinessGate.tsx` edits** — Improvements to the startup gate, including a local ref (`gateOpenAt`) to decouple gate timing from store/module initialization. This addresses Turbopack JIT delays in dev mode that were prematurely exhausting the startup budget.
- **Fresh production build** — A new `.next/` build was produced (build ID: `sL2tdbHtAPCk82XpPEER0`), confirming the project compiles cleanly.
- **VS Code settings** — Copilot auto-continue configuration added, indicating active AI-assisted development workflow.

No new scene acts beyond Act6QuantumConsciousness have been observed yet. The primary focus of recent work has been **hardening foundation systems** (caps detection, startup gate timing) before building out act content.

## Key Systems Identified

| System | Key Files | Status |
|---|---|---|
| Capability Detection | `src/stores/capsStore.ts` | ✅ Implemented (actively refined) |
| Scene Loading & Readiness | `src/stores/sceneLoadStore.ts`, `StartupReadinessGate.tsx` | ✅ Implemented (actively refined) |
| Canvas Experience | `src/canvas/Experience.tsx` | ✅ Implemented |
| Curated Hero Layer | `src/canvas/CuratedHeroLayer.tsx` | ✅ Implemented |
| Post-Processing | `src/canvas/postfx/PostProcessingStack.tsx` | ✅ Implemented |
| Error Boundaries | `src/canvas/CanvasErrorBoundary.tsx` | ✅ Implemented |
| Viewport Profiles | `src/canvas/viewportProfiles.ts` | ✅ Implemented |
| Scroll State | `src/stores/scrollStore.ts` | ✅ Implemented |
| UI State | `src/stores/uiStore.ts` | ✅ Implemented |
| Viewport Audit | `src/stores/viewportAuditStore.ts` | 🔶 Partial — store exists, telemetry pipeline incomplete |
| Scene Acts | `src/canvas/acts/` | 🔶 Partial — Act6QuantumConsciousness started, others TBD |
| Loading UX | DOM layer | ❌ Not started |
| Material Grade Profiles | Per act/tier config | ❌ Not started |
| Hero Asset Catalog | GLTF models, LOD variants | ❌ Not started |

## Recent Changes & Observations

- **StartupReadinessGate timing fix:** The gate now uses a local `gateOpenAt` ref instead of relying on store initialization time. This prevents Turbopack JIT compilation delays (several seconds in dev) from consuming the startup budget before the first frame even fires. This is a meaningful resilience improvement.
- **Build size:** First-load JS is ~565KB uncompressed for the main route, ~514KB for error routes. This is above the <500KB compressed target in VISION.md, but uncompressed vs compressed comparison is needed — likely within budget when compressed.
- **No new acts implemented** — Development focus remains on stabilizing core runtime systems before expanding content.

## Blockers & Risks

| Risk | Severity | Notes |
|---|---|---|
| Act content pipeline not started | Medium | No GLTF assets, material profiles, or act implementations beyond Act6 |
| Viewport audit telemetry incomplete | Low | Store exists but pipeline to collect/report metrics is not wired |
| Bundle size approaching budget | Low | 565KB uncompressed; need to verify compressed size against <500KB target |
| No automated tests | Medium | No test files observed; testing infrastructure not yet established |

## Next Priorities
1. Implement remaining scene acts (Act1–Act5+) with placeholder geometry
2. Wire viewport audit telemetry pipeline end-to-end
3. Build loading UX / progress feedback in DOM layer
4. Begin hero asset catalog and material grade profiles
5. Establish basic test coverage for stores and startup gate