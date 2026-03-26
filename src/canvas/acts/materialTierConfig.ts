import { useMemo } from "react";
import * as THREE from "three";
import { useCapsStore, type QualityTier } from "@/stores/capsStore";
import type { SharedTextureOptions } from "@/lib/textures";

export type TextureResolutionBudget = "full" | "half" | "quarter";
export type ShaderComplexity = "full" | "reduced" | "basic";
export type MeshDetail = "high" | "medium" | "low";

export interface TextureTierConfig {
  resolution: TextureResolutionBudget;
  useColorMap: boolean;
  useNormalMap: boolean;
  useRoughnessMap: boolean;
  useMetalnessMap: boolean;
}

export interface MeshTierConfig {
  detail: MeshDetail;
  primaryDetail: number;
  secondaryDetail: number;
  tertiaryDetail: number;
  quaternaryDetail: number;
  circleSegments: number;
  planeSegments: number;
  ribbonCount: number;
  bodyCount: number;
  orbitalCount: number;
  trailCount: number;
  beamPoints: number;
  latticeCount: number;
  dendriteCount: number;
  tubulinCount: number;
}

export interface ShaderTierConfig {
  complexity: ShaderComplexity;
  pulseWidth: number;
  secondaryPulseMix: number;
  hologramScanlines: number;
  hologramGlitch: number;
  crystalFresnel: number;
  crystalIridescence: number;
  enableWarpBackground: boolean;
  enableShaderLines: boolean;
}

export interface MaterialTierConfig {
  emissiveScale: number;
  transmissionScale: number;
  clearcoatScale: number;
  envMapScale: number;
  opacityScale: number;
  roughnessBias: number;
  metalnessScale: number;
}

export interface ActMaterialTierConfig {
  texture: TextureTierConfig;
  mesh: MeshTierConfig;
  shader: ShaderTierConfig;
  material: MaterialTierConfig;
}

function textureConfig(
  resolution: TextureResolutionBudget,
  overrides: Partial<Omit<TextureTierConfig, "resolution">> = {}
): TextureTierConfig {
  const base: Record<TextureResolutionBudget, Omit<TextureTierConfig, "resolution">> = {
    full: {
      useColorMap: true,
      useNormalMap: true,
      useRoughnessMap: true,
      useMetalnessMap: true,
    },
    half: {
      useColorMap: true,
      useNormalMap: true,
      useRoughnessMap: true,
      useMetalnessMap: false,
    },
    quarter: {
      useColorMap: true,
      useNormalMap: false,
      useRoughnessMap: false,
      useMetalnessMap: false,
    },
  };

  return {
    resolution,
    ...base[resolution],
    ...overrides,
  };
}

function meshConfig(
  detail: MeshDetail,
  overrides: Partial<Omit<MeshTierConfig, "detail">> = {}
): MeshTierConfig {
  const base: Record<MeshDetail, Omit<MeshTierConfig, "detail">> = {
    high: {
      primaryDetail: 5,
      secondaryDetail: 4,
      tertiaryDetail: 3,
      quaternaryDetail: 2,
      circleSegments: 96,
      planeSegments: 96,
      ribbonCount: 4,
      bodyCount: 18,
      orbitalCount: 64,
      trailCount: 96,
      beamPoints: 50,
      latticeCount: 1200,
      dendriteCount: 50,
      tubulinCount: 80,
    },
    medium: {
      primaryDetail: 4,
      secondaryDetail: 3,
      tertiaryDetail: 2,
      quaternaryDetail: 1,
      circleSegments: 72,
      planeSegments: 64,
      ribbonCount: 3,
      bodyCount: 12,
      orbitalCount: 40,
      trailCount: 56,
      beamPoints: 36,
      latticeCount: 600,
      dendriteCount: 25,
      tubulinCount: 40,
    },
    low: {
      primaryDetail: 2,
      secondaryDetail: 1,
      tertiaryDetail: 1,
      quaternaryDetail: 0,
      circleSegments: 40,
      planeSegments: 32,
      ribbonCount: 2,
      bodyCount: 8,
      orbitalCount: 20,
      trailCount: 24,
      beamPoints: 24,
      latticeCount: 200,
      dendriteCount: 10,
      tubulinCount: 0,
    },
  };

  return {
    detail,
    ...base[detail],
    ...overrides,
  };
}

function shaderConfig(
  complexity: ShaderComplexity,
  overrides: Partial<Omit<ShaderTierConfig, "complexity">> = {}
): ShaderTierConfig {
  const base: Record<ShaderComplexity, Omit<ShaderTierConfig, "complexity">> = {
    full: {
      pulseWidth: 0.15,
      secondaryPulseMix: 1,
      hologramScanlines: 80,
      hologramGlitch: 0.02,
      crystalFresnel: 2,
      crystalIridescence: 0.8,
      enableWarpBackground: true,
      enableShaderLines: true,
    },
    reduced: {
      pulseWidth: 0.18,
      secondaryPulseMix: 0.55,
      hologramScanlines: 52,
      hologramGlitch: 0.012,
      crystalFresnel: 1.8,
      crystalIridescence: 0.55,
      enableWarpBackground: true,
      enableShaderLines: true,
    },
    basic: {
      pulseWidth: 0.22,
      secondaryPulseMix: 0,
      hologramScanlines: 28,
      hologramGlitch: 0.004,
      crystalFresnel: 1.4,
      crystalIridescence: 0.2,
      enableWarpBackground: true,
      enableShaderLines: false,
    },
  };

  return {
    complexity,
    ...base[complexity],
    ...overrides,
  };
}

function materialConfig(
  quality: QualityTier,
  overrides: Partial<MaterialTierConfig> = {}
): MaterialTierConfig {
  const base: Record<QualityTier, MaterialTierConfig> = {
    high: {
      emissiveScale: 1,
      transmissionScale: 1,
      clearcoatScale: 1,
      envMapScale: 1,
      opacityScale: 1,
      roughnessBias: 0,
      metalnessScale: 1,
    },
    medium: {
      emissiveScale: 0.88,
      transmissionScale: 0.8,
      clearcoatScale: 0.82,
      envMapScale: 0.82,
      opacityScale: 0.92,
      roughnessBias: 0.05,
      metalnessScale: 0.94,
    },
    low: {
      emissiveScale: 0.72,
      transmissionScale: 0.45,
      clearcoatScale: 0.4,
      envMapScale: 0.55,
      opacityScale: 0.8,
      roughnessBias: 0.12,
      metalnessScale: 0.85,
    },
  };

  return {
    ...base[quality],
    ...overrides,
  };
}

export const ACT_MATERIAL_TIER_CONFIG: Record<number, Record<QualityTier, ActMaterialTierConfig>> = {
  0: {
    high: {
      texture: textureConfig("full", { useColorMap: false, useNormalMap: false, useRoughnessMap: false }),
      mesh: meshConfig("high", { primaryDetail: 4, secondaryDetail: 3, tertiaryDetail: 24, circleSegments: 96 }),
      shader: shaderConfig("reduced", { enableWarpBackground: false, enableShaderLines: false }),
      material: materialConfig("high"),
    },
    medium: {
      texture: textureConfig("half", { useColorMap: false, useNormalMap: false, useRoughnessMap: false }),
      mesh: meshConfig("medium", { primaryDetail: 3, secondaryDetail: 2, tertiaryDetail: 18, circleSegments: 72 }),
      shader: shaderConfig("basic", { enableWarpBackground: false, enableShaderLines: false }),
      material: materialConfig("medium"),
    },
    low: {
      texture: textureConfig("quarter", { useColorMap: false, useNormalMap: false, useRoughnessMap: false }),
      mesh: meshConfig("low", { primaryDetail: 2, secondaryDetail: 1, tertiaryDetail: 12, circleSegments: 40 }),
      shader: shaderConfig("basic", { enableWarpBackground: false, enableShaderLines: false }),
      material: materialConfig("low"),
    },
  },
  1: {
    high: {
      texture: textureConfig("full", { useMetalnessMap: false }),
      mesh: meshConfig("high", { primaryDetail: 4, bodyCount: 18, circleSegments: 96 }),
      shader: shaderConfig("full", { crystalFresnel: 0, crystalIridescence: 0 }),
      material: materialConfig("high", { envMapScale: 0.9 }),
    },
    medium: {
      texture: textureConfig("half", { useMetalnessMap: false }),
      mesh: meshConfig("medium", { primaryDetail: 3, bodyCount: 12, circleSegments: 72 }),
      shader: shaderConfig("reduced", { crystalFresnel: 0, crystalIridescence: 0 }),
      material: materialConfig("medium", { envMapScale: 0.75 }),
    },
    low: {
      texture: textureConfig("quarter", { useMetalnessMap: false, useRoughnessMap: false }),
      mesh: meshConfig("low", { primaryDetail: 2, bodyCount: 8, circleSegments: 40 }),
      shader: shaderConfig("basic", { crystalFresnel: 0, crystalIridescence: 0 }),
      material: materialConfig("low", { envMapScale: 0.4 }),
    },
  },
  2: {
    high: {
      texture: textureConfig("full"),
      mesh: meshConfig("high", { planeSegments: 96, ribbonCount: 4, circleSegments: 64 }),
      shader: shaderConfig("full"),
      material: materialConfig("high", { opacityScale: 1 }),
    },
    medium: {
      texture: textureConfig("half"),
      mesh: meshConfig("medium", { planeSegments: 64, ribbonCount: 3, circleSegments: 56 }),
      shader: shaderConfig("reduced"),
      material: materialConfig("medium", { opacityScale: 0.9 }),
    },
    low: {
      texture: textureConfig("quarter", { useMetalnessMap: false, useRoughnessMap: false }),
      mesh: meshConfig("low", { planeSegments: 32, ribbonCount: 2, circleSegments: 40 }),
      shader: shaderConfig("basic"),
      material: materialConfig("low", { opacityScale: 0.76 }),
    },
  },
  3: {
    high: {
      texture: textureConfig("full", { useMetalnessMap: false }),
      mesh: meshConfig("high", { orbitalCount: 64, beamPoints: 50, circleSegments: 64, primaryDetail: 2, secondaryDetail: 2 }),
      shader: shaderConfig("full", { crystalFresnel: 2, crystalIridescence: 0.8 }),
      material: materialConfig("high", { opacityScale: 1 }),
    },
    medium: {
      texture: textureConfig("half", { useMetalnessMap: false }),
      mesh: meshConfig("medium", { orbitalCount: 40, beamPoints: 36, circleSegments: 48, primaryDetail: 1, secondaryDetail: 1 }),
      shader: shaderConfig("reduced", { crystalFresnel: 1.8, crystalIridescence: 0.55 }),
      material: materialConfig("medium", { opacityScale: 0.88 }),
    },
    low: {
      texture: textureConfig("quarter", { useMetalnessMap: false, useRoughnessMap: false }),
      mesh: meshConfig("low", { orbitalCount: 20, beamPoints: 24, circleSegments: 32, primaryDetail: 0, secondaryDetail: 0 }),
      shader: shaderConfig("basic", { crystalFresnel: 1.4, crystalIridescence: 0.2 }),
      material: materialConfig("low", { opacityScale: 0.72 }),
    },
  },
  4: {
    high: {
      texture: textureConfig("full", { useColorMap: false, useNormalMap: false, useRoughnessMap: false, useMetalnessMap: false }),
      mesh: meshConfig("high", { primaryDetail: 5, secondaryDetail: 48, tertiaryDetail: 4, trailCount: 96, circleSegments: 96 }),
      shader: shaderConfig("full", { enableWarpBackground: true, enableShaderLines: true }),
      material: materialConfig("high", { emissiveScale: 1.05 }),
    },
    medium: {
      texture: textureConfig("half", { useColorMap: false, useNormalMap: false, useRoughnessMap: false, useMetalnessMap: false }),
      mesh: meshConfig("medium", { primaryDetail: 3, secondaryDetail: 32, tertiaryDetail: 3, trailCount: 56, circleSegments: 72 }),
      shader: shaderConfig("reduced", { enableWarpBackground: true, enableShaderLines: true }),
      material: materialConfig("medium", { emissiveScale: 0.92 }),
    },
    low: {
      texture: textureConfig("quarter", { useColorMap: false, useNormalMap: false, useRoughnessMap: false, useMetalnessMap: false }),
      mesh: meshConfig("low", { primaryDetail: 2, secondaryDetail: 20, tertiaryDetail: 2, trailCount: 24, circleSegments: 40 }),
      shader: shaderConfig("basic", { enableWarpBackground: true, enableShaderLines: false }),
      material: materialConfig("low", { emissiveScale: 0.78 }),
    },
  },
  5: {
    high: {
      texture: textureConfig("full", { useColorMap: false, useNormalMap: false, useRoughnessMap: false, useMetalnessMap: false }),
      mesh: meshConfig("high", { latticeCount: 1200, dendriteCount: 50, tubulinCount: 80, primaryDetail: 8, secondaryDetail: 6 }),
      shader: shaderConfig("full", { enableWarpBackground: false, enableShaderLines: false }),
      material: materialConfig("high", { emissiveScale: 1.08, transmissionScale: 1.1 }),
    },
    medium: {
      texture: textureConfig("half", { useColorMap: false, useNormalMap: false, useRoughnessMap: false, useMetalnessMap: false }),
      mesh: meshConfig("medium", { latticeCount: 600, dendriteCount: 25, tubulinCount: 40, primaryDetail: 6, secondaryDetail: 5 }),
      shader: shaderConfig("reduced", { enableWarpBackground: false, enableShaderLines: false }),
      material: materialConfig("medium", { emissiveScale: 0.94, transmissionScale: 0.92 }),
    },
    low: {
      texture: textureConfig("quarter", { useColorMap: false, useNormalMap: false, useRoughnessMap: false, useMetalnessMap: false }),
      mesh: meshConfig("low", { latticeCount: 200, dendriteCount: 10, tubulinCount: 0, primaryDetail: 4, secondaryDetail: 4 }),
      shader: shaderConfig("basic", { enableWarpBackground: false, enableShaderLines: false }),
      material: materialConfig("low", { emissiveScale: 0.78, transmissionScale: 0.55 }),
    },
  },
};

export function resolveActMaterialTierConfig(
  actIndex: number,
  tier: QualityTier
): ActMaterialTierConfig {
  const actConfig = ACT_MATERIAL_TIER_CONFIG[actIndex] ?? ACT_MATERIAL_TIER_CONFIG[0];
  return actConfig[tier] ?? actConfig.low;
}

export function useActMaterialTierConfig(actIndex: number): ActMaterialTierConfig {
  const tier = useCapsStore((state) => state.caps?.tier ?? "low");
  return useMemo(() => resolveActMaterialTierConfig(actIndex, tier), [actIndex, tier]);
}

export function getTextureSamplingOptions(
  config: TextureTierConfig,
  baseOptions: Pick<SharedTextureOptions, "repeat" | "colorSpace"> = {}
): SharedTextureOptions {
  switch (config.resolution) {
    case "full":
      return {
        ...baseOptions,
        anisotropy: 8,
        generateMipmaps: true,
        minFilter: THREE.LinearMipmapLinearFilter,
        magFilter: THREE.LinearFilter,
      };
    case "half":
      return {
        ...baseOptions,
        anisotropy: 4,
        generateMipmaps: true,
        minFilter: THREE.LinearMipmapLinearFilter,
        magFilter: THREE.LinearFilter,
      };
    case "quarter":
    default:
      return {
        ...baseOptions,
        anisotropy: 1,
        generateMipmaps: false,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
      };
  }
}
