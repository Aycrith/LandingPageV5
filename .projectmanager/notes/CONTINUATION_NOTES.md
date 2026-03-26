# Continuation Notes
> 2026-03-26

**Phase:** Current Phase
**Progress:** 17/24 tasks (71%)

## Next Tasks
- [x] Scroll-to-act transition animations & blending polish
- [ ] Material grade profiles per act/tier
- [ ] Hero asset catalog (GLTF models, LOD variants)

## Completed This Session
- Created `src/lib/transition.ts` — shared transition blend utility (`computeActPresence`, `computeCrossfadeBlend`, `velocityDampedBlend`, `blendValue`)
- SceneManager: replaced raw `actProgress` with shaped crossfade blend; eliminated per-frame `new THREE.Color()` GC allocations
- SeamlessWorld: replaced hardcoded smootherstep ranges (0.12/0.78, 0.56/0.96) with transition-rig-aware presence/crossfade weights
- PostProcessingStack: bloom, vignette, chromatic aberration now use shaped crossfade
- GlobalOverlay `FixedSection`: transition-rig-aware opacity + subtle translateY/scale polish
- ActContent: consistent transition-rig-aware presence instead of distance-based formula

## Recent Files
- src/lib/transition.ts (NEW)
- src/canvas/SceneManager.tsx
- src/canvas/SeamlessWorld.tsx
- src/canvas/postfx/PostProcessingStack.tsx
- src/dom/GlobalOverlay.tsx
- src/dom/ActContent.tsx
- .vscode/settings.json
- .projectmanager/notes/CONTINUATION_NOTES.md
- .projectmanager/plans/SPEC.md

## Core Files

