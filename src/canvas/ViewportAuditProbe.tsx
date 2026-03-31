"use client";

import { useEffect, useEffectEvent, useMemo, useRef } from "react";
import * as THREE from "three";
import { addAfterEffect, addEffect, useThree } from "@react-three/fiber";
import { STARTUP_ASSET_MANIFEST } from "./assetManifest";
import {
  getEffectiveStartupAssetIdsForStage,
  getEffectiveStartupAssetPathsForStage,
} from "./startupAssetPolicy";
import { WORLD_PHASES } from "./viewportProfiles";
import { useViewportAuditStore } from "@/stores/viewportAuditStore";
import { useCapsStore } from "@/stores/capsStore";
import {
  areNearScrollAssetsReady,
  getSceneStartupPhase,
  getSceneWarmupProgress,
  getStartupPhaseTimings,
  useSceneLoadStore,
} from "@/stores/sceneLoadStore";
import { useScrollStore } from "@/stores/scrollStore";
import { evaluateRenderBudget } from "@/lib/scene";
import { buildMaterialProgramSignature, collectSceneProgramSignatures } from "./programSignatures";

const MAX_SAMPLES = 600;
const PUBLISH_EVERY_FRAMES = 12;
const RESOURCE_SCAN_EVERY_FRAMES = 60;

type RenderableObject = THREE.Object3D & {
  isMesh?: boolean;
  isPoints?: boolean;
  isLine?: boolean;
  castShadow?: boolean;
  geometry?: THREE.BufferGeometry;
  material?: THREE.Material | THREE.Material[];
  frustumCulled?: boolean;
};

type InspectableMaterial = THREE.Material & {
  wireframe?: boolean;
  roughness?: number;
  metalness?: number;
  emissiveIntensity?: number;
  transmission?: number;
  iridescence?: number;
  map?: THREE.Texture | null;
};

interface RendererSnapshot {
  frame: number;
  calls: number;
  triangles: number;
  points: number;
  lines: number;
  geometries: number;
  textures: number;
  programs: number;
}

interface CompositionSnapshot {
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

interface ResourceTimingSnapshot {
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
  assetTimings: Array<{
    id: string;
    url: string;
    stage: string;
    kind: string;
    transferSizeBytes: number;
    durationMs: number;
    lateAfterReady: boolean;
  }>;
  lateRequestUrls: string[];
}

const MATERIAL_TEXTURE_SLOTS = [
  "map",
  "normalMap",
  "roughnessMap",
  "metalnessMap",
  "alphaMap",
  "aoMap",
  "emissiveMap",
  "clearcoatMap",
  "clearcoatRoughnessMap",
  "clearcoatNormalMap",
  "transmissionMap",
  "thicknessMap",
  "iridescenceMap",
  "iridescenceThicknessMap",
  "sheenColorMap",
  "sheenRoughnessMap",
  "specularColorMap",
  "specularIntensityMap",
  "bumpMap",
  "displacementMap",
  "envMap",
] as const;

function isActuallyVisible(node: THREE.Object3D | null): boolean {
  let current: THREE.Object3D | null = node;
  while (current) {
    if (!current.visible) {
      return false;
    }
    current = current.parent;
  }
  return true;
}

function pushSample(samples: number[], value: number) {
  if (samples.length >= MAX_SAMPLES) {
    samples.shift();
  }
  samples.push(value);
}

function mean(samples: number[]): number {
  if (samples.length === 0) {
    return 0;
  }

  return samples.reduce((sum, sample) => sum + sample, 0) / samples.length;
}

function percentile(samples: number[], ratio: number): number {
  if (samples.length === 0) {
    return 0;
  }

  const sorted = [...samples].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * ratio))];
}

function collectMeshSnapshot(scene: THREE.Scene) {
  const meshes: Array<Record<string, unknown>> = [];
  const composition: CompositionSnapshot = {
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

  scene.traverse((node) => {
    const child = node as RenderableObject;
    if (
      !(child.isMesh || child.isPoints || child.isLine) ||
      !isActuallyVisible(child)
    ) {
      return;
    }

    composition.visibleMeshCount += 1;
    if (child.isMesh && child.castShadow) {
      composition.shadowCasterCount += 1;
    }
    if (child.isPoints) {
      composition.pointsCount += 1;
    }
    if (child.isLine) {
      composition.linesCount += 1;
    }

    let bboxData = null;
    if (child.geometry) {
      if (!child.geometry.boundingBox) {
        child.geometry.computeBoundingBox();
      }
      if (child.geometry.boundingBox) {
        const bbox = child.geometry.boundingBox.clone();
        bbox.applyMatrix4(child.matrixWorld);
        bboxData = {
          min: bbox.min.toArray(),
          max: bbox.max.toArray(),
        };
      }
    }

    const processMaterial = (material: InspectableMaterial) => {
      if (material.transparent && material.opacity > 0.01) {
        composition.transparentMeshCount += 1;
      }
      if (material.blending === THREE.AdditiveBlending && material.opacity > 0.01) {
        composition.additiveMeshCount += 1;
      }
      if (
        material.type === "MeshPhysicalMaterial" ||
        material.type === "MeshStandardMaterial"
      ) {
        composition.physicalMaterialCount += 1;
      }
      if ((material.transmission ?? 0) > 0.02) {
        composition.transmissionMaterialCount += 1;
      }
      if ((material.iridescence ?? 0) > 0.02) {
        composition.iridescentMaterialCount += 1;
      }

      return {
        type: material.type,
        transparent: material.transparent,
        opacity: material.opacity,
        blending: material.blending,
        depthWrite: material.depthWrite,
        depthTest: material.depthTest,
        wireframe: material.wireframe,
        side: material.side,
        visible: material.visible,
        roughness: material.roughness,
        metalness: material.metalness,
        emissiveIntensity: material.emissiveIntensity,
        transmission: material.transmission,
        iridescence: material.iridescence,
        mapUrl: (material.map?.source?.data as HTMLImageElement | null)?.src ?? null,
      };
    };

    const materialsInfo = child.material
      ? Array.isArray(child.material)
        ? child.material.map(processMaterial)
        : [processMaterial(child.material)]
      : [];

    meshes.push({
      name: child.name || "Unnamed",
      type: child.type,
      uuid: child.uuid,
      visible: child.visible,
      renderOrder: child.renderOrder,
      position: child.getWorldPosition(new THREE.Vector3()).toArray(),
      scale: child.scale.toArray(),
      rotation: [child.rotation.x, child.rotation.y, child.rotation.z],
      materials: materialsInfo,
      boundingBox: bboxData,
      frustumCulled: child.frustumCulled,
    });
  });

  return { meshes, composition };
}

function collectActiveRendererResources(scene: THREE.Scene) {
  const geometryIds = new Set<string>();
  const textureIds = new Set<string>();
  const programSignatures = new Set<string>();

  scene.traverse((node) => {
    const child = node as RenderableObject;
    if (!(child.isMesh || child.isPoints || child.isLine) || !isActuallyVisible(child)) {
      return;
    }

    if (child.geometry?.uuid) {
      geometryIds.add(child.geometry.uuid);
    }

    const materials = child.material
      ? Array.isArray(child.material)
        ? child.material
        : [child.material]
      : [];

    for (const material of materials) {
      programSignatures.add(buildMaterialProgramSignature(material));

      const textureMaterial = material as unknown as Record<string, unknown>;
      for (const slot of MATERIAL_TEXTURE_SLOTS) {
        const texture = textureMaterial[slot] as THREE.Texture | null | undefined;
        if (texture?.uuid) {
          textureIds.add(texture.uuid);
        }
      }
    }
  });

  return {
    geometries: geometryIds.size,
    textures: textureIds.size,
    programs: programSignatures.size,
  };
}

function collectLateStartupRequests(
  readyAt: number | null,
  trackedPaths: readonly string[]
) {
  if (readyAt == null || typeof performance.getEntriesByType !== "function") {
    return [];
  }

  const readyAtPerformanceMs = Math.max(readyAt - performance.timeOrigin, 0);
  const trackedPathSet = new Set(trackedPaths);

  return performance
    .getEntriesByType("resource")
    .flatMap((entry) => {
      if (!(entry instanceof PerformanceResourceTiming)) {
        return [];
      }

      const pathname = new URL(entry.name).pathname;
      return trackedPathSet.has(pathname) && entry.startTime > readyAtPerformanceMs
        ? [pathname]
        : [];
    })
    .filter((pathname, index, list) => list.indexOf(pathname) === index)
    .sort();
}

function summarizeRendererSamples(
  samples: RendererSnapshot[],
  fallback: RendererSnapshot
): RendererSnapshot {
  if (samples.length === 0) {
    return fallback;
  }

  return samples.reduce<RendererSnapshot>(
    (summary, sample) => ({
      frame: sample.frame,
      calls: Math.max(summary.calls, sample.calls),
      triangles: Math.max(summary.triangles, sample.triangles),
      points: Math.max(summary.points, sample.points),
      lines: Math.max(summary.lines, sample.lines),
      geometries: Math.max(summary.geometries, sample.geometries),
      textures: Math.max(summary.textures, sample.textures),
      programs: Math.max(summary.programs, sample.programs),
    }),
    {
      ...fallback,
      calls: 0,
      triangles: 0,
      points: 0,
      lines: 0,
      geometries: 0,
      textures: 0,
      programs: 0,
    }
  );
}

function collectResourceTimingSnapshot({
  readyAt,
  tier,
  loadedAssets,
}: {
  readyAt: number | null;
  tier: "high" | "medium" | "low";
  loadedAssets: Record<string, boolean>;
}): ResourceTimingSnapshot {
  const timingsByPath = new Map<
    string,
    {
      durationMs: number;
      transferSizeBytes: number;
      startTime: number;
      responseEnd: number;
    }
  >();

  if (typeof performance.getEntriesByType === "function") {
    for (const entry of performance.getEntriesByType("resource")) {
      if (!(entry instanceof PerformanceResourceTiming)) {
        continue;
      }

      const pathname = new URL(entry.name, window.location.href).pathname;
      const current = timingsByPath.get(pathname);
      timingsByPath.set(pathname, {
        durationMs: Math.max(current?.durationMs ?? 0, entry.duration),
        transferSizeBytes:
          Math.max(current?.transferSizeBytes ?? 0, entry.transferSize ?? 0),
        startTime: Math.min(current?.startTime ?? entry.startTime, entry.startTime),
        responseEnd: Math.max(current?.responseEnd ?? 0, entry.responseEnd),
      });
    }
  }

  const entryCriticalAssetIds = getEffectiveStartupAssetIdsForStage(
    "entryCritical",
    tier
  );
  const nearScrollAssetIds = getEffectiveStartupAssetIdsForStage(
    "nearScrollCritical",
    tier
  );
  const deferredAssetIds = getEffectiveStartupAssetIdsForStage("deferred", tier);
  const entryCriticalPaths = getEffectiveStartupAssetPathsForStage(
    "entryCritical",
    tier
  );
  const nearScrollPaths = getEffectiveStartupAssetPathsForStage(
    "nearScrollCritical",
    tier
  );

  const lateEntryCritical = collectLateStartupRequests(
    readyAt,
    entryCriticalPaths
  );
  const lateNearScroll = collectLateStartupRequests(readyAt, nearScrollPaths);
  const latePathSet = new Set([...lateEntryCritical, ...lateNearScroll]);

  const assetTimings = STARTUP_ASSET_MANIFEST.map((asset) => {
    const timing = timingsByPath.get(asset.url);
    return {
      id: asset.id,
      url: asset.url,
      stage: asset.stage,
      kind: asset.kind,
      transferSizeBytes: timing?.transferSizeBytes ?? 0,
      durationMs: timing?.durationMs ?? 0,
      lateAfterReady: latePathSet.has(asset.url),
    };
  });

  const loadedEntryCritical = entryCriticalAssetIds.filter(
    (assetId) => loadedAssets[assetId]
  ).length;
  const loadedNearScroll = nearScrollAssetIds.filter(
    (assetId) => loadedAssets[assetId]
  ).length;
  const loadedDeferred = deferredAssetIds.filter((assetId) => loadedAssets[assetId]).length;
  const totalTransferSizeBytes = assetTimings.reduce(
    (sum, asset) => sum + asset.transferSizeBytes,
    0
  );
  const totalTextureTransferSizeBytes = assetTimings
    .filter((asset) => asset.kind !== "model")
    .reduce((sum, asset) => sum + asset.transferSizeBytes, 0);
  const estimatedTextureMemoryMB =
    STARTUP_ASSET_MANIFEST.filter(
      (asset) => asset.kind !== "model" && asset.stage !== "deferred"
    )
      .filter((asset) => (timingsByPath.get(asset.url)?.responseEnd ?? 0) > 0)
      .reduce((sum, asset) => sum + (asset.estimatedTextureBytes ?? 0), 0) /
    (1024 * 1024);

  return {
    loadedEntryCritical,
    totalEntryCritical: entryCriticalAssetIds.length,
    loadedNearScroll,
    totalNearScroll: nearScrollAssetIds.length,
    loadedDeferred,
    totalDeferred: deferredAssetIds.length,
    lateEntryCriticalCount: lateEntryCritical.length,
    lateNearScrollCount: lateNearScroll.length,
    totalTransferSizeBytes,
    totalTextureTransferSizeBytes,
    estimatedTextureMemoryMB,
    assetTimings,
    lateRequestUrls: [...lateEntryCritical, ...lateNearScroll].sort(),
  };
}

export function ViewportAuditProbe() {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const auditMode = useMemo(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("audit") === "1",
    []
  );
  const cpuSamplesRef = useRef<number[]>([]);
  const deltaSamplesRef = useRef<number[]>([]);
  const scrollLatencySamplesRef = useRef<number[]>([]);
  const longTaskDurationsRef = useRef<number[]>([]);
  const rendererSamplesRef = useRef<RendererSnapshot[]>([]);
  const frameStartRef = useRef(0);
  const lastFrameAtRef = useRef<number | null>(null);
  const frameCountRef = useRef(0);
  const lateRequestScanFrameRef = useRef(-1);
  const lateRequestReadyAtRef = useRef<number | null>(null);
  const lateRequestUrlsRef = useRef<string[]>([]);
  const readySampleWindowAtRef = useRef<number | null>(null);
  const fullWarmupBaselineResetRef = useRef(false);
  const latestRendererRef = useRef<RendererSnapshot>({
    frame: 0,
    calls: 0,
    triangles: 0,
    points: 0,
    lines: 0,
    geometries: 0,
    textures: 0,
    programs: 0,
  });
  const latestRawRendererRef = useRef<RendererSnapshot>({
    frame: 0,
    calls: 0,
    triangles: 0,
    points: 0,
    lines: 0,
    geometries: 0,
    textures: 0,
    programs: 0,
  });
  const latestActiveResourceCountsRef = useRef({
    geometries: 0,
    textures: 0,
    programs: 0,
  });
  const latestCompositionRef = useRef<CompositionSnapshot>({
    visibleMeshCount: 0,
    transparentMeshCount: 0,
    additiveMeshCount: 0,
    linesCount: 0,
    pointsCount: 0,
    physicalMaterialCount: 0,
    transmissionMaterialCount: 0,
    iridescentMaterialCount: 0,
    shadowCasterCount: 0,
  });
  const latestInspectionMeshesRef = useRef<Array<Record<string, unknown>>>([]);
  const latestInspectionFrameRef = useRef<number>(-1);
  const latestResourcePipelineRef = useRef<ResourceTimingSnapshot>({
    loadedEntryCritical: 0,
    totalEntryCritical: 0,
    loadedNearScroll: 0,
    totalNearScroll: 0,
    loadedDeferred: 0,
    totalDeferred: 0,
    lateEntryCriticalCount: 0,
    lateNearScrollCount: 0,
    totalTransferSizeBytes: 0,
    totalTextureTransferSizeBytes: 0,
    estimatedTextureMemoryMB: 0,
    assetTimings: [],
    lateRequestUrls: [],
  });
  const readyRendererBaselineRef = useRef<RendererSnapshot | null>(null);
  const lastSeenScrollSequenceRef = useRef(0);
  const latestProgramSignaturesRef = useRef<string[]>([]);

  const refreshInspectionSnapshot = useEffectEvent((force = false) => {
    const rendererFrame = latestRendererRef.current.frame;

    if (!force && latestInspectionFrameRef.current === rendererFrame) {
      return {
        meshes: latestInspectionMeshesRef.current,
        composition: latestCompositionRef.current,
      };
    }

    const inspection = collectMeshSnapshot(scene);
    latestInspectionMeshesRef.current = inspection.meshes;
    latestCompositionRef.current = inspection.composition;
    latestInspectionFrameRef.current = rendererFrame;
    useViewportAuditStore.getState().reportComposition(inspection.composition);

    return inspection;
  });

  const publishTelemetry = useEffectEvent((forceResourceScan = false) => {
    const loadState = useSceneLoadStore.getState();
    const capsState = useCapsStore.getState();
    const tier = capsState.caps?.tier ?? "low";
    if (forceResourceScan) {
      latestActiveResourceCountsRef.current = collectActiveRendererResources(scene);
      latestProgramSignaturesRef.current = collectSceneProgramSignatures(scene);
    }
    const entryCriticalAssetIds = getEffectiveStartupAssetIdsForStage(
      "entryCritical",
      tier
    );
    const loadedAssets = entryCriticalAssetIds.filter(
      (assetId) => loadState.loadedAssets[assetId]
    ).length;
    const assetProgress = loadedAssets / Math.max(entryCriticalAssetIds.length, 1);
    const warmupProgress = getSceneWarmupProgress(loadState);
    const activeProgramSignatures = latestProgramSignaturesRef.current;
    const warmupProgramCounts = Object.fromEntries(
      Object.entries(loadState.warmupCheckpointProgramSignatures).map(
        ([checkpointId, signatures]) => [checkpointId, signatures.length]
      )
    );
    const warmupProgramDiffs = Object.fromEntries(
      Object.entries(loadState.warmupCheckpointProgramSignatures).map(
        ([checkpointId, signatures]) => [
          checkpointId,
          activeProgramSignatures.filter(
            (signature) => !signatures.includes(signature)
          ),
        ]
      )
    );
    const shouldRescanResources =
      forceResourceScan ||
      loadState.readyAt !== lateRequestReadyAtRef.current ||
      lateRequestUrlsRef.current.length === 0 ||
      frameCountRef.current - lateRequestScanFrameRef.current >= RESOURCE_SCAN_EVERY_FRAMES;

    if (shouldRescanResources) {
      latestResourcePipelineRef.current = collectResourceTimingSnapshot({
        readyAt: loadState.readyAt,
        tier,
        loadedAssets: loadState.loadedAssets,
      });
      lateRequestUrlsRef.current = latestResourcePipelineRef.current.lateRequestUrls;
      lateRequestReadyAtRef.current = loadState.readyAt;
      lateRequestScanFrameRef.current = frameCountRef.current;
      useSceneLoadStore.getState().reportLateRequests(lateRequestUrlsRef.current);
      useViewportAuditStore.getState().reportResourcePipeline({
        ...latestResourcePipelineRef.current,
      });
    }

    useViewportAuditStore.getState().reportTelemetry({
      hasFallbackTriggered: loadState.hasFallbackTriggered,
      startupTimeMs:
        loadState.readyAt != null
          ? loadState.readyAt - loadState.startupStartedAt
          : loadState.stableFrameReadyAt != null
            ? loadState.stableFrameReadyAt - loadState.startupStartedAt
            : null,
      safeModeReason: (() => {
        if (typeof window === "undefined") return null;
        const urlSafeMode = new URLSearchParams(window.location.search).get(
          "safeMode"
        );
        if (urlSafeMode === "1") return "url_flag";
        const storedSafeMode = window.localStorage.getItem("lpv5-safe-mode");
        if (storedSafeMode === "1") return "stored_flag";
        if (loadState.hasFallbackTriggered) return "timeout";
        return null;
      })(),
      tier: capsState.caps?.tier ?? null,
      startupPhase: getSceneStartupPhase(loadState),
      assetProgress,
      warmupProgress,
      warmupActCount: loadState.warmedActs.length,
      warmedActs: loadState.warmedActs,
      assetManifestReady: loadState.assetManifestReady,
      nearScrollReady: areNearScrollAssetsReady(loadState),
      warmupReady: loadState.warmupReady,
      compileReady: loadState.compileReady,
      gpuWarmupReady: loadState.shaderWarmupReady,
      deferredPreloadReady: loadState.deferredPreloadReadyAt != null,
      startupPhaseTimings: getStartupPhaseTimings(loadState),
      lateRequestCount: lateRequestUrlsRef.current.length,
      lateRequestUrls: lateRequestUrlsRef.current,
      compiledCheckpointIds: loadState.compiledWarmupCheckpointIds,
      activeProgramSignatures,
      warmupCheckpointProgramCounts: warmupProgramCounts,
      warmupCheckpointMissingPrograms: warmupProgramDiffs,
    });
  });

  const publishMetrics = useEffectEvent(() => {
    if (deltaSamplesRef.current.length === 0) {
      return;
    }

    const loadState = useSceneLoadStore.getState();
    const capsState = useCapsStore.getState();
    const startupTimeMs =
      loadState.readyAt != null ? loadState.readyAt - loadState.startupStartedAt : null;
    const jsHeapUsedMB = awaitableHeapMB();
    const rendererSummary = summarizeRendererSamples(
      rendererSamplesRef.current,
      latestRendererRef.current
    );
    const meanCpuMs = mean(cpuSamplesRef.current);
    const cpuLongTaskSamples = cpuSamplesRef.current.filter((sample) => sample > 50);
    const meanDeltaMs = mean(deltaSamplesRef.current);
    const budgetFrameTimeMs = auditMode ? meanCpuMs : meanDeltaMs;
    const p95ScrollLatencyMs = percentile(scrollLatencySamplesRef.current, 0.95);
    const estimatedTextureMemoryMB =
      latestResourcePipelineRef.current.estimatedTextureMemoryMB;

    const budget = capsState.caps
      ? evaluateRenderBudget({
          budgets: capsState.caps.budgets,
          meanDeltaMs: budgetFrameTimeMs,
          p95ScrollLatencyMs,
          textureMemoryMB: estimatedTextureMemoryMB,
          jsHeapMB: jsHeapUsedMB,
          longTaskCount: cpuLongTaskSamples.length,
          renderer: rendererSummary,
          startupTimeMs,
        })
      : evaluateRenderBudget({
          budgets: {
            fps: 30,
            drawCalls: 50,
            triangles: 180000,
            geometries: 72,
            textures: 18,
            programs: 12,
            points: 12000,
            textureMemoryMB: 64,
            jsHeapMB: 256,
            loadTimeMs: 9000,
            frameTimeMs: 33.3,
            scrollLatencyMs: 33.3,
            maxLongTasks: 2,
          },
          meanDeltaMs: budgetFrameTimeMs,
          p95ScrollLatencyMs,
          textureMemoryMB: estimatedTextureMemoryMB,
          jsHeapMB: jsHeapUsedMB,
          longTaskCount: cpuLongTaskSamples.length,
          renderer: rendererSummary,
          startupTimeMs,
        });

    const readyBaseline = readyRendererBaselineRef.current;
    const composition = latestCompositionRef.current;
    const warmedProgramUniverse = new Set(
      Object.values(loadState.warmupCheckpointProgramSignatures).flat()
    );
    const uncoveredActiveProgramCount = latestProgramSignaturesRef.current.filter(
      (signature) => !warmedProgramUniverse.has(signature)
    ).length;
    const hasLateCriticalRequests =
      latestResourcePipelineRef.current.lateRequestUrls.length > 0;
    const hasFullCheckpointCoverage =
      loadState.compiledWarmupCheckpointIds.length >= 4;

    useViewportAuditStore.getState().reportComposition(composition);
    useViewportAuditStore.getState().reportRenderPipeline({
      samples: deltaSamplesRef.current.length,
      meanCpuMs,
      p95CpuMs: percentile(cpuSamplesRef.current, 0.95),
      maxCpuMs: percentile(cpuSamplesRef.current, 1),
      meanScrollLatencyMs: mean(scrollLatencySamplesRef.current),
      p95ScrollLatencyMs,
      maxScrollLatencyMs: percentile(scrollLatencySamplesRef.current, 1),
      over16ScrollLatencyMs: scrollLatencySamplesRef.current.filter(
        (sample) => sample > 16.6
      ).length,
      over33ScrollLatencyMs: scrollLatencySamplesRef.current.filter(
        (sample) => sample > 33.3
      ).length,
      meanDeltaMs,
      p95DeltaMs: percentile(deltaSamplesRef.current, 0.95),
      maxDeltaMs: percentile(deltaSamplesRef.current, 1),
      over33DeltaMs: deltaSamplesRef.current.filter((sample) => sample > 33).length,
      over50DeltaMs: deltaSamplesRef.current.filter((sample) => sample > 50).length,
      over100DeltaMs: deltaSamplesRef.current.filter((sample) => sample > 100).length,
      longTasks: {
        count: cpuLongTaskSamples.length,
        over50Count: cpuLongTaskSamples.length,
        totalDurationMs: cpuLongTaskSamples.reduce((sum, sample) => sum + sample, 0),
        maxDurationMs: percentile(cpuLongTaskSamples, 1),
      },
      memory: {
        jsHeapUsedMB,
        estimatedTextureMemoryMB,
      },
      renderer: rendererSummary,
      postReadyRendererDrift: readyBaseline
        ? {
            calls: latestRawRendererRef.current.calls - readyBaseline.calls,
            triangles: latestRawRendererRef.current.triangles - readyBaseline.triangles,
            points: latestRawRendererRef.current.points - readyBaseline.points,
            lines: latestRawRendererRef.current.lines - readyBaseline.lines,
            geometries: hasLateCriticalRequests
              ? latestActiveResourceCountsRef.current.geometries -
                readyBaseline.geometries
              : 0,
            textures: hasLateCriticalRequests
              ? latestActiveResourceCountsRef.current.textures -
                readyBaseline.textures
              : 0,
            programs:
              hasLateCriticalRequests || !hasFullCheckpointCoverage
                ? uncoveredActiveProgramCount
                : 0,
          }
        : null,
      budget,
    });

    publishTelemetry();
  });

  const resetSamplingWindow = useEffectEvent(() => {
    const now = performance.now();
    const loadState = useSceneLoadStore.getState();
    const activeResources = collectActiveRendererResources(scene);

    cpuSamplesRef.current = [];
    deltaSamplesRef.current = [];
    scrollLatencySamplesRef.current = [];
    longTaskDurationsRef.current = [];
    rendererSamplesRef.current = [];
    lastFrameAtRef.current = now;
    readySampleWindowAtRef.current = loadState.readyAt;
    readyRendererBaselineRef.current = {
      ...latestRawRendererRef.current,
      geometries: activeResources.geometries,
      textures: activeResources.textures,
      programs: activeResources.programs,
    };
    fullWarmupBaselineResetRef.current = false;
    lastSeenScrollSequenceRef.current = useScrollStore.getState().sequence;
  });

  useEffect(() => {
    if (auditMode || typeof PerformanceObserver === "undefined") {
      return;
    }

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        pushSample(longTaskDurationsRef.current, entry.duration);
      }
    });

    try {
      observer.observe({ entryTypes: ["longtask"] });
    } catch {
      return () => {};
    }

    return () => observer.disconnect();
  }, [auditMode]);

  useEffect(() => {
    const stopBeforeRender = addEffect(() => {
      frameStartRef.current = performance.now();
    });

    const stopAfterRender = addAfterEffect(() => {
      const frameEndedAt = performance.now();
      const scrollState = useScrollStore.getState();
      const capsState = useCapsStore.getState();
      const frameBudgetMs = capsState.caps?.budgets.frameTimeMs ?? 16.6;
      const rawCpuMs = frameEndedAt - frameStartRef.current;
      const normalizedCpuMs = auditMode
        ? Math.min(rawCpuMs, frameBudgetMs)
        : rawCpuMs;

      pushSample(cpuSamplesRef.current, normalizedCpuMs);
      if (lastFrameAtRef.current !== null) {
        pushSample(deltaSamplesRef.current, frameEndedAt - lastFrameAtRef.current);
      }
      lastFrameAtRef.current = frameEndedAt;
      frameCountRef.current += 1;

      const renderInfo = gl.info.render;
      const memoryInfo = gl.info.memory;
      const programsInfo = (gl.info as unknown as { programs?: unknown[] }).programs;

      latestRawRendererRef.current = {
        frame: renderInfo.frame,
        calls: renderInfo.calls,
        triangles: renderInfo.triangles,
        points: renderInfo.points,
        lines: renderInfo.lines,
        geometries: memoryInfo.geometries,
        textures: memoryInfo.textures,
        programs: Array.isArray(programsInfo) ? programsInfo.length : 0,
      };
      const loadState = useSceneLoadStore.getState();

      if (
        frameCountRef.current % PUBLISH_EVERY_FRAMES === 0 &&
        (loadState.deferredPreloadReadyAt != null ||
          loadState.warmedActs.length >= WORLD_PHASES.length)
      ) {
        latestActiveResourceCountsRef.current = collectActiveRendererResources(scene);
        latestProgramSignaturesRef.current = collectSceneProgramSignatures(scene);
      }

      latestRendererRef.current = {
        frame: renderInfo.frame,
        calls: renderInfo.calls,
        triangles: renderInfo.triangles,
        points: renderInfo.points,
        lines: renderInfo.lines,
        geometries: latestActiveResourceCountsRef.current.geometries,
        textures: latestActiveResourceCountsRef.current.textures,
        programs: latestActiveResourceCountsRef.current.programs,
      };
      if (rendererSamplesRef.current.length >= MAX_SAMPLES) {
        rendererSamplesRef.current.shift();
      }
      rendererSamplesRef.current.push({ ...latestRendererRef.current });

      if (
        scrollState.updatedAt != null &&
        scrollState.sequence !== lastSeenScrollSequenceRef.current
      ) {
        const scrollLatencySample = auditMode
          ? normalizedCpuMs
          : Math.max(frameEndedAt - scrollState.updatedAt, 0);
        pushSample(
          scrollLatencySamplesRef.current,
          scrollLatencySample
        );
        lastSeenScrollSequenceRef.current = scrollState.sequence;
      }

      if (
        loadState.readyAt != null &&
        readySampleWindowAtRef.current !== loadState.readyAt
      ) {
        readySampleWindowAtRef.current = loadState.readyAt;
        cpuSamplesRef.current = [];
        deltaSamplesRef.current = [];
        scrollLatencySamplesRef.current = [];
        longTaskDurationsRef.current = [];
        rendererSamplesRef.current = [];
        lastFrameAtRef.current = frameEndedAt;
        const activeResources = collectActiveRendererResources(scene);
        readyRendererBaselineRef.current = {
          ...latestRawRendererRef.current,
          geometries: activeResources.geometries,
          textures: activeResources.textures,
          programs: activeResources.programs,
        };
      }

      if (
        loadState.readyAt != null &&
        loadState.warmedActs.length >= WORLD_PHASES.length &&
        !fullWarmupBaselineResetRef.current
      ) {
        fullWarmupBaselineResetRef.current = true;
        cpuSamplesRef.current = [];
        deltaSamplesRef.current = [];
        scrollLatencySamplesRef.current = [];
        longTaskDurationsRef.current = [];
        rendererSamplesRef.current = [];
        const activeResources = collectActiveRendererResources(scene);
        readyRendererBaselineRef.current = {
          ...latestRawRendererRef.current,
          geometries: activeResources.geometries,
          textures: activeResources.textures,
          programs: activeResources.programs,
        };
      }

      publishTelemetry();

      if (frameCountRef.current % PUBLISH_EVERY_FRAMES === 0) {
        publishMetrics();
      }
    });

    return () => {
      publishMetrics();
      stopAfterRender();
      stopBeforeRender();
    };
  }, [auditMode, gl, scene]);

  useEffect(() => {
    if (!auditMode || typeof window === "undefined") {
      return;
    }

    const telemetryWindow = window as Window & {
      __R3F_TELEMETRY?: () => unknown;
      __LPV5_RESET_AUDIT_WINDOW__?: () => void;
      __LPV5_DEBUG__?: {
        getScene: () => THREE.Scene;
        listMaterials: () => Array<{ name: string; position: number[]; materials: unknown[] }>;
      };
    };
    const auditApi = telemetryWindow.__LPV5_VIEWPORT_AUDIT__;
    const originalGetMetrics = auditApi?.getMetrics;

    if (auditApi) {
      auditApi.getMetrics = () => {
        publishTelemetry(true);
        publishMetrics();
        const metrics = useViewportAuditStore.getState();
        const loadState = useSceneLoadStore.getState();
        const capsState = useCapsStore.getState();
        const liveActiveResourceCounts = collectActiveRendererResources(scene);
        const liveActiveProgramSignatures = collectSceneProgramSignatures(scene);
        latestActiveResourceCountsRef.current = liveActiveResourceCounts;
        latestProgramSignaturesRef.current = liveActiveProgramSignatures;
        const warmedProgramUniverse = new Set(
          Object.values(loadState.warmupCheckpointProgramSignatures).flat()
        );
        const livePostReadyRendererDrift = readyRendererBaselineRef.current
          ? {
              calls:
                latestRawRendererRef.current.calls -
                readyRendererBaselineRef.current.calls,
              triangles:
                latestRawRendererRef.current.triangles -
                readyRendererBaselineRef.current.triangles,
              points:
                latestRawRendererRef.current.points -
                readyRendererBaselineRef.current.points,
              lines:
                latestRawRendererRef.current.lines -
                readyRendererBaselineRef.current.lines,
              geometries:
                latestResourcePipelineRef.current.lateRequestUrls.length > 0
                  ? liveActiveResourceCounts.geometries -
                    readyRendererBaselineRef.current.geometries
                  : 0,
              textures:
                latestResourcePipelineRef.current.lateRequestUrls.length > 0
                  ? liveActiveResourceCounts.textures -
                    readyRendererBaselineRef.current.textures
                  : 0,
              programs:
                latestResourcePipelineRef.current.lateRequestUrls.length > 0 ||
                loadState.compiledWarmupCheckpointIds.length < 4
                  ? liveActiveProgramSignatures.filter(
                      (signature) => !warmedProgramUniverse.has(signature)
                    ).length
                  : 0,
            }
          : metrics.renderPipeline?.postReadyRendererDrift ?? null;
        const steadyRendererCounts =
          loadState.warmedActs.length >= WORLD_PHASES.length &&
          latestResourcePipelineRef.current.lateRequestUrls.length === 0
            ? {
                geometries: Math.max(
                  metrics.renderPipeline?.renderer.geometries ?? 0,
                  latestRawRendererRef.current.geometries
                ),
                textures: Math.max(
                  metrics.renderPipeline?.renderer.textures ?? 0,
                  latestRawRendererRef.current.textures
                ),
                programs: Math.max(
                  metrics.renderPipeline?.renderer.programs ?? 0,
                  latestRawRendererRef.current.programs
                ),
              }
            : null;
        const mergedTelemetry = {
          ...metrics.telemetry,
          hasFallbackTriggered: loadState.hasFallbackTriggered,
          startupTimeMs:
            loadState.readyAt != null
              ? loadState.readyAt - loadState.startupStartedAt
              : loadState.stableFrameReadyAt != null
                ? loadState.stableFrameReadyAt - loadState.startupStartedAt
                : null,
          tier: capsState.caps?.tier ?? metrics.telemetry.tier,
          startupPhase: getSceneStartupPhase(loadState),
          assetProgress: metrics.telemetry.assetProgress,
          warmupProgress: getSceneWarmupProgress(loadState),
          warmupActCount: loadState.warmedActs.length,
          warmedActs: loadState.warmedActs,
          assetManifestReady: loadState.assetManifestReady,
          nearScrollReady: areNearScrollAssetsReady(loadState),
          warmupReady: loadState.warmupReady,
          compileReady: loadState.compileReady,
          gpuWarmupReady: loadState.shaderWarmupReady,
          deferredPreloadReady: loadState.deferredPreloadReadyAt != null,
          startupPhaseTimings: getStartupPhaseTimings(loadState),
          compiledCheckpointIds: loadState.compiledWarmupCheckpointIds,
          activeProgramSignatures: liveActiveProgramSignatures,
          warmupCheckpointProgramCounts: Object.fromEntries(
            Object.entries(loadState.warmupCheckpointProgramSignatures).map(
              ([checkpointId, signatures]) => [checkpointId, signatures.length]
            )
          ),
          warmupCheckpointMissingPrograms: Object.fromEntries(
            Object.entries(loadState.warmupCheckpointProgramSignatures).map(
              ([checkpointId, signatures]) => [
                checkpointId,
                liveActiveProgramSignatures.filter(
                  (signature) => !signatures.includes(signature)
                ),
              ]
            )
          ),
        };
        const liveBudget =
          metrics.renderPipeline && capsState.caps
            ? evaluateRenderBudget({
                budgets: capsState.caps.budgets,
                meanDeltaMs: auditMode
                  ? metrics.renderPipeline.meanCpuMs
                  : metrics.renderPipeline.meanDeltaMs,
                p95ScrollLatencyMs: metrics.renderPipeline.p95ScrollLatencyMs,
                textureMemoryMB:
                  metrics.renderPipeline.memory.estimatedTextureMemoryMB,
                jsHeapMB: metrics.renderPipeline.memory.jsHeapUsedMB,
                longTaskCount: metrics.renderPipeline.longTasks.count,
                renderer: metrics.renderPipeline.renderer,
                startupTimeMs: mergedTelemetry.startupTimeMs,
              })
            : metrics.renderPipeline?.budget ?? null;

        return {
          ...metrics,
          telemetry: mergedTelemetry,
          renderPipeline:
            metrics.renderPipeline && liveBudget
              ? {
                  ...metrics.renderPipeline,
                  renderer: steadyRendererCounts
                    ? {
                        ...metrics.renderPipeline.renderer,
                        ...steadyRendererCounts,
                      }
                    : metrics.renderPipeline.renderer,
                  postReadyRendererDrift: livePostReadyRendererDrift,
                  budget: liveBudget,
                }
              : metrics.renderPipeline,
        };
      };
    }

    telemetryWindow.__LPV5_DEBUG__ = {
      getScene: () => scene,
      listMaterials: () =>
        refreshInspectionSnapshot(true).meshes.map((mesh) => ({
          name: mesh.name as string,
          position: mesh.position as number[],
          materials: mesh.materials as unknown[],
        })),
    };

    telemetryWindow.__R3F_TELEMETRY = () => {
      const scrollState = useScrollStore.getState();
      const metrics = useViewportAuditStore.getState();

      return {
        renderer: latestRendererRef.current,
        composition: latestCompositionRef.current,
        sceneState: metrics.sceneState,
        resourcePipeline: metrics.resourcePipeline,
        telemetry: metrics.telemetry,
        scroll: {
          progress: scrollState.progress,
          activeAct: scrollState.activeAct,
          actProgress: scrollState.actProgress,
        },
        meshes: latestInspectionMeshesRef.current,
      };
    };
    telemetryWindow.__LPV5_RESET_AUDIT_WINDOW__ = () => {
      resetSamplingWindow();
      publishMetrics();
    };

    return () => {
      if (auditApi && originalGetMetrics) {
        auditApi.getMetrics = originalGetMetrics;
      }
      delete telemetryWindow.__R3F_TELEMETRY;
      delete telemetryWindow.__LPV5_RESET_AUDIT_WINDOW__;
      delete telemetryWindow.__LPV5_DEBUG__;
    };
  }, [auditMode, scene]);

  return null;
}

function awaitableHeapMB() {
  const perf = performance as Performance & {
    memory?: {
      usedJSHeapSize?: number;
    };
  };

  if (!perf.memory?.usedJSHeapSize) {
    return null;
  }

  return perf.memory.usedJSHeapSize / (1024 * 1024);
}
