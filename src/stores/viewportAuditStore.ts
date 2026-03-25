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

interface SceneStateMetric {
  mountedActs: number[];
  activeHeroLabel: string | null;
  overlayMode: string | null;
  ambientParticleMode: string | null;
}

interface CompositionMetric {
  visibleMeshCount: number;
  transparentMeshCount: number;
  additiveMeshCount: number;
  linesCount: number;
  pointsCount: number;
}

interface ViewportAuditState {
  heroModels: Record<string, HeroModelMetric>;
  fxLayers: Record<string, FxLayerMetric>;
  renderPipeline: RenderPipelineMetric | null;
  telemetry: TelemetryMetric;
  sceneState: SceneStateMetric;
  composition: CompositionMetric;
  reset: () => void;
  reportHeroModel: (label: string, metric: HeroModelMetric) => void;
  clearHeroModel: (label: string) => void;
  pruneHeroModels: (labels: string[]) => void;
  reportFxLayer: (label: string, metric: FxLayerMetric) => void;
  clearFxLayer: (label: string) => void;
  pruneFxLayers: (labels: string[]) => void;
  reportRenderPipeline: (metric: RenderPipelineMetric) => void;
  reportTelemetry: (metric: Partial<TelemetryMetric>) => void;
  reportSceneState: (metric: Partial<SceneStateMetric>) => void;
  reportComposition: (metric: CompositionMetric) => void;
}

const INITIAL_TELEMETRY: TelemetryMetric = {
  hasFallbackTriggered: false,
  startupTimeMs: null,
  safeModeReason: null,
  tier: null,
};

const INITIAL_SCENE_STATE: SceneStateMetric = {
  mountedActs: [],
  activeHeroLabel: null,
  overlayMode: null,
  ambientParticleMode: null,
};

const INITIAL_COMPOSITION: CompositionMetric = {
  visibleMeshCount: 0,
  transparentMeshCount: 0,
  additiveMeshCount: 0,
  linesCount: 0,
  pointsCount: 0,
};

export const useViewportAuditStore = create<ViewportAuditState>((set) => ({
  heroModels: {},
  fxLayers: {},
  renderPipeline: null,
  telemetry: INITIAL_TELEMETRY,
  sceneState: INITIAL_SCENE_STATE,
  composition: INITIAL_COMPOSITION,
  reset: () =>
    set({
      heroModels: {},
      fxLayers: {},
      renderPipeline: null,
      telemetry: INITIAL_TELEMETRY,
      sceneState: INITIAL_SCENE_STATE,
      composition: INITIAL_COMPOSITION,
    }),
  reportHeroModel: (label, metric) =>
    set((state) => ({
      heroModels: {
        ...state.heroModels,
        [label]: metric,
      },
    })),
  clearHeroModel: (label) =>
    set((state) => {
      if (!(label in state.heroModels)) {
        return state;
      }

      const nextHeroModels = { ...state.heroModels };
      delete nextHeroModels[label];
      return { heroModels: nextHeroModels };
    }),
  pruneHeroModels: (labels) =>
    set((state) => ({
      heroModels: Object.fromEntries(
        Object.entries(state.heroModels).filter(([label]) =>
          labels.includes(label)
        )
      ),
    })),
  reportFxLayer: (label, metric) =>
    set((state) => ({
      fxLayers: {
        ...state.fxLayers,
        [label]: metric,
      },
    })),
  clearFxLayer: (label) =>
    set((state) => {
      if (!(label in state.fxLayers)) {
        return state;
      }

      const nextFxLayers = { ...state.fxLayers };
      delete nextFxLayers[label];
      return { fxLayers: nextFxLayers };
    }),
  pruneFxLayers: (labels) =>
    set((state) => ({
      fxLayers: Object.fromEntries(
        Object.entries(state.fxLayers).filter(([label]) =>
          labels.includes(label)
        )
      ),
    })),
  reportRenderPipeline: (metric) =>
    set({
      renderPipeline: metric,
    }),
  reportTelemetry: (metric) =>
    set((state) => ({
      telemetry: { ...state.telemetry, ...metric },
    })),
  reportSceneState: (metric) =>
    set((state) => ({
      sceneState: { ...state.sceneState, ...metric },
    })),
  reportComposition: (metric) =>
    set({
      composition: metric,
    }),
}));
