export const HERO_ASSET_PATHS = {
  dark_star: "/models/dark_star/scene.gltf",
  wireframe_globe: "/models/wireframe_3d_globe.glb",
  hologram: "/models/hologram.glb",
  quantum_leap: "/models/quantum_leap/scene.gltf",
  paradox_abstract: "/models/paradox_abstract_art_of_python.glb",
  black_hole: "/models/black_hole/scene.gltf",
} as const;

export const SUPPORT_MODEL_PATHS = {
  satellites: "/models/satellites/scene.gltf",
} as const;

export const ENTRY_WARMUP_ACT_SEQUENCE = [0] as const;
export const DEFERRED_WARMUP_ACT_SEQUENCE = [1, 2, 3, 4, 5] as const;
export const STARTUP_WARMUP_ACT_SEQUENCE = [
  ...ENTRY_WARMUP_ACT_SEQUENCE,
  ...DEFERRED_WARMUP_ACT_SEQUENCE,
] as const;

export type StartupAssetStage = "entryCritical" | "nearScrollCritical" | "deferred";
export type StartupCompressionStatus =
  | "raw-gltf"
  | "raw-glb"
  | "uncompressed-png"
  | "compressed-source"
  | "shared-runtime-cache";
export type TextureVariantResolution = "full" | "half" | "quarter";

export const STARTUP_ASSET_IDS = [
  "hero-dark-star-scene",
  "hero-dark-star-bin",
  "hero-dark-star-disc",
  "hero-dark-star-horizon",
  "hero-wireframe-globe",
  "hero-hologram",
  "hero-black-hole-scene",
  "hero-black-hole-bin",
  "hero-black-hole-base",
  "hero-black-hole-inner",
  "hero-black-hole-emissive",
  "support-satellites-scene",
  "support-satellites-bin",
  "support-satellites-clearcoat",
  "support-satellites-emissive",
  "environment-kloppenheim",
  "texture-noise-volumetric",
  "texture-ground103-color",
  "texture-ground103-normal",
  "texture-ground103-roughness",
  "texture-rock063-color",
  "texture-rock063-normal",
  "texture-rock063-roughness",
  "texture-metal049a-color",
  "texture-metal049a-normal",
  "texture-metal049a-roughness",
  "texture-metal049a-metalness",
] as const;

export type StartupAssetId = (typeof STARTUP_ASSET_IDS)[number];
export type StartupAssetKind = "model" | "texture" | "environment";

export interface StartupAssetDescriptor {
  id: StartupAssetId;
  kind: StartupAssetKind;
  url: string;
  stage: StartupAssetStage;
  byteSize: number;
  estimatedTextureBytes?: number;
  resolution?: string;
  compression: StartupCompressionStatus;
  fallbackUrl?: string | null;
}

export interface StartupPreloadGroupDescriptor {
  kind: "model" | "environment";
  url: string;
  readinessIds: readonly StartupAssetId[];
  stage: StartupAssetStage;
}

export interface StartupTexturePreloadDescriptor {
  id: StartupAssetId;
  url: string;
  repeat: number;
  stage: StartupAssetStage;
  colorSpace?: "srgb";
  actIndex?: number;
}

const TEXTURE_VARIANTS: Partial<
  Record<string, Partial<Record<TextureVariantResolution, string>>>
> = {
  "/textures/pbr/ground103/Ground103_2K-PNG_Color.png": {
    quarter: "/textures/pbr/ground103/Ground103.png",
  },
  "/textures/pbr/rock063/Rock063_2K-PNG_Color.png": {
    quarter: "/textures/pbr/rock063/Rock063.png",
  },
  "/textures/pbr/metal049a/Metal049A_2K-PNG_Color.png": {
    quarter: "/textures/pbr/metal049a/Metal049A.png",
  },
};

export const STARTUP_ASSET_MANIFEST: readonly StartupAssetDescriptor[] = [
  {
    id: "hero-dark-star-scene",
    kind: "model",
    url: HERO_ASSET_PATHS.dark_star,
    stage: "entryCritical",
    byteSize: 88_356,
    compression: "raw-gltf",
  },
  {
    id: "hero-dark-star-bin",
    kind: "model",
    url: "/models/dark_star/scene.bin",
    stage: "entryCritical",
    byteSize: 16_753_216,
    compression: "compressed-source",
  },
  {
    id: "hero-dark-star-disc",
    kind: "texture",
    url: "/models/dark_star/textures/disc_baseColor.png",
    stage: "entryCritical",
    byteSize: 219_313,
    estimatedTextureBytes: 1_048_576,
    resolution: "1024x1024",
    compression: "uncompressed-png",
  },
  {
    id: "hero-dark-star-horizon",
    kind: "texture",
    url: "/models/dark_star/textures/horizon_baseColor.png",
    stage: "entryCritical",
    byteSize: 38_063,
    estimatedTextureBytes: 262_144,
    resolution: "256x256",
    compression: "uncompressed-png",
  },
  {
    id: "hero-wireframe-globe",
    kind: "model",
    url: HERO_ASSET_PATHS.wireframe_globe,
    stage: "nearScrollCritical",
    byteSize: 605_188,
    compression: "raw-glb",
  },
  {
    id: "hero-hologram",
    kind: "model",
    url: HERO_ASSET_PATHS.hologram,
    stage: "nearScrollCritical",
    byteSize: 799_400,
    compression: "raw-glb",
  },
  {
    id: "hero-black-hole-scene",
    kind: "model",
    url: HERO_ASSET_PATHS.black_hole,
    stage: "deferred",
    byteSize: 20_310,
    compression: "raw-gltf",
  },
  {
    id: "hero-black-hole-bin",
    kind: "model",
    url: "/models/black_hole/scene.bin",
    stage: "deferred",
    byteSize: 326_848,
    compression: "compressed-source",
  },
  {
    id: "hero-black-hole-base",
    kind: "texture",
    url: "/models/black_hole/textures/Material_63_baseColor.png",
    stage: "deferred",
    byteSize: 30_599,
    estimatedTextureBytes: 262_144,
    resolution: "256x256",
    compression: "uncompressed-png",
  },
  {
    id: "hero-black-hole-inner",
    kind: "texture",
    url: "/models/black_hole/textures/Material_64_baseColor.png",
    stage: "deferred",
    byteSize: 110,
    estimatedTextureBytes: 16_384,
    resolution: "64x64",
    compression: "uncompressed-png",
  },
  {
    id: "hero-black-hole-emissive",
    kind: "texture",
    url: "/models/black_hole/textures/Material_64_emissive.png",
    stage: "deferred",
    byteSize: 374,
    estimatedTextureBytes: 16_384,
    resolution: "64x64",
    compression: "uncompressed-png",
  },
  {
    id: "support-satellites-scene",
    kind: "model",
    url: SUPPORT_MODEL_PATHS.satellites,
    stage: "nearScrollCritical",
    byteSize: 10_942,
    compression: "raw-gltf",
  },
  {
    id: "support-satellites-bin",
    kind: "model",
    url: "/models/satellites/scene.bin",
    stage: "nearScrollCritical",
    byteSize: 4_748_652,
    compression: "compressed-source",
  },
  {
    id: "support-satellites-clearcoat",
    kind: "texture",
    url: "/models/satellites/textures/earth_clearcoat.png",
    stage: "nearScrollCritical",
    byteSize: 2_053_160,
    estimatedTextureBytes: 8_388_608,
    resolution: "2048x1024",
    compression: "uncompressed-png",
  },
  {
    id: "support-satellites-emissive",
    kind: "texture",
    url: "/models/satellites/textures/earth_emissive.png",
    stage: "nearScrollCritical",
    byteSize: 909_262,
    estimatedTextureBytes: 4_194_304,
    resolution: "1024x1024",
    compression: "uncompressed-png",
  },
  {
    id: "environment-kloppenheim",
    kind: "environment",
    url: "/env/hdri/kloppenheim_07_4k.exr",
    stage: "deferred",
    byteSize: 22_056_162,
    estimatedTextureBytes: 134_217_728,
    resolution: "4k",
    compression: "compressed-source",
  },
  {
    id: "texture-noise-volumetric",
    kind: "texture",
    url: "/textures/volumetric/nebula-noise-1k-seamless.png",
    stage: "entryCritical",
    byteSize: 192_764,
    estimatedTextureBytes: 4_194_304,
    resolution: "1024x1024",
    compression: "shared-runtime-cache",
  },
  {
    id: "texture-ground103-color",
    kind: "texture",
    url: "/textures/pbr/ground103/Ground103_2K-PNG_Color.png",
    stage: "nearScrollCritical",
    byteSize: 9_048_500,
    estimatedTextureBytes: 16_777_216,
    resolution: "2048x2048",
    compression: "uncompressed-png",
    fallbackUrl: "/textures/pbr/ground103/Ground103.png",
  },
  {
    id: "texture-ground103-normal",
    kind: "texture",
    url: "/textures/pbr/ground103/Ground103_2K-PNG_NormalGL.png",
    stage: "nearScrollCritical",
    byteSize: 26_338_628,
    estimatedTextureBytes: 16_777_216,
    resolution: "2048x2048",
    compression: "uncompressed-png",
  },
  {
    id: "texture-ground103-roughness",
    kind: "texture",
    url: "/textures/pbr/ground103/Ground103_2K-PNG_Roughness.png",
    stage: "nearScrollCritical",
    byteSize: 3_251_971,
    estimatedTextureBytes: 16_777_216,
    resolution: "2048x2048",
    compression: "uncompressed-png",
  },
  {
    id: "texture-rock063-color",
    kind: "texture",
    url: "/textures/pbr/rock063/Rock063_2K-PNG_Color.png",
    stage: "nearScrollCritical",
    byteSize: 4_942_287,
    estimatedTextureBytes: 16_777_216,
    resolution: "2048x2048",
    compression: "uncompressed-png",
    fallbackUrl: "/textures/pbr/rock063/Rock063.png",
  },
  {
    id: "texture-rock063-normal",
    kind: "texture",
    url: "/textures/pbr/rock063/Rock063_2K-PNG_NormalGL.png",
    stage: "nearScrollCritical",
    byteSize: 11_979_365,
    estimatedTextureBytes: 16_777_216,
    resolution: "2048x2048",
    compression: "uncompressed-png",
  },
  {
    id: "texture-rock063-roughness",
    kind: "texture",
    url: "/textures/pbr/rock063/Rock063_2K-PNG_Roughness.png",
    stage: "nearScrollCritical",
    byteSize: 1_342_028,
    estimatedTextureBytes: 16_777_216,
    resolution: "2048x2048",
    compression: "uncompressed-png",
  },
  {
    id: "texture-metal049a-color",
    kind: "texture",
    url: "/textures/pbr/metal049a/Metal049A_2K-PNG_Color.png",
    stage: "nearScrollCritical",
    byteSize: 2_173_551,
    estimatedTextureBytes: 16_777_216,
    resolution: "2048x2048",
    compression: "uncompressed-png",
    fallbackUrl: "/textures/pbr/metal049a/Metal049A.png",
  },
  {
    id: "texture-metal049a-normal",
    kind: "texture",
    url: "/textures/pbr/metal049a/Metal049A_2K-PNG_NormalGL.png",
    stage: "nearScrollCritical",
    byteSize: 8_472_481,
    estimatedTextureBytes: 16_777_216,
    resolution: "2048x2048",
    compression: "uncompressed-png",
  },
  {
    id: "texture-metal049a-roughness",
    kind: "texture",
    url: "/textures/pbr/metal049a/Metal049A_2K-PNG_Roughness.png",
    stage: "nearScrollCritical",
    byteSize: 1_390_302,
    estimatedTextureBytes: 16_777_216,
    resolution: "2048x2048",
    compression: "uncompressed-png",
  },
  {
    id: "texture-metal049a-metalness",
    kind: "texture",
    url: "/textures/pbr/metal049a/Metal049A_2K-PNG_Metalness.png",
    stage: "nearScrollCritical",
    byteSize: 12_102,
    estimatedTextureBytes: 16_777_216,
    resolution: "2048x2048",
    compression: "uncompressed-png",
  },
] as const;

export const STARTUP_ASSET_BY_ID = Object.fromEntries(
  STARTUP_ASSET_MANIFEST.map((asset) => [asset.id, asset])
) as Record<StartupAssetId, StartupAssetDescriptor>;

function assetIdsForStage(stage: StartupAssetStage) {
  return STARTUP_ASSET_MANIFEST.filter((asset) => asset.stage === stage).map(
    (asset) => asset.id
  );
}

export const STARTUP_ENTRY_CRITICAL_ASSET_IDS = assetIdsForStage("entryCritical");
export const STARTUP_NEAR_SCROLL_ASSET_IDS = assetIdsForStage("nearScrollCritical");
export const STARTUP_DEFERRED_ASSET_IDS = assetIdsForStage("deferred");
export const STARTUP_CRITICAL_ASSET_IDS = STARTUP_ENTRY_CRITICAL_ASSET_IDS;

export const STARTUP_ASSET_PATHS = STARTUP_ASSET_MANIFEST.map((asset) => asset.url);

export const STARTUP_PRELOAD_GROUPS: readonly StartupPreloadGroupDescriptor[] = [
  {
    kind: "model",
    url: HERO_ASSET_PATHS.dark_star,
    readinessIds: [
      "hero-dark-star-scene",
      "hero-dark-star-bin",
      "hero-dark-star-disc",
      "hero-dark-star-horizon",
    ],
    stage: "entryCritical",
  },
  {
    kind: "model",
    url: HERO_ASSET_PATHS.wireframe_globe,
    readinessIds: ["hero-wireframe-globe"],
    stage: "nearScrollCritical",
  },
  {
    kind: "model",
    url: SUPPORT_MODEL_PATHS.satellites,
    readinessIds: [
      "support-satellites-scene",
      "support-satellites-bin",
      "support-satellites-clearcoat",
      "support-satellites-emissive",
    ],
    stage: "nearScrollCritical",
  },
  {
    kind: "model",
    url: HERO_ASSET_PATHS.hologram,
    readinessIds: ["hero-hologram"],
    stage: "nearScrollCritical",
  },
  {
    kind: "model",
    url: HERO_ASSET_PATHS.black_hole,
    readinessIds: [
      "hero-black-hole-scene",
      "hero-black-hole-bin",
      "hero-black-hole-base",
      "hero-black-hole-inner",
      "hero-black-hole-emissive",
    ],
    stage: "deferred",
  },
  {
    kind: "environment",
    url: "/env/hdri/kloppenheim_07_4k.exr",
    readinessIds: ["environment-kloppenheim"],
    stage: "deferred",
  },
] as const;

export const STARTUP_TEXTURE_PRELOADS: readonly StartupTexturePreloadDescriptor[] = [
  {
    id: "texture-noise-volumetric",
    url: "/textures/volumetric/nebula-noise-1k-seamless.png",
    repeat: 2.6,
    stage: "entryCritical",
  },
  {
    id: "texture-rock063-color",
    url: "/textures/pbr/rock063/Rock063_2K-PNG_Color.png",
    repeat: 8,
    colorSpace: "srgb",
    actIndex: 1,
    stage: "nearScrollCritical",
  },
  {
    id: "texture-rock063-normal",
    url: "/textures/pbr/rock063/Rock063_2K-PNG_NormalGL.png",
    repeat: 8,
    actIndex: 1,
    stage: "nearScrollCritical",
  },
  {
    id: "texture-rock063-roughness",
    url: "/textures/pbr/rock063/Rock063_2K-PNG_Roughness.png",
    repeat: 8,
    actIndex: 1,
    stage: "nearScrollCritical",
  },
  {
    id: "texture-metal049a-color",
    url: "/textures/pbr/metal049a/Metal049A_2K-PNG_Color.png",
    repeat: 8,
    colorSpace: "srgb",
    actIndex: 2,
    stage: "nearScrollCritical",
  },
  {
    id: "texture-metal049a-normal",
    url: "/textures/pbr/metal049a/Metal049A_2K-PNG_NormalGL.png",
    repeat: 8,
    actIndex: 2,
    stage: "nearScrollCritical",
  },
  {
    id: "texture-metal049a-roughness",
    url: "/textures/pbr/metal049a/Metal049A_2K-PNG_Roughness.png",
    repeat: 8,
    actIndex: 2,
    stage: "nearScrollCritical",
  },
  {
    id: "texture-metal049a-metalness",
    url: "/textures/pbr/metal049a/Metal049A_2K-PNG_Metalness.png",
    repeat: 8,
    actIndex: 2,
    stage: "nearScrollCritical",
  },
  {
    id: "texture-ground103-color",
    url: "/textures/pbr/ground103/Ground103_2K-PNG_Color.png",
    repeat: 8,
    colorSpace: "srgb",
    actIndex: 3,
    stage: "nearScrollCritical",
  },
  {
    id: "texture-ground103-normal",
    url: "/textures/pbr/ground103/Ground103_2K-PNG_NormalGL.png",
    repeat: 8,
    actIndex: 3,
    stage: "nearScrollCritical",
  },
  {
    id: "texture-ground103-roughness",
    url: "/textures/pbr/ground103/Ground103_2K-PNG_Roughness.png",
    repeat: 8,
    actIndex: 3,
    stage: "nearScrollCritical",
  },
] as const;

function preloadGroupsForStage(stage: StartupAssetStage) {
  return STARTUP_PRELOAD_GROUPS.filter((group) => group.stage === stage);
}

function texturePreloadsForStage(stage: StartupAssetStage) {
  return STARTUP_TEXTURE_PRELOADS.filter((texture) => texture.stage === stage);
}

function assetPathsForStage(stage: StartupAssetStage) {
  return STARTUP_ASSET_MANIFEST.filter((asset) => asset.stage === stage).map(
    (asset) => asset.url
  ) as readonly string[];
}

export const STARTUP_ENTRY_CRITICAL_PRELOAD_GROUPS = preloadGroupsForStage(
  "entryCritical"
);
export const STARTUP_NEAR_SCROLL_PRELOAD_GROUPS = preloadGroupsForStage(
  "nearScrollCritical"
);
export const STARTUP_DEFERRED_PRELOAD_GROUPS = preloadGroupsForStage("deferred");

export const STARTUP_ENTRY_CRITICAL_TEXTURE_PRELOADS = texturePreloadsForStage(
  "entryCritical"
);
export const STARTUP_NEAR_SCROLL_TEXTURE_PRELOADS = texturePreloadsForStage(
  "nearScrollCritical"
);
export const STARTUP_DEFERRED_TEXTURE_PRELOADS = texturePreloadsForStage("deferred");

export const STARTUP_ENTRY_CRITICAL_ASSET_PATHS = assetPathsForStage("entryCritical");
export const STARTUP_NEAR_SCROLL_ASSET_PATHS = assetPathsForStage(
  "nearScrollCritical"
);
export const STARTUP_DEFERRED_ASSET_PATHS = assetPathsForStage("deferred");

export const STARTUP_INTERACTIVE_PRELOAD_GROUPS = [
  ...STARTUP_ENTRY_CRITICAL_PRELOAD_GROUPS,
  ...STARTUP_NEAR_SCROLL_PRELOAD_GROUPS,
] as const;

export const STARTUP_BACKGROUND_PRELOAD_GROUPS =
  STARTUP_DEFERRED_PRELOAD_GROUPS;

export const STARTUP_INTERACTIVE_TEXTURE_PRELOADS = [
  ...STARTUP_ENTRY_CRITICAL_TEXTURE_PRELOADS,
  ...STARTUP_NEAR_SCROLL_TEXTURE_PRELOADS,
] as const;

export const STARTUP_BACKGROUND_TEXTURE_PRELOADS =
  STARTUP_DEFERRED_TEXTURE_PRELOADS;

export const STARTUP_INTERACTIVE_ASSET_PATHS = [
  ...STARTUP_ENTRY_CRITICAL_ASSET_PATHS,
  ...STARTUP_NEAR_SCROLL_ASSET_PATHS,
] as const;

export function getStartupAssetDescriptor(id: StartupAssetId) {
  return STARTUP_ASSET_BY_ID[id];
}

export function resolveAssetStage(assetId: StartupAssetId): StartupAssetStage {
  return STARTUP_ASSET_BY_ID[assetId].stage;
}

export function getAssetDescriptorForUrl(url: string) {
  return STARTUP_ASSET_MANIFEST.find((asset) => asset.url === url) ?? null;
}

export function resolveTextureVariantUrl(
  url: string,
  resolution: TextureVariantResolution
) {
  return TEXTURE_VARIANTS[url]?.[resolution] ?? url;
}
