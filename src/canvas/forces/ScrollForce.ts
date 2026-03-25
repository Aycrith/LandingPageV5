import * as THREE from "three";
import type { ForceContext, ForceField, ForceSample } from "./ForceRegistry";

interface ScrollForceConfig {
  windScale: number;
  turbulenceScale: number;
  lateralScale: number;
}

const DEFAULT_CONFIG: ScrollForceConfig = {
  windScale: 2,
  turbulenceScale: 0.3,
  lateralScale: 0.24,
};

export class ScrollForce implements ForceField {
  private readonly config: ScrollForceConfig;

  constructor(config?: Partial<ScrollForceConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  apply(sample: ForceSample, context: ForceContext): void {
    const velocity = context.scrollVelocity;
    const absVelocity = Math.abs(velocity);

    sample.wind.y += -velocity * this.config.windScale;
    sample.wind.x += context.pointerX * absVelocity * this.config.lateralScale;
    sample.turbulenceGain += absVelocity * this.config.turbulenceScale;

    // Approximate boids-like cohesion gain when scrolling quickly.
    sample.flockingInfluence += THREE.MathUtils.clamp(absVelocity * 0.08, 0, 1);
  }
}
