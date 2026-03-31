"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { createPortal, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { NeuralPulseWarmupMesh } from "./acts/Act6QuantumConsciousness";
import { ShaderLinesField } from "./environment/ShaderLinesField";
import { WarpDriveBackground } from "./environment/WarpDriveBackground";
import { CrystalMaterial } from "./materials/CrystalMaterial";
import {
  WorldMotionProvider,
  createWorldMotionSnapshot,
} from "./worldMotion";
import { useSceneLoadStore } from "@/stores/sceneLoadStore";

function waitForAnimationFrames(frameCount: number) {
  return new Promise<void>((resolve) => {
    let framesRemaining = frameCount;

    function tick() {
      framesRemaining -= 1;
      if (framesRemaining <= 0) {
        resolve();
        return;
      }

      window.requestAnimationFrame(tick);
    }

    window.requestAnimationFrame(tick);
  });
}

function ShaderWarmupPalette() {
  const motionRef = useRef(createWorldMotionSnapshot());

  useMemo(() => {
    const snapshot = motionRef.current;
    snapshot.activeAct = 4;
    snapshot.nextAct = 5;
    snapshot.metricActIndex = 4;
    snapshot.phaseBlend = 0.5;
    snapshot.weights.fill(0);
    snapshot.weights[1] = 1;
    snapshot.weights[2] = 1;
    snapshot.weights[4] = 1;
    snapshot.weights[5] = 1;
    snapshot.worldAnchor.set(0, 0, 0);
    snapshot.pointerOffset.set(0, 0, 0);
  }, []);

  return (
    <WorldMotionProvider motionRef={motionRef}>
      <group>
        <mesh position={[-3.6, 0, -5.8]}>
          <icosahedronGeometry args={[0.42, 1]} />
          <CrystalMaterial color="#ffd06f" />
        </mesh>
        <NeuralPulseWarmupMesh />
        <WarpDriveBackground actIndex={4} enabled />
        <ShaderLinesField actIndex={4} enabled />
      </group>
    </WorldMotionProvider>
  );
}

function ShaderWarmupCompiler() {
  const { gl } = useThree();
  const portalScene = useMemo(() => new THREE.Scene(), []);
  const warmupCamera = useMemo(() => new THREE.PerspectiveCamera(40, 1, 0.1, 50), []);

  useEffect(() => {
    let cancelled = false;

    async function compileWarmupScene() {
      await waitForAnimationFrames(2);
      if (cancelled) {
        return;
      }

      warmupCamera.position.set(0, 0, 6);
      warmupCamera.lookAt(0, 0, -6);
      warmupCamera.updateProjectionMatrix();
      warmupCamera.updateMatrixWorld();
      portalScene.updateMatrixWorld(true);

      const renderer = gl as THREE.WebGLRenderer & {
        compileAsync?: (
          scene: THREE.Object3D,
          camera: THREE.Camera,
          targetScene?: THREE.Scene | null
        ) => Promise<unknown>;
      };
      const previousTarget = renderer.getRenderTarget();

      try {
        if (typeof renderer.compileAsync === "function") {
          await renderer.compileAsync(portalScene, warmupCamera, portalScene);
        } else {
          renderer.compile(portalScene, warmupCamera, portalScene);
        }

        const warmupTarget = new THREE.WebGLRenderTarget(64, 64, {
          depthBuffer: true,
          stencilBuffer: false,
        });
        renderer.setRenderTarget(warmupTarget);
        renderer.clear();
        renderer.render(portalScene, warmupCamera);
        renderer.setRenderTarget(previousTarget);
        warmupTarget.dispose();
        useSceneLoadStore.getState().markShaderWarmupReady();
      } finally {
        renderer.setRenderTarget(previousTarget);
      }
    }

    void compileWarmupScene();

    return () => {
      cancelled = true;
    };
  }, [gl, portalScene, warmupCamera]);

  return createPortal(<ShaderWarmupPalette />, portalScene);
}

export function ShaderWarmupHost() {
  return (
    <Suspense fallback={null}>
      <ShaderWarmupCompiler />
    </Suspense>
  );
}
