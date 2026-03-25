# LandingPageV5

This is the cutting-edge interactive landing page for Project V5, built on a robust, heavily instrumented 3D pipeline natively integrated into the modern Next.js App Router paradigm.

## Project Status Dashboard

- **Status:** **Tuning & Instrumentation pass completed.** Preparing for optionally small Phase D features or advancing directly to Metamorphic Geometry ([Phase 2]).
- **Frameworks:** Next.js 16 (App Router), React Three Fiber, Three.js 0.183, Zustand.
- **Key Features:**
    - 5-Act continuous infinite-scroll 3D experience.
    - Metamorphic architecture based on \SplineEngine\.
    - Auto-scaling performance settings based on GPU hardware/device constraints.
    - Cross-viewport comprehensive testing via Playwright audits covering metrics/telemetry.

### Quick Links to Operating Truth

Stay aligned with the team's operational directives by maintaining truth in:    
- [\EVOLUTION_STRATEGY.md\](docs/EVOLUTION_STRATEGY.md) - Active architecture updates.
- [\ASSET_PROCUREMENT_PLAN.md\](docs/ASSET_PROCUREMENT_PLAN.md) / [\ASSET_MANIFEST.csv\](docs/ASSET_MANIFEST.csv) - Authoritative asset usage truth and current status.
- [\SOCIAL_PREVIEW_QA.md\](docs/SOCIAL_PREVIEW_QA.md) - Guide for running the generated layout preview tests.

## Development Workflows

### Getting Started

Install dependencies, then run the development server via Turbopack:

\\\ash
npm install
npm run dev
\\\

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

**Note:** The system detects your system boundaries and may default to a \'low'\ or \'medium'\ quality tier based on development checks to favor iteration speed over visual fidelity.

### Auditing Tools

This project is deeply instrumented to measure runtime stability, WebGL draw calls, frame timings, and custom asset metrics.

You can run an automated headless viewport test suite to grab stability snapshots across act phases.

\\\ash
npx playwright test viewport-audit.spec.ts --reporter=list
\\\

Or you can see manual readouts by navigating to:
\http://localhost:3000/?audit=1\

Use \?audit=1&safeMode=1\ to simulate a failed fallback scenario, or \?forceTier=high\ to aggressively force higher-quality parameters on your dev environment.

## Social Preview Verification

This project uses generated metadata image routes:

- Open Graph: \/opengraph-image\
- Twitter: \/twitter-image\

Detailed runbook: \docs/SOCIAL_PREVIEW_QA.md\

### Local checks

1. Ensure \.env\ contains:
        - \NEXT_PUBLIC_SITE_URL=http://localhost:3000\
2. Start the app and open:
        - \http://localhost:3000/opengraph-image\
        - \http://localhost:3000/twitter-image\
3. Confirm both routes return a rendered image card (1200×630).
4. Open the homepage and inspect page source/metadata to verify:
        - \og:image\ points to \/opengraph-image\
        - \	witter:image\ points to \/twitter-image\

### Optional static override

If design provides a finalized static social card, place it at:

- \public/social/og-image-1200x630.png\

Then update metadata image URLs in \src/app/layout.tsx\ to this static path if desired.

### Release checklist

- Production \NEXT_PUBLIC_SITE_URL\ is set to the final domain.
- Social image endpoints are reachable on deployed URL.
- If static override is used, keep image sizes within platform limits:
  - Open Graph image ≤ 8MB
  - Twitter image ≤ 5MB

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
