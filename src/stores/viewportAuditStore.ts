import { create } from "zustand";

interface HeroModelMetric {
  appliedScale: number;
  desiredScale: number;
  fillRatio: number;
  maxFill: number;
}

interface FxLayerMetric {
  opacity?: number;
  scale?: number;
}

interface RenderPipelineMetric {
  samples: number;
  meanCpuMs: number;
  p95CpuMs: number;
  maxCpuMs: number;
  meanDeltaMs: number;
  p95DeltaMs: number;
  maxDeltaMs: number;
  over33DeltaMs: number;
  over50DeltaMs: number;
  over100DeltaMs: number;
  renderer: {
    frame: number;
    calls: number;
    triangles: number;
    points: number;
    lines: number;
    geometries: number;
    textures: number;
    programs: number;
  };
}

interface TelemetryMetric {
  hasFallbackTriggered: boolean;
  startupTimeMs: number | null;
  safeModeReason: string | null;
  tier: string | null;
}

interface ViewportAuditState {
  heroModels: Record<string, HeroModelMetric>;
  fxLayers: Record<string, FxLayerMetric>;
  renderPipeline: RenderPipelineMetric | null;
  telemetry: TelemetryMetric;
  reset: () => void;
  reportHeroModel: (label: string, metric: HeroModelMetric) => void;
  reportFxLayer: (label: string, metric: FxLayerMetric) => void;
  reportRenderPipeline: (metric: RenderPipelineMetric) => void;
  reportTelemetry: (metric: Partial<TelemetryMetric>) => void;
}

export const useViewportAuditStore = create<ViewportAuditState>((set) => ({
  heroModels: {},
  fxLayers: {},
  renderPipeline: null,
  telemetry: {
    hasFallbackTriggered: false,
    startupTimeMs: null,
    safeModeReason: null,
    tier: null,
  },
  reset: () =>
    set({
      heroModels: {},
      fxLayers: {},
      renderPipeline: null,
      telemetry: {
        hasFallbackTriggered: false,
        startupTimeMs: null,
        safeModeReason: null,
        tier: null,
      },
    }),
  reportHeroModel: (label, metric) =>
    set((state) => ({
      heroModels: {
        ...state.heroModels,
        [label]: metric,
      },
    })),
  reportFxLayer: (label, metric) =>
    set((state) => ({
      fxLayers: {
        ...state.fxLayers,
        [label]: metric,
      },
    })),
  reportRenderPipeline: (metric) =>
    set({
      renderPipeline: metric,
    }),
  reportTelemetry: (metric) => 
    set((state) => ({
      telemetry: { ...state.telemetry, ...metric }
    })),
}));
