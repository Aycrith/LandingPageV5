"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef, useMemo, useEffect } from "react";
import * as THREE from "three";
import { useScrollStore } from "@/stores/scrollStore";
import { useSceneLoadStore } from "@/stores/sceneLoadStore";
import { useMouseParallax } from "@/hooks/useMouseParallax";
import { ACT_VIEWPORT_PROFILES } from "../viewportProfiles";
import { tupleToVector3 } from "@/lib/scene";
import { getSplineEngine } from "../SplineEngine";

const STARTUP_PROFILE = ACT_VIEWPORT_PROFILES[0];

export function CameraRig() {
  const { camera } = useThree();
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const mouse = useMouseParallax();
  const targetPos = useRef(
    tupleToVector3(STARTUP_PROFILE.previewCamera.position)
  );
  const targetLookAt = useRef(
    tupleToVector3(STARTUP_PROFILE.previewCamera.lookAt)
  );
  const currentPos = useRef(
    tupleToVector3(STARTUP_PROFILE.previewCamera.position)
  );
  const currentLookAt = useRef(
    tupleToVector3(STARTUP_PROFILE.previewCamera.lookAt)
  );
  const startupSettlingStartedAt = useRef<number | null>(null);
  const startupSequenceComplete = useRef(false);

  const spline = useMemo(() => getSplineEngine(), []);

  const startupPreview = useMemo(
    () => ({
      position: tupleToVector3(STARTUP_PROFILE.previewCamera.position),
      lookAt: tupleToVector3(STARTUP_PROFILE.previewCamera.lookAt),
      fov: STARTUP_PROFILE.previewCamera.fov,
    }),
    []
  );

  const startupSettle = useMemo(
    () => ({
      position: tupleToVector3(STARTUP_PROFILE.settleCamera.position),
      lookAt: tupleToVector3(STARTUP_PROFILE.settleCamera.lookAt),
      fov: STARTUP_PROFILE.settleCamera.fov,
    }),
    []
  );

  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      cameraRef.current = camera;
      const nextCamera = cameraRef.current;
      nextCamera.position.copy(startupPreview.position);
      nextCamera.lookAt(startupPreview.lookAt);
      nextCamera.fov = startupPreview.fov;
      nextCamera.updateProjectionMatrix();
    }
  }, [camera, startupPreview]);

  useFrame((state, delta) => {
    const perspCam = cameraRef.current;
    if (!perspCam) return;

    const { progress } = useScrollStore.getState();
    const startupState = useSceneLoadStore.getState();

    // Sample the unified spline at current progress (auto-wraps for infinite)
    const sample = spline.sample(progress);
    let targetFov = sample.fov;
    let allowParallax = true;

    if (sample.actIndex === 0 && sample.actProgress < 0.3 && !startupSequenceComplete.current) {
      allowParallax = startupState.stableFrameReady;

      if (!startupState.stableFrameReady) {
        targetPos.current.copy(startupPreview.position);
        targetLookAt.current.copy(startupPreview.lookAt);
        targetFov = startupPreview.fov;
      } else {
        if (startupSettlingStartedAt.current === null) {
          startupSettlingStartedAt.current = state.clock.elapsedTime;
        }

        const settleElapsedMs =
          (state.clock.elapsedTime - startupSettlingStartedAt.current) * 1000;
        const settleT = THREE.MathUtils.clamp(
          settleElapsedMs / STARTUP_PROFILE.fxLayerBehavior.settleDurationMs,
          0,
          1
        );
        const easedT = THREE.MathUtils.smootherstep(settleT, 0, 1);

        targetPos.current
          .copy(startupPreview.position)
          .lerp(startupSettle.position, easedT);
        targetLookAt.current
          .copy(startupPreview.lookAt)
          .lerp(startupSettle.lookAt, easedT);
        targetFov = THREE.MathUtils.lerp(
          startupPreview.fov,
          startupSettle.fov,
          easedT
        );

        if (settleT >= 1) {
          startupSequenceComplete.current = true;
        }
      }
    } else {
      startupSequenceComplete.current = true;
      targetPos.current.copy(sample.position);
      targetLookAt.current.copy(sample.lookAt);
      targetFov = sample.fov;
    }

    if (allowParallax) {
      targetPos.current.x += mouse.current.x * 0.3;
      targetPos.current.y += mouse.current.y * 0.15;
    }

    const lerpBase = startupSequenceComplete.current ? 0.001 : 0.0004;
    const lerpSpeed = 1 - Math.pow(lerpBase, delta);

    currentPos.current.lerp(targetPos.current, lerpSpeed);
    currentLookAt.current.lerp(targetLookAt.current, lerpSpeed);

    perspCam.position.copy(currentPos.current);
    perspCam.lookAt(currentLookAt.current);
    perspCam.fov = THREE.MathUtils.lerp(perspCam.fov, targetFov, lerpSpeed);
    perspCam.updateProjectionMatrix();
  });

  return null;
}
