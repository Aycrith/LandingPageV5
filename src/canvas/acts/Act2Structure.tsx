"use client";

import { useRef, useMemo, Suspense } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { WireframePulseMaterial } from "@/canvas/materials/WireframePulse";
import { ACT_VIEWPORT_PROFILES } from "@/canvas/viewportProfiles";
import { useViewportAuditStore } from "@/stores/viewportAuditStore";
import { seededUnit } from "@/lib/random";
import {
  fitScaleToViewportFill,
  getViewportHeightAtDistance,
  useSceneBounds,
  useStableSceneClone,
} from "@/lib/scene";
import { useRepeatingTexture } from "@/lib/textures";

interface ActProps {
  progress: number;
  visible: boolean;
}

const ACT_PROFILE = ACT_VIEWPORT_PROFILES[1];

function GlobeModel({ progress }: { progress: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const worldPosRef = useRef(new THREE.Vector3());
  const gltf = useGLTF("/models/wireframe_3d_globe.glb");
  const sceneClone = useStableSceneClone(gltf.scene);
  const bounds = useSceneBounds(gltf.scene);

  const fittedMaxScale = useMemo(
    () =>
      fitScaleToViewportFill({
        desiredScale: ACT_PROFILE.heroModelBehavior.maxScale,
        rawHeight: bounds.height,
        maxFill:
          ACT_PROFILE.maxModelViewportFill *
          ACT_PROFILE.heroModelBehavior.fitPadding,
        previewCamera: ACT_PROFILE.previewCamera,
        settleCamera: ACT_PROFILE.settleCamera,
      }),
    [bounds.height]
  );

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.12;
    const desiredScale = Math.min(progress / 0.3, 1) * 0.02;
    const appliedScale = Math.min(desiredScale, fittedMaxScale);
    const camera = state.camera as THREE.PerspectiveCamera;

    groupRef.current.scale.setScalar(appliedScale);
    groupRef.current.getWorldPosition(worldPosRef.current);
    const distance = worldPosRef.current.distanceTo(camera.position);
    const visibleHeight = getViewportHeightAtDistance(distance, camera.fov);

    useViewportAuditStore.getState().reportHeroModel("act2-globe", {
      desiredScale,
      appliedScale,
      fillRatio: (bounds.height * appliedScale) / visibleHeight,
      maxFill: ACT_PROFILE.maxModelViewportFill,
    });
  });

  return (
    <group ref={groupRef}>
      <primitive object={sceneClone} />
    </group>
  );
}

function SatellitesModel({ progress }: { progress: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const gltf = useGLTF("/models/satellites/scene.gltf");
  const sceneClone = useStableSceneClone(gltf.scene);
  const bounds = useSceneBounds(gltf.scene);

  const fittedMaxScale = useMemo(
    () =>
      fitScaleToViewportFill({
        desiredScale: 0.01,
        rawHeight: bounds.height,
        maxFill: ACT_PROFILE.maxModelViewportFill * 0.9,
        previewCamera: ACT_PROFILE.previewCamera,
        settleCamera: ACT_PROFILE.settleCamera,
      }),
    [bounds.height]
  );

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = -state.clock.elapsedTime * 0.08;
    const appear = Math.max(0, (progress - 0.3) / 0.4);
    groupRef.current.scale.setScalar(Math.min(Math.min(appear, 1) * 0.01, fittedMaxScale));
  });

  return (
    <group ref={groupRef} position={[3, 1, -2]}>
      <primitive object={sceneClone} />
    </group>
  );
}

export function Act2Structure({ progress, visible }: ActProps) {
  const groupRef = useRef<THREE.Group>(null);
  const globeRef = useRef<THREE.Mesh>(null);
  const instanceRef = useRef<THREE.InstancedMesh>(null);

  const bodyCount = 32;
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const orbits = useMemo(() => {
    return Array.from({ length: bodyCount }, (_, i) => ({
      radius: 3 + seededUnit(i * 17 + 1) * 5,
      speed: 0.15 + seededUnit(i * 17 + 2) * 0.35,
      tilt: seededUnit(i * 17 + 3) * Math.PI,
      phase: (i / bodyCount) * Math.PI * 2,
      scale: 0.08 + seededUnit(i * 17 + 4) * 0.2,
      yOffset: seededUnit(i * 17 + 5) * 4 - 2,
    }));
  }, []);

  useFrame((state) => {
    if (!visible || !groupRef.current) return;
    const t = state.clock.elapsedTime;

    if (globeRef.current) {
      globeRef.current.rotation.y = t * 0.12;
      globeRef.current.rotation.x = Math.sin(t * 0.08) * 0.1;
      const scaleIn = Math.min(progress / 0.25, 1);
      globeRef.current.scale.setScalar(scaleIn * 2.2);
    }

    if (instanceRef.current) {
      for (let i = 0; i < bodyCount; i++) {
        const orbit = orbits[i];
        const angle = t * orbit.speed + orbit.phase;
        const bodyProgress = Math.max(0, (progress - 0.08 - i * 0.015) / 0.35);
        const appear = Math.min(1, bodyProgress);
        const fadeOut = progress > 0.85 ? 1 - (progress - 0.85) / 0.15 : 1;

        dummy.position.set(
          Math.cos(angle) * orbit.radius * Math.cos(orbit.tilt),
          orbit.yOffset + Math.sin(t * 0.5 + orbit.phase) * 0.6,
          Math.sin(angle) * orbit.radius
        );
        dummy.scale.setScalar(orbit.scale * appear * fadeOut);
        dummy.rotation.set(
          t * orbit.speed * 0.5,
          t * orbit.speed * 0.3,
          t * orbit.speed * 0.7
        );
        dummy.updateMatrix();
        instanceRef.current.setMatrixAt(i, dummy.matrix);
      }
      instanceRef.current.instanceMatrix.needsUpdate = true;
    }

    const fadeIn = Math.min(progress / 0.15, 1);
    const fadeOut = progress > 0.85 ? 1 - (progress - 0.85) / 0.15 : 1;
    groupRef.current.visible = fadeIn * fadeOut > 0.01;
  });

  if (!visible) return null;

  return (
    <group ref={groupRef}>
      <mesh ref={globeRef}>
        <icosahedronGeometry args={[2, 4]} />
        <WireframePulseMaterial color="#6dc7ff" pulseSpeed={1.5} />
      </mesh>

      <mesh rotation={[0, Math.PI / 4, Math.PI / 6]}>
        <icosahedronGeometry args={[2.3, 2]} />
        <meshBasicMaterial
          color="#6dc7ff"
          wireframe
          transparent
          opacity={0.1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <instancedMesh
        ref={instanceRef}
        args={[undefined, undefined, bodyCount]}
        castShadow
      >
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color="#6dc7ff"
          emissive="#6dc7ff"
          emissiveIntensity={0.3}
          metalness={0.95}
          roughness={0.05}
        />
      </instancedMesh>

      <Suspense fallback={null}>
        <GlobeModel progress={progress} />
        <SatellitesModel progress={progress} />
      </Suspense>

      <Rock063Ground progress={progress} />

      <pointLight color="#6dc7ff" intensity={10} distance={25} decay={2} />
      <pointLight
        color="#ffffff"
        intensity={3}
        distance={15}
        decay={2}
        position={[0, 5, 0]}
      />
    </group>
  );
}

function Rock063Ground({ progress }: { progress: number }) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const colorMap = useRepeatingTexture(
    "/textures/pbr/rock063/Rock063_2K-PNG_Color.png",
    {
      repeat: 8,
      colorSpace: THREE.SRGBColorSpace,
    }
  );
  const normalMap = useRepeatingTexture(
    "/textures/pbr/rock063/Rock063_2K-PNG_NormalGL.png",
    { repeat: 8 }
  );
  const roughnessMap = useRepeatingTexture(
    "/textures/pbr/rock063/Rock063_2K-PNG_Roughness.png",
    { repeat: 8 }
  );

  useFrame(() => {
    if (matRef.current) {
      matRef.current.opacity = Math.min(progress / 0.4, 1) * 0.72;
    }
  });

  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, -5, 0]}>
      <circleGeometry args={[25, 64]} />
      <meshStandardMaterial
        ref={matRef}
        map={colorMap}
        normalMap={normalMap}
        roughnessMap={roughnessMap}
        roughness={1}
        metalness={0}
        transparent
        opacity={0}
        envMapIntensity={0.8}
        depthWrite={false}
      />
    </mesh>
  );
}

useGLTF.preload("/models/wireframe_3d_globe.glb");
useGLTF.preload("/models/satellites/scene.gltf");
