"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef, useMemo, useEffect } from "react";
import * as THREE from "three";
import { useScrollStore } from "@/stores/scrollStore";
import { useSceneLoadStore } from "@/stores/sceneLoadStore";
import { useMouseParallax } from "@/hooks/useMouseParallax";
import { ACT_VIEWPORT_PROFILES } from "../viewportProfiles";
import { tupleToVector3 } from "@/lib/scene";

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

  const curves = useMemo(() => {
    return ACT_VIEWPORT_PROFILES.map((profile) => ({
      posCurve: new THREE.CatmullRomCurve3(
        profile.cameraPath.positions.map((point) => tupleToVector3(point))
      ),
      lookCurve: new THREE.CatmullRomCurve3(
        profile.cameraPath.lookAts.map((point) => tupleToVector3(point))
      ),
      fovs: profile.cameraPath.fovs,
    }));
  }, []);

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

    const { activeAct, actProgress } = useScrollStore.getState();
    const startupState = useSceneLoadStore.getState();
    const act = curves[activeAct];
    if (!act) return;

    const t = THREE.MathUtils.clamp(actProgress, 0, 1);
    let targetFov = act.fovs[0];
    let allowParallax = true;

    if (activeAct === 0 && !startupSequenceComplete.current) {
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
      act.posCurve.getPoint(t, targetPos.current);
      act.lookCurve.getPoint(t, targetLookAt.current);

      const fovIndex = Math.min(
        Math.floor(t * (act.fovs.length - 1)),
        act.fovs.length - 2
      );
      const fovT = t * (act.fovs.length - 1) - fovIndex;
      targetFov = THREE.MathUtils.lerp(
        act.fovs[fovIndex],
        act.fovs[fovIndex + 1],
        fovT
      );
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
