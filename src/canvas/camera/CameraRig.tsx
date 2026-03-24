"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useScrollStore } from "@/stores/scrollStore";
import { useMouseParallax } from "@/hooks/useMouseParallax";

// Camera waypoints per act: [position, lookAt, fov]
const ACT_CAMERAS: Array<{
  positions: THREE.Vector3[];
  lookAts: THREE.Vector3[];
  fovs: number[];
}> = [
  // Act 1: Emergence — tight on center, pull back
  {
    positions: [
      new THREE.Vector3(0, 0, 3),
      new THREE.Vector3(0, 0.5, 6),
      new THREE.Vector3(0, 1, 10),
    ],
    lookAts: [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
    ],
    fovs: [40, 45, 50],
  },
  // Act 2: Structure — orbital sweep
  {
    positions: [
      new THREE.Vector3(0, 1, 10),
      new THREE.Vector3(6, 2, 6),
      new THREE.Vector3(0, 3, 8),
    ],
    lookAts: [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
    ],
    fovs: [50, 48, 52],
  },
  // Act 3: Flow — slow drift
  {
    positions: [
      new THREE.Vector3(0, 3, 8),
      new THREE.Vector3(-2, 1, 7),
      new THREE.Vector3(0, 0, 9),
    ],
    lookAts: [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, -1, 0),
      new THREE.Vector3(0, 0, 0),
    ],
    fovs: [52, 55, 50],
  },
  // Act 4: Quantum — dynamic, FOV shifts
  {
    positions: [
      new THREE.Vector3(0, 0, 9),
      new THREE.Vector3(4, -2, 5),
      new THREE.Vector3(-3, 2, 7),
    ],
    lookAts: [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
    ],
    fovs: [50, 60, 45],
  },
  // Act 5: Convergence — slow push in
  {
    positions: [
      new THREE.Vector3(-3, 2, 7),
      new THREE.Vector3(0, 0.5, 5),
      new THREE.Vector3(0, 0, 2),
    ],
    lookAts: [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
    ],
    fovs: [45, 42, 38],
  },
];

export function CameraRig() {
  const { camera } = useThree();
  const mouse = useMouseParallax();
  const targetPos = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());
  const currentPos = useRef(new THREE.Vector3(0, 0, 8));
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));

  const curves = useMemo(() => {
    return ACT_CAMERAS.map((act) => ({
      posCurve: new THREE.CatmullRomCurve3(act.positions),
      lookCurve: new THREE.CatmullRomCurve3(act.lookAts),
      fovs: act.fovs,
    }));
  }, []);

  useFrame((_, delta) => {
    const { activeAct, actProgress } = useScrollStore.getState();
    const act = curves[activeAct];
    if (!act) return;

    const t = Math.max(0, Math.min(1, actProgress));

    // Get target from spline
    act.posCurve.getPoint(t, targetPos.current);
    act.lookCurve.getPoint(t, targetLookAt.current);

    // Add mouse parallax offset (subtle)
    targetPos.current.x += mouse.current.x * 0.3;
    targetPos.current.y += mouse.current.y * 0.15;

    // Smooth interpolation
    const lerpSpeed = 1 - Math.pow(0.001, delta);
    currentPos.current.lerp(targetPos.current, lerpSpeed);
    currentLookAt.current.lerp(targetLookAt.current, lerpSpeed);

    camera.position.copy(currentPos.current);
    camera.lookAt(currentLookAt.current);

    // FOV interpolation
    const perspCam = camera as THREE.PerspectiveCamera;
    const fovIndex = Math.min(
      Math.floor(t * (act.fovs.length - 1)),
      act.fovs.length - 2
    );
    const fovT = (t * (act.fovs.length - 1)) - fovIndex;
    const targetFov = THREE.MathUtils.lerp(
      act.fovs[fovIndex],
      act.fovs[fovIndex + 1],
      fovT
    );
    perspCam.fov = THREE.MathUtils.lerp(perspCam.fov, targetFov, lerpSpeed);
    perspCam.updateProjectionMatrix();
  });

  return null;
}
