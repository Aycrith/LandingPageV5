# Project Vision

## Overview
A **scroll-driven, multi-act 3D web experience** built with Next.js (App Router), React Three Fiber, and Zustand. The experience adapts to device capabilities in real time, delivering cinematic visuals on powerful hardware while gracefully degrading on mobile and low-end devices.

## Key Features
- **Device-Adaptive Quality Tiering** — Automatic detection of GPU capabilities, mobile status, WebGL2 support, and reduced-motion preferences. Three quality tiers (high/medium/low) with explicit budgets for FPS, draw calls, triangles, and texture memory.
- **Scroll-Driven Multi-Act Narrative** — Users scroll through a series of "acts" (world phases), each with unique hero assets, material grades, post-processing profiles, and camera behaviors.
- **Curated Hero Layer with LOD** — 3D hero assets automatically select detail level based on device tier, with viewport-fill fitting and scene-bounds measurement for consistent framing.
- **Cinematic Post-Processing** — Bloom, chromatic aberration, and vignette effects that blend dynamically between acts based on scroll progress.
- **Resilient Startup System** — Stable-frame detection gate, asset readiness tracking, and error boundaries that prevent users from getting stuck on loading screens.
- **Viewport Audit & Telemetry** — Runtime metrics collection for monitoring rendering performance and device distribution across users.

## Success Criteria
- All acts render without frame drops on target devices within each quality tier's budgets
- Smooth scroll-driven transitions between acts with no visual glitches
- Graceful degradation: low-tier and mobile devices receive a functional, visually coherent experience
- First-load JS stays within performance budget (target: <500KB compressed)
- `prefers-reduced-motion` users receive an appropriate non-animated experience
- Error boundary catches prevent blank screens — users always see content or a meaningful fallback