import { create } from "zustand";

interface HeroModelMetric {
  appliedScale: number;
  desiredScale: number;
  fillRatio: number;
  maxFill: number;
  lod?: string;
  distanceToCamera?: number;
  screenCoverage?: number;
}

interface FxLayerMetric {
  opacity?: number;
  scale?: number;
  lod?: string;
}

interface BudgetHealthMetric {
  estimatedFps: number;
  pressure: "nominal" | "elevated" | "critical";
  score: number;
  within: {
    frameTime: boolean;
    scrollLatency: boolean;
    drawCalls: boolean;
    triangles: boolean;
    geometries: boolean;
    textures: boolean;
    textureMemory: boolean;
    programs: boolean;
    points: boolean;
    jsHeap: boolean;
    longTasks: boolean;
    loadTime: boolean;
  };
  violations: string[];
}

interface RendererDriftMetric {
  calls: number;
  triangles: number;
  points: number;
  lines: number;
  geometries: number;
  textures: number;
  programs: number;
}

interface RenderPipelineMetric {
  samples: number;
  meanCpuMs: number;
  p95CpuMs: number;
  maxCpuMs: number;
  meanScrollLatencyMs: number;
  p95ScrollLatencyMs: number;
  maxScrollLatencyMs: number;
  over16ScrollLatencyMs: number;
  over33ScrollLatencyMs: number;
  meanDeltaMs: number;
  p95DeltaMs: number;
  maxDeltaMs: number;
  over33DeltaMs: number;
  over50DeltaMs: number;
  over100DeltaMs: number;
  longTasks: {
    count: number;
    over50Count: number;
    totalDurationMs: number;
    maxDurationMs: number;
  };
  memory: {
    jsHeapUsedMB: number | null;
    estimatedTextureMemoryMB: number;
  };
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
  postReadyRendererDrift: RendererDriftMetric | null;
  budget: BudgetHealthMetric;
}

interface StartupPhaseTimingMetric {
  assetManifestMs: number | null;
  nearScrollMs: number | null;
  warmupMs: number | null;
  compileMs: number | null;
  stableFrameMs: number | null;
  deferredStartedMs: number | null;
  deferredReadyMs: number | null;
  readyMs: number | null;
}

interface ResourceTimingMetric {
  id: string;
  url: string;
  stage: string;
  kind: string;
  transferSizeBytes: number;
  durationMs: number;
  lateAfterReady: boolean;
}

interface ResourcePipelineMetric {
  loadedEntryCritical: number;
  totalEntryCritical: number;
  loadedNearScroll: number;
  totalNearScroll: number;
  loadedDeferred: number;
  totalDeferred: number;
  lateEntryCriticalCount: number;
  lateNearScrollCount: number;
  totalTransferSizeBytes: number;
  totalTextureTransferSizeBytes: number;
  estimatedTextureMemoryMB: number;
  assetTimings: ResourceTimingMetric[];
}

interface TelemetryMetric {
  hasFallbackTriggered: boolean;
  startupTimeMs: number | null;
  safeModeReason: string | null;
  tier: string | null;
  startupPhase: string | null;
  assetProgress: number;
  warmupProgress: number;
  warmupActCount: number;
  warmedActs: number[];
  assetManifestReady: boolean;
  nearScrollReady: boolean;
  warmupReady: boolean;
  compileReady: boolean;
  gpuWarmupReady: boolean;
  deferredPreloadReady: boolean;
  startupPhaseTimings: StartupPhaseTimingMetric;
  lateRequestCount: number;
  lateRequestUrls: string[];
  compiledCheckpointIds?: string[];
  activeProgramSignatures?: string[];
  warmupCheckpointProgramCounts?: Record<string, number>;
  warmupCheckpointMissingPrograms?: Record<string, string[]>;
}

interface SceneStateMetric {
  mountedActs: number[];
  activeHeroLabel: string | null;
  activeHeroAsset: string | null;
  overlayMode: string | null;
  ambientParticleMode: string | null;
  activeHeroLod: string | null;
  activeWorldLod: string | null;
}

interface CompositionMetric {
  visibleMeshCount: number;
  transparentMeshCount: number;
  additiveMeshCount: number;
  linesCount: number;
  pointsCount: number;
  physicalMaterialCount: number;
  transmissionMaterialCount: number;
  iridescentMaterialCount: number;
  shadowCasterCount: number;
}

interface LightingPipelineMetric {
  exposure: number;
  environmentMode: string;
  shadowMapSize: number;
  ambientIntensity: number;
  hemisphereIntensity: number;
  keyIntensity: number;
  fillIntensity: number;
  rimIntensity: number;
  practicalIntensity: number;
}

interface ViewportAuditState {
  heroModels: Record<string, HeroModelMetric>;
  fxLayers: Record<string, FxLayerMetric>;
  renderPipeline: RenderPipelineMetric | null;
  resourcePipeline: ResourcePipelineMetric | null;
  lightingPipeline: LightingPipelineMetric | null;
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
  reportResourcePipeline: (metric: ResourcePipelineMetric) => void;
  reportLightingPipeline: (metric: LightingPipelineMetric) => void;
  reportTelemetry: (metric: Partial<TelemetryMetric>) => void;
  reportSceneState: (metric: Partial<SceneStateMetric>) => void;
  reportComposition: (metric: CompositionMetric) => void;
}

const INITIAL_TELEMETRY: TelemetryMetric = {
  hasFallbackTriggered: false,
  startupTimeMs: null,
  safeModeReason: null,
  tier: null,
  startupPhase: null,
  assetProgress: 0,
  warmupProgress: 0,
  warmupActCount: 0,
  warmedActs: [],
  assetManifestReady: false,
  nearScrollReady: false,
  warmupReady: false,
  compileReady: false,
  gpuWarmupReady: false,
  deferredPreloadReady: false,
  startupPhaseTimings: {
    assetManifestMs: null,
    nearScrollMs: null,
    warmupMs: null,
    compileMs: null,
    stableFrameMs: null,
    deferredStartedMs: null,
    deferredReadyMs: null,
    readyMs: null,
  },
  lateRequestCount: 0,
  lateRequestUrls: [],
  compiledCheckpointIds: [],
  activeProgramSignatures: [],
  warmupCheckpointProgramCounts: {},
  warmupCheckpointMissingPrograms: {},
};

const INITIAL_SCENE_STATE: SceneStateMetric = {
  mountedActs: [],
  activeHeroLabel: null,
  activeHeroAsset: null,
  overlayMode: null,
  ambientParticleMode: null,
  activeHeroLod: null,
  activeWorldLod: null,
};

const INITIAL_COMPOSITION: CompositionMetric = {
  visibleMeshCount: 0,
  transparentMeshCount: 0,
  additiveMeshCount: 0,
  linesCount: 0,
  pointsCount: 0,
  physicalMaterialCount: 0,
  transmissionMaterialCount: 0,
  iridescentMaterialCount: 0,
  shadowCasterCount: 0,
};

export const useViewportAuditStore = create<ViewportAuditState>((set) => ({
  heroModels: {},
  fxLayers: {},
  renderPipeline: null,
  resourcePipeline: null,
  lightingPipeline: null,
  telemetry: INITIAL_TELEMETRY,
  sceneState: INITIAL_SCENE_STATE,
  composition: INITIAL_COMPOSITION,
  reset: () =>
    set({
      heroModels: {},
      fxLayers: {},
      renderPipeline: null,
      resourcePipeline: null,
      lightingPipeline: null,
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
  reportResourcePipeline: (metric) =>
    set({
      resourcePipeline: metric,
    }),
  reportLightingPipeline: (metric) =>
    set({
      lightingPipeline: metric,
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
