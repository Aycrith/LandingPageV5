# Technical Specification

## Architecture

### Framework & Tooling
- **Framework:** Next.js 15 (App Router) with Turbopack
- **3D Engine:** Three.js via React Three Fiber (`@react-three/fiber`, `@react-three/drei`)
- **Post-Processing:** `@react-three/postprocessing` / `postprocessing`
- **State Management:** Zustand (multiple stores)
- **Language:** TypeScript
- **Styling:** (TBD — likely Tailwind or CSS Modules based on Next.js conventions)

### Store Architecture

| Store | Purpose |
|---|---|
| `capsStore` | Device capabilities, quality tier, runtime budgets |
| `sceneLoadStore` | Asset loading progress, readiness flags, fallback triggers |
| `scrollStore` | Active act index, scroll progress per act |
| `uiStore` | DOM UI state — load progress, ready flag |
| `viewportAuditStore` | Runtime rendering metrics & viewport fill auditing |

### Quality Tier Profiles

```typescript
type QualityTier = "high" | "medium" | "low";

interface Budgets {
  fps: number;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  programs: number;
  points: number;
  textureMemoryMB: number;
  loadTimeMs: number;
  frameTimeMs: number;
}

interface RuntimeCaps {
  tier: QualityTier;
  isMobile: boolean;
  supportsWebGL2: boolean;
  maxParticles: number;
  enableShadows: boolean;
  enablePostProcessing: boolean;
  dpr: [number, number];
  prefersReducedMotion: boolean;
  budgets: Budgets;
}
```

### Canvas Pipeline

```
Experience (Canvas provider)
├── SceneManager (orchestrates acts)
│   └── CuratedHeroLayer (LOD-aware hero assets)
│       └── Act components (Act6QuantumConsciousness, etc.)
├── CameraRig (scroll-driven camera)
├── PostProcessingStack (act-blended effects)
├── StartupReadinessGate (stable-frame detection)
├── ViewportAuditProbe (runtime metrics)
└── CanvasErrorBoundary / PostFxErrorBoundary (resilience)
```

### Key Design Decisions
1. **Startup Readiness Gate** uses both per-frame counting and interval-based parallel paths to handle Turbopack JIT delays in development. A local `gateOpenAt` ref decouples gate timing from store/module initialization, preventing premature startup budget exhaustion during dev-mode JIT compilation.
2. **Error boundaries** force UI completion (`setLoadProgress(1)`, `setReady()`, `markFallbackTriggered()`) so users never see an infinite loader.
3. **PostProcessingStack** null-checks the GL renderer to prevent crashes during SSR or before canvas initialization.
4. **CapsStore** maintains a `QUALITY_PROFILES` map providing per-tier defaults for `maxParticles`, `enableShadows`, `enablePostProcessing`, `dpr`, and full `Budgets` — enabling runtime adaptation without prop drilling.

### Build & Route Configuration
- **App type:** `app` (Next.js App Router)
- **Static routes:** `/`, `/_global-error`, `/_not-found`, `/favicon.ico`
- **No dynamic routes** currently defined
- **Image optimization:** Default Next.js loader, WebP format, standard device/image sizes
- **Prerender:** `/` and `/_global-error` are statically prerendered (ISR disabled — `initialRevalidateSeconds: false`)
- **Trailing slashes:** Redirected via 308 (standard Next.js behavior)

### Bundle Size Profile
| Route | First-Load JS (uncompressed) |
|---|---|
| `/` | ~565KB |
| `/_not-found` | ~514KB |

> **Note:** These are uncompressed sizes. Compressed (gzip/brotli) sizes need measurement against the <500KB target.