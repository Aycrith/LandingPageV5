<!-- BEGIN:nextjs-agent-rules -->
# LandingPageV5 Agent Guide

## Framework caveat

This is **Next.js 16.2.1 + React 19.2 + React Three Fiber 9**. Do not assume older Next.js or React behavior. Before changing routing, metadata, config, or rendering patterns, read the relevant guide in `node_modules/next/dist/docs/` and heed deprecation notices.

## Architecture

- `src/app/` contains the App Router shell, metadata, and social image routes.
- `src/canvas/` contains the WebGL experience, scene orchestration, cameras, post-processing, acts, and runtime probes.
- `src/dom/` contains the HTML overlay, scroll wrapper, loading UI, audio controls, and supporting interface components.
- `src/stores/` contains Zustand stores for GPU caps, scroll state, scene startup, viewport audit metrics, and UI state.
- `tests/` contains Playwright viewport and telemetry audits.
- `scripts/` contains project-specific asset and telemetry utilities.

Keep heavy 3D runtime logic in `src/canvas/` and DOM/UI concerns in `src/dom/`. Coordinate across layers through the Zustand stores instead of ad-hoc prop tunneling.

## Runtime and rendering conventions

- The 3D experience is client-only. Keep `src/app/page.tsx` using dynamic import with `ssr: false` for `@/canvas/Experience`.
- Favor runtime stability over visual ambition. In development, capability detection intentionally defaults to low unless `?forceTier=high|medium|low` is set.
- Respect `?safeMode=1` and fallback behavior when working on startup, rendering, or capability-detection code.
- Release temporary WebGL probe contexts after GPU detection to avoid context exhaustion.
- Preserve shader loading support in `next.config.ts` for `.glsl`, `.wgsl`, `.vert`, and `.frag` assets.
- `@react-three/postprocessing` with React 19 can crash when object refs are passed through props. Prefer callback refs for effect components.

## React and lint expectations

- The repo uses strict React hooks lint rules. Do not call hooks conditionally or wrap hooks in `try/catch`.
- Avoid render-time randomness in React components. Use deterministic helpers or memoized seeded values instead.
- For unavoidable Three.js per-frame mutations, keep any lint suppressions narrowly scoped to the exact line that needs them.

## Build, lint, and test commands

- Install dependencies: `npm install`
- Start development: `npm run dev`
- Lint: `npm run lint`
- Production build: `npm run build`
- Production server: `npm run start`
- Viewport audits: `npm run audit:viewport`, `npm run audit:viewport:visual`, `npm run audit:viewport:stability`
- Direct Playwright runs must use a visible reporter: `npx playwright test --reporter=list`

There is currently no dedicated unit-test script in `package.json`; do not invent one in instructions or automation.

## Environment and testing notes

- Social metadata uses `NEXT_PUBLIC_SITE_URL` in `src/app/layout.tsx`. Keep a root `.env` entry for local work.
- Playwright is configured to build the app and serve it on port `3100` with `reporter: list` and `reuseExistingServer: false`.
- Audit mode relies on `window.__LPV5_VIEWPORT_AUDIT__` exposed by `src/dom/ScrollWrapper.tsx`.

## Linkable project docs

- `README.md` — repo overview, local workflows, audit entry points
- `docs/EVOLUTION_STRATEGY.md` — active architecture direction and roadmap
- `docs/ASSET_PROCUREMENT_PLAN.md` and `docs/ASSET_MANIFEST.csv` — source-of-truth asset planning
- `docs/SOCIAL_PREVIEW_QA.md` — social image verification and metadata troubleshooting
- `WebGL_Performance_Report.md` — performance findings and WebGL-specific context
- `ARTISTIC_ALIGNMENT_MANIFESTO.md` and `ArtDirectionRefinement.md` — creative direction and visual alignment

<!-- END:nextjs-agent-rules -->
