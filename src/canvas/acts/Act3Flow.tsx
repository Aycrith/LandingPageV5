"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, extend, type ThreeElement } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import * as THREE from "three";
import { HologramMaterial } from "@/canvas/materials/HologramMaterial";
import { resolveTextureVariantUrl } from "@/canvas/assetManifest";
import {
  getTextureSamplingOptions,
  useActMaterialTierConfig,
} from "@/canvas/acts/materialTierConfig";
import { seededUnit } from "@/lib/random";
import { useOptionalRepeatingTexture } from "@/lib/textures";
import { GradientBlurBg } from "@/canvas/environment/GradientBlurBg";
import { DottedWave } from "@/canvas/environment/DottedWave";
import { getActWeight, useWorldMotionRef } from "@/canvas/worldMotion";

const ACT_INDEX = 2;

const FlowSurfaceShaderMaterial = shaderMaterial(
  {
    uTime: 0,
    uProgress: 0,
    uOpacity: 0,
    uColorA: new THREE.Color("#d0a2ff"),
    uColorB: new THREE.Color("#6dc7ff"),
  },
  `
  uniform float uTime;
  uniform float uProgress;
  varying vec2 vUv;
  varying float vWaveHeight;
  varying vec3 vViewPosition;
  varying vec3 vWorldNormal;

  void main() {
    vUv = uv;

    vec3 displaced = position;
    float wave1 = sin(position.x * 0.4 + uTime * 0.6) * cos(position.y * 0.3 + uTime * 0.4);
    float wave2 = sin(position.x * 1.0 + uTime * 1.0 + position.y * 0.6) * 0.35;
    float wave3 = cos(position.x * 0.2 - uTime * 0.3 + position.y * 1.2) * 0.25;
    float ripple = sin(length(position.xy) * 0.8 - uTime * 1.5) * 0.2;
    float displacement = (wave1 + wave2 + wave3 + ripple) * uProgress;

    displaced.z += displacement;
    vWaveHeight = displacement;

    vec4 worldPosition = modelMatrix * vec4(displaced, 1.0);
    vec4 viewPosition = viewMatrix * worldPosition;
    vViewPosition = viewPosition.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);

    gl_Position = projectionMatrix * viewPosition;
  }
  `,
  `
  uniform float uOpacity;
  uniform vec3 uColorA;
  uniform vec3 uColorB;

  varying vec2 vUv;
  varying float vWaveHeight;
  varying vec3 vViewPosition;
  varying vec3 vWorldNormal;

  void main() {
    vec3 viewDir = normalize(-vViewPosition);
    float fresnel = pow(1.0 - max(dot(normalize(vWorldNormal), viewDir), 0.0), 2.4);
    float waveBand = smoothstep(-0.6, 0.8, vWaveHeight);
    float scan = sin((vUv.x + vUv.y) * 14.0) * 0.08 + 0.92;
    vec3 color = mix(uColorB, uColorA, waveBand);
    color *= scan + fresnel * 0.55;
    float alpha = uOpacity * (0.7 + fresnel * 0.25);
    gl_FragColor = vec4(color, alpha);
  }
  `
);

extend({ FlowSurfaceShaderMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    flowSurfaceShaderMaterial: ThreeElement<typeof FlowSurfaceShaderMaterial>;
  }
}

export function Act3Flow() {
  const motionRef = useWorldMotionRef();
  const groupRef = useRef<THREE.Group>(null);
  const surfaceMaterialRef = useRef<
    THREE.ShaderMaterial & { uTime: number; uProgress: number; uOpacity: number }
  >(null);
  const keyLightRef = useRef<THREE.PointLight>(null);
  const fillLightRef = useRef<THREE.PointLight>(null);
  const tierConfig = useActMaterialTierConfig(2);

  const ribbonCount = tierConfig.mesh.ribbonCount;
  const ribbonData = useMemo(() => {
    return Array.from({ length: ribbonCount }, (_, i) => ({
      radius: 1.8 + i * 0.45,
      speed: 0.15 + seededUnit(i * 13 + 1) * 0.18,
      yOffset: (i - ribbonCount / 2) * 0.32,
      phase: (i / ribbonCount) * Math.PI * 2,
      frequency: 1.2 + seededUnit(i * 13 + 2) * 1.1,
      amplitude: 0.18 + seededUnit(i * 13 + 3) * 0.32,
    }));
  }, [ribbonCount]);

  const ribbonGeometries = useMemo(() => {
    return ribbonData.map((data) => {
      const curve = new THREE.CatmullRomCurve3(
        Array.from({ length: 20 }, (_, i) => {
          const t = (i / 19) * Math.PI * 2;
          return new THREE.Vector3(
            Math.cos(t) * data.radius,
            data.yOffset + Math.sin(t * data.frequency) * data.amplitude,
            Math.sin(t) * data.radius
          );
        }),
        true
      );
      return new THREE.TubeGeometry(curve, 64, 0.016, 4, true);
    });
  }, [ribbonData]);

  const planeGeo = useMemo(() => new THREE.PlaneGeometry(18, 18, 96, 96), []);

  useEffect(() => {
    return () => {
      planeGeo.dispose();
      ribbonGeometries.forEach((geometry) => geometry.dispose());
    };
  }, [planeGeo, ribbonGeometries]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const progress = getActWeight(motionRef.current, ACT_INDEX);
    const visible = progress > 0.01;
    groupRef.current.visible = visible;
    if (!visible) return;
    const t = state.clock.elapsedTime;
    groupRef.current.position.set(0.6, -2.6, 0);

    if (surfaceMaterialRef.current) {
      const scaleIn = Math.min(progress / 0.25, 1);
      surfaceMaterialRef.current.uTime = t;
      surfaceMaterialRef.current.uProgress = progress;
      surfaceMaterialRef.current.uOpacity = scaleIn * 0.34;
    }

    const fadeOut = progress > 0.85 ? 1 - (progress - 0.85) / 0.15 : 1;
    groupRef.current.visible = fadeOut > 0.01;
    if (keyLightRef.current) {
      keyLightRef.current.intensity = progress * 10;
    }
    if (fillLightRef.current) {
      fillLightRef.current.intensity = progress * 4;
    }
  });

  return (
    <group
      ref={groupRef}
      rotation={[-0.14, 0, 0]}
      position={[0, -2.6, 0]}
      visible={false}
    >
      <GradientBlurBg actIndex={ACT_INDEX} />
      <DottedWave actIndex={ACT_INDEX} color="#d0a2ff" yOffset={-1.8} />

      <mesh
        geometry={planeGeo}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[1.8, -0.45, 0]}
      >
        <flowSurfaceShaderMaterial
          ref={surfaceMaterialRef}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
          uTime={0}
          uProgress={0}
          uOpacity={0}
          uColorA={new THREE.Color("#d0a2ff")}
          uColorB={new THREE.Color("#6dc7ff")}
        />
      </mesh>

      {ribbonGeometries.map((geometry, i) => (
        <FlowRibbon
          key={i}
          geometry={geometry}
          data={ribbonData[i]}
        />
      ))}
      <Metal049ASurface tierConfig={tierConfig} />

      <mesh position={[2.9, 0.4, -0.9]}>
        <cylinderGeometry args={[0.3, 0.5, 1, 16]} />
        <HologramMaterial color="#d0a2ff" />
      </mesh>

      <pointLight
        ref={keyLightRef}
        color="#d0a2ff"
        intensity={0}
        distance={20}
        decay={2}
        position={[2.6, 3.2, 0]}
      />
      <pointLight
        ref={fillLightRef}
        color="#6dc7ff"
        intensity={0}
        distance={12}
        decay={2}
        position={[2.8, 3.8, -1]}
      />
    </group>
  );
}

export function FlowSurfaceWarmupMesh() {
  return (
    <mesh position={[-2.8, -1.4, -6]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[2.2, 2.2, 1, 1]} />
      <flowSurfaceShaderMaterial
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
        uTime={0}
        uProgress={1}
        uOpacity={0.24}
        uColorA={new THREE.Color("#d0a2ff")}
        uColorB={new THREE.Color("#6dc7ff")}
      />
    </mesh>
  );
}

function FlowRibbon({
  geometry,
  data,
}: {
  geometry: THREE.TubeGeometry;
  data: { speed: number; phase: number };
}) {
  const motionRef = useWorldMotionRef();
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const progress = getActWeight(motionRef.current, ACT_INDEX);
    const visible = progress > 0.01;
    meshRef.current.visible = visible;
    if (!visible) return;
    meshRef.current.rotation.y =
      state.clock.elapsedTime * data.speed + data.phase;
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = Math.min(progress / 0.3, 1) * 0.22;
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshBasicMaterial
        color="#d0a2ff"
        transparent
        opacity={0.4}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

function Metal049ASurface({
  tierConfig,
}: {
  tierConfig: ReturnType<typeof useActMaterialTierConfig>;
}) {
  const motionRef = useWorldMotionRef();
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const colorMap = useOptionalRepeatingTexture(
    tierConfig.texture.useColorMap
      ? resolveTextureVariantUrl(
          "/textures/pbr/metal049a/Metal049A_2K-PNG_Color.png",
          tierConfig.texture.resolution
        )
      : null,
    getTextureSamplingOptions(tierConfig.texture, {
      repeat: 6,
      colorSpace: THREE.SRGBColorSpace,
    })
  );
  const normalMap = useOptionalRepeatingTexture(
    tierConfig.texture.useNormalMap
      ? "/textures/pbr/metal049a/Metal049A_2K-PNG_NormalGL.png"
      : null,
    getTextureSamplingOptions(tierConfig.texture, { repeat: 6 })
  );
  const roughnessMap = useOptionalRepeatingTexture(
    tierConfig.texture.useRoughnessMap
      ? "/textures/pbr/metal049a/Metal049A_2K-PNG_Roughness.png"
      : null,
    getTextureSamplingOptions(tierConfig.texture, { repeat: 6 })
  );
  const metalnessMap = useOptionalRepeatingTexture(
    tierConfig.texture.useMetalnessMap
      ? "/textures/pbr/metal049a/Metal049A_2K-PNG_Metalness.png"
      : null,
    getTextureSamplingOptions(tierConfig.texture, { repeat: 6 })
  );

  useFrame(() => {
    const progress = getActWeight(motionRef.current, ACT_INDEX);
    if (progress <= 0.01) return;
    if (matRef.current) {
      matRef.current.opacity = Math.min(progress / 0.4, 1) * 0.65;
    }
  });

  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, -3.5, 0]}>
      <circleGeometry args={[22, 64]} />
      <meshStandardMaterial
        ref={matRef}
        map={tierConfig.texture.useColorMap ? colorMap : null}
        normalMap={tierConfig.texture.useNormalMap ? normalMap : null}
        roughnessMap={tierConfig.texture.useRoughnessMap ? roughnessMap : null}
        metalnessMap={tierConfig.texture.useMetalnessMap ? metalnessMap : null}
        roughness={0.3}
        metalness={0.85}
        transparent
        opacity={0}
        envMapIntensity={1.2}
        depthWrite={false}
      />
    </mesh>
  );
}
