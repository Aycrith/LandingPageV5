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

export const STARTUP_WARMUP_ACT_SEQUENCE = [2] as const;

export const STARTUP_CRITICAL_ASSET_IDS = [
  "hero-dark-star-scene",
  "hero-dark-star-bin",
  "hero-dark-star-disc",
  "hero-dark-star-horizon",
  "hero-wireframe-globe",
  "hero-hologram",
  "support-satellites-scene",
  "support-satellites-bin",
  "support-satellites-clearcoat",
  "support-satellites-emissive",
  "texture-noise-volumetric",
  "texture-rock063-color",
  "texture-rock063-normal",
  "texture-rock063-roughness",
  "texture-metal049a-color",
  "texture-metal049a-normal",
  "texture-metal049a-roughness",
  "texture-metal049a-metalness",
] as const;

export const STARTUP_ASSET_IDS = [
  "hero-dark-star-scene",
  "hero-dark-star-bin",
  "hero-dark-star-disc",
  "hero-dark-star-horizon",
  "hero-wireframe-globe",
  "hero-hologram",
  "hero-quantum-scene",
  "hero-quantum-bin",
  "hero-quantum-base",
  "hero-quantum-transmission",
  "hero-paradox-abstract",
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
export type StartupCriticalAsset = (typeof STARTUP_CRITICAL_ASSET_IDS)[number];

export type StartupAssetKind = "model" | "texture" | "environment";

export interface StartupAssetDescriptor {
  id: StartupAssetId;
  kind: StartupAssetKind;
  url: string;
}

export interface StartupPreloadGroupDescriptor {
  kind: "model" | "environment";
  url: string;
  readinessIds: readonly StartupAssetId[];
}

export interface StartupTexturePreloadDescriptor {
  id: StartupAssetId;
  url: string;
  repeat: number;
  colorSpace?: "srgb";
  actIndex?: number;
}

export const STARTUP_ASSET_MANIFEST: readonly StartupAssetDescriptor[] = [
  {
    id: "hero-dark-star-scene",
    kind: "model",
    url: HERO_ASSET_PATHS.dark_star,
  },
  {
    id: "hero-dark-star-bin",
    kind: "model",
    url: "/models/dark_star/scene.bin",
  },
  {
    id: "hero-dark-star-disc",
    kind: "texture",
    url: "/models/dark_star/textures/disc_baseColor.png",
  },
  {
    id: "hero-dark-star-horizon",
    kind: "texture",
    url: "/models/dark_star/textures/horizon_baseColor.png",
  },
  {
    id: "hero-wireframe-globe",
    kind: "model",
    url: HERO_ASSET_PATHS.wireframe_globe,
  },
  {
    id: "hero-hologram",
    kind: "model",
    url: HERO_ASSET_PATHS.hologram,
  },
  {
    id: "hero-quantum-scene",
    kind: "model",
    url: HERO_ASSET_PATHS.quantum_leap,
  },
  {
    id: "hero-quantum-bin",
    kind: "model",
    url: "/models/quantum_leap/scene.bin",
  },
  {
    id: "hero-quantum-base",
    kind: "texture",
    url: "/models/quantum_leap/textures/Scene_-_Root_baseColor.png",
  },
  {
    id: "hero-quantum-transmission",
    kind: "texture",
    url: "/models/quantum_leap/textures/Scene_-_Root_transmission.png",
  },
  {
    id: "hero-paradox-abstract",
    kind: "model",
    url: HERO_ASSET_PATHS.paradox_abstract,
  },
  {
    id: "hero-black-hole-scene",
    kind: "model",
    url: HERO_ASSET_PATHS.black_hole,
  },
  {
    id: "hero-black-hole-bin",
    kind: "model",
    url: "/models/black_hole/scene.bin",
  },
  {
    id: "hero-black-hole-base",
    kind: "texture",
    url: "/models/black_hole/textures/Material_63_baseColor.png",
  },
  {
    id: "hero-black-hole-inner",
    kind: "texture",
    url: "/models/black_hole/textures/Material_64_baseColor.png",
  },
  {
    id: "hero-black-hole-emissive",
    kind: "texture",
    url: "/models/black_hole/textures/Material_64_emissive.png",
  },
  {
    id: "support-satellites-scene",
    kind: "model",
    url: SUPPORT_MODEL_PATHS.satellites,
  },
  {
    id: "support-satellites-bin",
    kind: "model",
    url: "/models/satellites/scene.bin",
  },
  {
    id: "support-satellites-clearcoat",
    kind: "texture",
    url: "/models/satellites/textures/earth_clearcoat.png",
  },
  {
    id: "support-satellites-emissive",
    kind: "texture",
    url: "/models/satellites/textures/earth_emissive.png",
  },
  {
    id: "environment-kloppenheim",
    kind: "environment",
    url: "/env/hdri/kloppenheim_07_4k.exr",
  },
  {
    id: "texture-noise-volumetric",
    kind: "texture",
    url: "/textures/volumetric/nebula-noise-1k-seamless.png",
  },
  {
    id: "texture-ground103-color",
    kind: "texture",
    url: "/textures/pbr/ground103/Ground103_2K-PNG_Color.png",
  },
  {
    id: "texture-ground103-normal",
    kind: "texture",
    url: "/textures/pbr/ground103/Ground103_2K-PNG_NormalGL.png",
  },
  {
    id: "texture-ground103-roughness",
    kind: "texture",
    url: "/textures/pbr/ground103/Ground103_2K-PNG_Roughness.png",
  },
  {
    id: "texture-rock063-color",
    kind: "texture",
    url: "/textures/pbr/rock063/Rock063_2K-PNG_Color.png",
  },
  {
    id: "texture-rock063-normal",
    kind: "texture",
    url: "/textures/pbr/rock063/Rock063_2K-PNG_NormalGL.png",
  },
  {
    id: "texture-rock063-roughness",
    kind: "texture",
    url: "/textures/pbr/rock063/Rock063_2K-PNG_Roughness.png",
  },
  {
    id: "texture-metal049a-color",
    kind: "texture",
    url: "/textures/pbr/metal049a/Metal049A_2K-PNG_Color.png",
  },
  {
    id: "texture-metal049a-normal",
    kind: "texture",
    url: "/textures/pbr/metal049a/Metal049A_2K-PNG_NormalGL.png",
  },
  {
    id: "texture-metal049a-roughness",
    kind: "texture",
    url: "/textures/pbr/metal049a/Metal049A_2K-PNG_Roughness.png",
  },
  {
    id: "texture-metal049a-metalness",
    kind: "texture",
    url: "/textures/pbr/metal049a/Metal049A_2K-PNG_Metalness.png",
  },
] as const;

export const STARTUP_ASSET_PATHS = STARTUP_ASSET_MANIFEST.map(
  (asset) => asset.url
);

export const STARTUP_PRELOAD_MODEL_PATHS = [
  HERO_ASSET_PATHS.dark_star,
  HERO_ASSET_PATHS.wireframe_globe,
  HERO_ASSET_PATHS.hologram,
  HERO_ASSET_PATHS.quantum_leap,
  HERO_ASSET_PATHS.paradox_abstract,
  HERO_ASSET_PATHS.black_hole,
  SUPPORT_MODEL_PATHS.satellites,
] as const;

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
  },
  {
    kind: "model",
    url: HERO_ASSET_PATHS.wireframe_globe,
    readinessIds: ["hero-wireframe-globe"],
  },
  {
    kind: "model",
    url: HERO_ASSET_PATHS.hologram,
    readinessIds: ["hero-hologram"],
  },
  {
    kind: "model",
    url: HERO_ASSET_PATHS.quantum_leap,
    readinessIds: [
      "hero-quantum-scene",
      "hero-quantum-bin",
      "hero-quantum-base",
      "hero-quantum-transmission",
    ],
  },
  {
    kind: "model",
    url: HERO_ASSET_PATHS.paradox_abstract,
    readinessIds: ["hero-paradox-abstract"],
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
  },
  {
    kind: "environment",
    url: "/env/hdri/kloppenheim_07_4k.exr",
    readinessIds: ["environment-kloppenheim"],
  },
] as const;

export const STARTUP_TEXTURE_PRELOADS: readonly StartupTexturePreloadDescriptor[] = [
  {
    id: "texture-noise-volumetric",
    url: "/textures/volumetric/nebula-noise-1k-seamless.png",
    repeat: 2.6,
  },
  {
    id: "texture-rock063-color",
    url: "/textures/pbr/rock063/Rock063_2K-PNG_Color.png",
    repeat: 8,
    colorSpace: "srgb",
    actIndex: 1,
  },
  {
    id: "texture-rock063-normal",
    url: "/textures/pbr/rock063/Rock063_2K-PNG_NormalGL.png",
    repeat: 8,
    actIndex: 1,
  },
  {
    id: "texture-rock063-roughness",
    url: "/textures/pbr/rock063/Rock063_2K-PNG_Roughness.png",
    repeat: 8,
    actIndex: 1,
  },
  {
    id: "texture-metal049a-color",
    url: "/textures/pbr/metal049a/Metal049A_2K-PNG_Color.png",
    repeat: 8,
    colorSpace: "srgb",
    actIndex: 2,
  },
  {
    id: "texture-metal049a-normal",
    url: "/textures/pbr/metal049a/Metal049A_2K-PNG_NormalGL.png",
    repeat: 8,
    actIndex: 2,
  },
  {
    id: "texture-metal049a-roughness",
    url: "/textures/pbr/metal049a/Metal049A_2K-PNG_Roughness.png",
    repeat: 8,
    actIndex: 2,
  },
  {
    id: "texture-metal049a-metalness",
    url: "/textures/pbr/metal049a/Metal049A_2K-PNG_Metalness.png",
    repeat: 8,
    actIndex: 2,
  },
  {
    id: "texture-ground103-color",
    url: "/textures/pbr/ground103/Ground103_2K-PNG_Color.png",
    repeat: 8,
    colorSpace: "srgb",
    actIndex: 3,
  },
  {
    id: "texture-ground103-normal",
    url: "/textures/pbr/ground103/Ground103_2K-PNG_NormalGL.png",
    repeat: 8,
    actIndex: 3,
  },
  {
    id: "texture-ground103-roughness",
    url: "/textures/pbr/ground103/Ground103_2K-PNG_Roughness.png",
    repeat: 8,
    actIndex: 3,
  },
] as const;

const STARTUP_INTERACTIVE_MODEL_URLS = new Set<string>([
  HERO_ASSET_PATHS.dark_star,
  HERO_ASSET_PATHS.wireframe_globe,
  HERO_ASSET_PATHS.hologram,
  SUPPORT_MODEL_PATHS.satellites,
]);

export const STARTUP_INTERACTIVE_PRELOAD_GROUPS = STARTUP_PRELOAD_GROUPS.filter((group) =>
  STARTUP_INTERACTIVE_MODEL_URLS.has(group.url)
);

export const STARTUP_BACKGROUND_PRELOAD_GROUPS = STARTUP_PRELOAD_GROUPS.filter(
  (group) => !STARTUP_INTERACTIVE_MODEL_URLS.has(group.url)
);

export const STARTUP_INTERACTIVE_TEXTURE_PRELOADS = STARTUP_TEXTURE_PRELOADS.filter((texture) =>
  STARTUP_CRITICAL_ASSET_IDS.includes(texture.id as StartupCriticalAsset)
);

export const STARTUP_BACKGROUND_TEXTURE_PRELOADS = STARTUP_TEXTURE_PRELOADS.filter(
  (texture) => !STARTUP_CRITICAL_ASSET_IDS.includes(texture.id as StartupCriticalAsset)
);

export const STARTUP_INTERACTIVE_ASSET_PATHS = [
  ...STARTUP_ASSET_MANIFEST.filter((asset) =>
    STARTUP_CRITICAL_ASSET_IDS.includes(asset.id as StartupCriticalAsset)
  ).map((asset) => asset.url),
] as const;
