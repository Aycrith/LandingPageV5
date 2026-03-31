"use client";

import * as THREE from "three";

type RenderableObject = THREE.Object3D & {
  isMesh?: boolean;
  isPoints?: boolean;
  isLine?: boolean;
  material?: THREE.Material | THREE.Material[];
};

type InspectableMaterial = THREE.Material & {
  alphaTest?: number;
  defines?: Record<string, unknown>;
  dithering?: boolean;
  flatShading?: boolean;
  fog?: boolean;
  premultipliedAlpha?: boolean;
  vertexColors?: boolean;
  transmission?: number;
  iridescence?: number;
};

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

export function buildMaterialProgramSignature(material: THREE.Material) {
  const inspectableMaterial = material as InspectableMaterial;
  const materialRecord = material as unknown as Record<string, unknown>;

  return [
    material.type,
    material.transparent ? 1 : 0,
    material.blending,
    material.side,
    material.depthWrite ? 1 : 0,
    material.depthTest ? 1 : 0,
    material.toneMapped ? 1 : 0,
    inspectableMaterial.vertexColors ? 1 : 0,
    inspectableMaterial.flatShading ? 1 : 0,
    inspectableMaterial.fog ? 1 : 0,
    inspectableMaterial.premultipliedAlpha ? 1 : 0,
    inspectableMaterial.dithering ? 1 : 0,
    Boolean(materialRecord.map),
    Boolean(materialRecord.normalMap),
    Boolean(materialRecord.roughnessMap),
    Boolean(materialRecord.metalnessMap),
    Boolean(materialRecord.alphaMap),
    Boolean(materialRecord.aoMap),
    Boolean(materialRecord.emissiveMap),
    Boolean(materialRecord.envMap),
    Boolean(inspectableMaterial.transmission),
    Boolean(inspectableMaterial.iridescence),
    inspectableMaterial.alphaTest ?? 0,
    Object.keys(inspectableMaterial.defines ?? {})
      .sort()
      .join(","),
  ].join("|");
}

export function collectSceneProgramSignatures(scene: THREE.Scene) {
  const signatures = new Set<string>();

  scene.traverse((node) => {
    const child = node as RenderableObject;
    if (!(child.isMesh || child.isPoints || child.isLine) || !isActuallyVisible(child)) {
      return;
    }

    const materials = child.material
      ? Array.isArray(child.material)
        ? child.material
        : [child.material]
      : [];

    for (const material of materials) {
      signatures.add(buildMaterialProgramSignature(material));
    }
  });

  return Array.from(signatures).sort();
}

