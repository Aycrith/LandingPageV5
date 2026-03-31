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
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    cameraRef.current = camera;
    // Mutate via the ref-derived local — avoids modifying hook return value directly.
    const cam = cameraRef.current;
    cam.position.copy(startupPreview.position);
    cam.lookAt(startupPreview.lookAt);
    cam.fov = startupPreview.fov;
    cam.updateProjectionMatrix();
  }, [camera, startupPreview]);

  useFrame((state, delta) => {
    const perspCam = cameraRef.current;
    if (!perspCam) return;

    const { progress, velocity } = useScrollStore.getState();
    const startupState = useSceneLoadStore.getState();
    let targetFov = startupSettle.fov;
    let allowParallax = startupSequenceComplete.current;
    const isWarmupMount =
      !startupState.warmupReady && startupState.warmupActIndex != null;

    if (!startupSequenceComplete.current) {
      allowParallax = startupState.stableFrameReady && !isWarmupMount;

      if (isWarmupMount) {
        const warmupProfile = WORLD_PHASES[startupState.warmupActIndex!];
        targetPos.current.copy(tupleToVector3(warmupProfile.settleCamera.position));
        targetLookAt.current.copy(tupleToVector3(warmupProfile.settleCamera.lookAt));
        targetFov = warmupProfile.settleCamera.fov;
      } else if (!startupState.stableFrameReady) {
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
      lookAtCurve.getPointAt((normalized + 0.015) % 1, targetLookAt.current);
      targetPos.current.x += Math.sin(state.clock.elapsedTime * 0.7 + 1.2) * 0.004;
      targetPos.current.y += Math.cos(state.clock.elapsedTime * 0.5) * 0.004;

      const exactIndex = normalized * WORLD_PHASES.length;
      const leftIndex = Math.floor(exactIndex) % WORLD_PHASES.length;
      const rightIndex = (leftIndex + 1) % WORLD_PHASES.length;
      const localT = exactIndex - Math.floor(exactIndex);
      targetFov = THREE.MathUtils.lerp(fovs[leftIndex], fovs[rightIndex], localT);
      allowParallax = true;
    }

    if (allowParallax) {
      targetPos.current.x += mouse.current.x * 0.12;
      targetPos.current.y += mouse.current.y * 0.08;
      targetLookAt.current.x += mouse.current.x * 0.03;
      targetLookAt.current.y += mouse.current.y * 0.02;
    }

    const lerpSpeed =
      1 - Math.pow(startupSequenceComplete.current ? 0.003 : 0.0006, delta);

    currentPos.current.lerp(targetPos.current, lerpSpeed);
    currentLookAt.current.lerp(targetLookAt.current, lerpSpeed);

    perspCam.position.copy(currentPos.current);
    perspCam.lookAt(currentLookAt.current);
    perspCam.rotation.z = THREE.MathUtils.lerp(
      perspCam.rotation.z,
      velocity * -0.04,
      lerpSpeed
    );
    perspCam.fov = THREE.MathUtils.lerp(perspCam.fov, targetFov, lerpSpeed);
    perspCam.updateProjectionMatrix();
  });

  return null;
}
