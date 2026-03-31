import {
  STARTUP_ASSET_MANIFEST,
  STARTUP_TEXTURE_PRELOADS,
  type StartupAssetId,
  type StartupAssetStage,
  type StartupTexturePreloadDescriptor,
} from "./assetManifest";
import { resolveActMaterialTierConfig } from "./acts/materialTierConfig";
import { getWarmupCheckpointDescriptor } from "./warmupCheckpoints";
import type { QualityTier } from "@/stores/capsStore";

const WARMUP_BASE_ASSETS_BY_ACT: Record<number, readonly StartupAssetId[]> = {
  0: [
    "hero-dark-star-scene",
    "hero-dark-star-bin",
    "hero-dark-star-disc",
    "hero-dark-star-horizon",
    "texture-noise-volumetric",
  ],
  1: [
    "hero-wireframe-globe",
    "support-satellites-scene",
    "support-satellites-bin",
    "support-satellites-clearcoat",
    "support-satellites-emissive",
  ],
  2: ["hero-hologram"],
  3: [],
  4: [
    "hero-black-hole-scene",
    "hero-black-hole-bin",
    "hero-black-hole-base",
    "hero-black-hole-inner",
    "hero-black-hole-emissive",
  ],
  5: [],
};

function isTexturePreloadRequired(
  texture: StartupTexturePreloadDescriptor,
  tier: QualityTier
) {
  if (texture.actIndex == null) {
    return true;
  }

  const tierConfig = resolveActMaterialTierConfig(texture.actIndex, tier);

  if (texture.id.endsWith("-color")) {
    return tierConfig.texture.useColorMap;
  }
  if (texture.id.endsWith("-normal")) {
    return tierConfig.texture.useNormalMap;
  }
  if (texture.id.endsWith("-roughness")) {
    return tierConfig.texture.useRoughnessMap;
  }
  if (texture.id.endsWith("-metalness")) {
    return tierConfig.texture.useMetalnessMap;
  }

  return true;
}

function dedupeAssetIds(assetIds: readonly StartupAssetId[]) {
  return Array.from(new Set(assetIds));
}

export function getEffectiveStartupTexturePreloadsForStage(
  stage: StartupAssetStage,
  tier: QualityTier
) {
  return STARTUP_TEXTURE_PRELOADS.filter(
    (texture) => texture.stage === stage && isTexturePreloadRequired(texture, tier)
  );
}

export function getEffectiveStartupAssetIdsForStage(
  stage: StartupAssetStage,
  tier: QualityTier
) {
  const enabledTextureIds = new Set(
    getEffectiveStartupTexturePreloadsForStage(stage, tier).map((texture) => texture.id)
  );

  return STARTUP_ASSET_MANIFEST.filter((asset) => asset.stage === stage).filter(
    (asset) => asset.kind !== "texture" || enabledTextureIds.has(asset.id)
  ).map((asset) => asset.id);
}

export function getEffectiveStartupAssetPathsForStage(
  stage: StartupAssetStage,
  tier: QualityTier
) {
  const effectiveIds = new Set(getEffectiveStartupAssetIdsForStage(stage, tier));
  return STARTUP_ASSET_MANIFEST.filter((asset) => effectiveIds.has(asset.id)).map(
    (asset) => asset.url
  );
}

export function getWarmupAssetIdsForAct(actIndex: number, tier: QualityTier) {
  const baseAssets = WARMUP_BASE_ASSETS_BY_ACT[actIndex] ?? [];
  const textureAssets = STARTUP_TEXTURE_PRELOADS.filter(
    (texture) =>
      texture.actIndex === actIndex && isTexturePreloadRequired(texture, tier)
  ).map((texture) => texture.id);

  return dedupeAssetIds([...baseAssets, ...textureAssets]);
}

export function getWarmupAssetIdsForCheckpoint(
  checkpointId: string,
  tier: QualityTier
) {
  const checkpoint = getWarmupCheckpointDescriptor(checkpointId);

  if (!checkpoint) {
    return [];
  }

  return dedupeAssetIds(
    checkpoint.coverageActIndices.flatMap((actIndex) =>
      getWarmupAssetIdsForAct(actIndex, tier)
    )
  );
}
