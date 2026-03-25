"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useScrollStore } from "@/stores/scrollStore";
import { useSceneLoadStore } from "@/stores/sceneLoadStore";
import { useMouseParallax } from "@/hooks/useMouseParallax";
import { WORLD_PHASES } from "../viewportProfiles";
import { tupleToVector3 } from "@/lib/scene";

const STARTUP_PHASE = WORLD_PHASES[0];

export function CameraRig() {
  const { camera } = useThree();
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const mouse = useMouseParallax();
  const targetPos = useRef(tupleToVector3(STARTUP_PHASE.previewCamera.position));
  const targetLookAt = useRef(tupleToVector3(STARTUP_PHASE.previewCamera.lookAt));
  const currentPos = useRef(tupleToVector3(STARTUP_PHASE.previewCamera.position));
  const currentLookAt = useRef(tupleToVector3(STARTUP_PHASE.previewCamera.lookAt));
  const startupSettlingStartedAt = useRef<number | null>(null);
  const startupSequenceComplete = useRef(false);

  const positionCurve = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        WORLD_PHASES.map((phase) => tupleToVector3(phase.cameraRailSegment.position)),
        true,
        "catmullrom",
        0.5
      ),
    []
  );
  const lookAtCurve = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        WORLD_PHASES.map((phase) => tupleToVector3(phase.cameraRailSegment.lookAt)),
        true,
        "catmullrom",
        0.5
      ),
    []
  );
  const fovs = useMemo(
    () => WORLD_PHASES.map((phase) => phase.cameraRailSegment.fov),
    []
  );
  const startupPreview = useMemo(
    () => ({
      position: tupleToVector3(STARTUP_PHASE.previewCamera.position),
      lookAt: tupleToVector3(STARTUP_PHASE.previewCamera.lookAt),
      fov: STARTUP_PHASE.previewCamera.fov,
    }),
    []
  );
  const startupSettle = useMemo(
    () => ({
      position: tupleToVector3(STARTUP_PHASE.settleCamera.position),
      lookAt: tupleToVector3(STARTUP_PHASE.settleCamera.lookAt),
      fov: STARTUP_PHASE.settleCamera.fov,
    }),
    []
  );

  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      cameraRef.current = camera;
      camera.position.copy(startupPreview.position);
      camera.lookAt(startupPreview.lookAt);
      camera.fov = startupPreview.fov;
      camera.updateProjectionMatrix();
    }
  }, [camera, startupPreview]);

  useFrame((state, delta) => {
    const perspCam = cameraRef.current;
    if (!perspCam) return;

    const { progress } = useScrollStore.getState();
    const startupState = useSceneLoadStore.getState();
    let targetFov = startupSettle.fov;
    let allowParallax = startupSequenceComplete.current;

    if (!startupSequenceComplete.current) {
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
          settleElapsedMs / STARTUP_PHASE.fxLayerBehavior.settleDurationMs,
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
      const normalized = THREE.MathUtils.euclideanModulo(progress, 1);
      positionCurve.getPointAt(normalized, targetPos.current);
      lookAtCurve.getPointAt(normalized, targetLookAt.current);

      const exactIndex = normalized * WORLD_PHASES.length;
      const leftIndex = Math.floor(exactIndex) % WORLD_PHASES.length;
      const rightIndex = (leftIndex + 1) % WORLD_PHASES.length;
      const localT = exactIndex - Math.floor(exactIndex);
      targetFov = THREE.MathUtils.lerp(fovs[leftIndex], fovs[rightIndex], localT);
      allowParallax = true;
    }

    if (allowParallax) {
      targetPos.current.x += mouse.current.x * 0.08;
      targetPos.current.y += mouse.current.y * 0.05;
      targetLookAt.current.x += mouse.current.x * 0.03;
      targetLookAt.current.y += mouse.current.y * 0.02;
    }

    const lerpBase = startupSequenceComplete.current ? 0.003 : 0.0006;
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
