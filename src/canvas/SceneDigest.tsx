"use client";

/**
 * SceneDigest — dev-only scene inspection bridge
 *
 * Exposes a structured snapshot of the live R3F scene graph to any external
 * tool (MCP server, browser devtools, threejs-devtools-mcp, etc.) that can
 * query the browser's JavaScript context. Follows the pattern described in
 * "Feeding AI Coding Agents Accurate Spatial Context for Web 3D Scenes":
 * rather than asking an agent to infer scene state from pixels, export the
 * engine's ground-truth as a queryable interface.
 *
 * Usage in devtools console:
 *   window.__R3F_SCENE_DIGEST__          // last snapshot
 *   window.addEventListener('r3f:scene-digest', e => console.log(e.detail))
 *
 * Only active when NODE_ENV === "development". In production the component
 * renders null immediately and all snapshot logic is dead code.
 */

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface DigestMaterial {
  type: string;
  transparent: boolean;
  depthWrite: boolean;
  opacity: number;
  transmission?: number;
  iridescence?: number;
  blending?: number;
}

interface DigestObject {
  uuid: string;
  name: string;
  type: string;
  visible: boolean;
  worldPosition: [number, number, number];
  triangles?: number;
  material?: DigestMaterial;
}

interface SceneDigestPayload {
  timestamp: number;
  camera: { position: [number, number, number]; fov: number };
  renderer: { calls: number; triangles: number; textures: number; programs: number };
  summary: {
    totalObjects: number;
    visibleMeshes: number;
    transparentMeshes: number;
    transmissionMeshes: number;
  };
  objects: DigestObject[];
}

declare global {
  interface Window {
    __R3F_SCENE_DIGEST__?: SceneDigestPayload;
  }
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function toCoords(v: THREE.Vector3): [number, number, number] {
  return [round3(v.x), round3(v.y), round3(v.z)];
}

function SceneDigestInner() {
  const { scene, camera, gl } = useThree();
  const lastSampleMs = useRef(0);
  const worldPos = useRef(new THREE.Vector3());

  useFrame(() => {
    const now = performance.now();
    if (now - lastSampleMs.current < 2000) return;
    lastSampleMs.current = now;

    const objects: DigestObject[] = [];
    let visibleMeshes = 0;
    let transparentMeshes = 0;
    let transmissionMeshes = 0;

    scene.traverse((node) => {
      node.getWorldPosition(worldPos.current);

      const entry: DigestObject = {
        uuid: node.uuid.slice(0, 8),
        name: node.name || "(unnamed)",
        type: node.type,
        visible: node.visible,
        worldPosition: toCoords(worldPos.current),
      };

      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh;
        const geo = mesh.geometry;
        if (geo.index) {
          entry.triangles = geo.index.count / 3;
        } else if (geo.attributes.position) {
          entry.triangles = Math.floor(geo.attributes.position.count / 3);
        }

        const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
        if (mat) {
          const physMat = mat as THREE.MeshPhysicalMaterial;
          entry.material = {
            type: mat.type,
            transparent: mat.transparent,
            depthWrite: mat.depthWrite,
            opacity: round3(mat.opacity ?? 1),
            blending: mat.blending,
            ...(physMat.transmission !== undefined &&
              physMat.transmission > 0 && { transmission: round3(physMat.transmission) }),
            ...(physMat.iridescence !== undefined &&
              physMat.iridescence > 0 && { iridescence: round3(physMat.iridescence) }),
          };
        }

        if (node.visible) {
          visibleMeshes++;
          if (mat?.transparent) transparentMeshes++;
          const pm = mat as THREE.MeshPhysicalMaterial;
          if (pm.transmission > 0) transmissionMeshes++;
        }
      }

      objects.push(entry);
    });

    const cam = camera as THREE.PerspectiveCamera;
    const info = gl.info;

    const payload: SceneDigestPayload = {
      timestamp: now,
      camera: {
        position: toCoords(cam.position),
        fov: round3(cam.fov),
      },
      renderer: {
        calls: info.render.calls,
        triangles: info.render.triangles,
        textures: (info.memory as { textures?: number }).textures ?? 0,
        programs: info.programs?.length ?? 0,
      },
      summary: {
        totalObjects: objects.length,
        visibleMeshes,
        transparentMeshes,
        transmissionMeshes,
      },
      objects,
    };

    window.__R3F_SCENE_DIGEST__ = payload;
    window.dispatchEvent(new CustomEvent("r3f:scene-digest", { detail: payload }));
  });

  useEffect(() => {
    return () => {
      delete window.__R3F_SCENE_DIGEST__;
    };
  }, []);

  return null;
}

/**
 * Drop inside <Canvas> in Experience.tsx, gated behind NODE_ENV check:
 *   {process.env.NODE_ENV === "development" && <SceneDigest />}
 */
export function SceneDigest() {
  return <SceneDigestInner />;
}
