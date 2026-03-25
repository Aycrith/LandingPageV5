import * as THREE from "three";
import type { ForceContext, ForceField, ForceSample } from "./ForceRegistry";

interface InteractionForceConfig {
  strength: number;
  radius: number;
  worldScaleX: number;
  worldScaleY: number;
}

const DEFAULT_CONFIG: InteractionForceConfig = {
  strength: 5,
  radius: 40,
  worldScaleX: 8,
  worldScaleY: 5,
};

export class InteractionForce implements ForceField {
  private readonly config: InteractionForceConfig;

  constructor(config?: Partial<InteractionForceConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  apply(sample: ForceSample, context: ForceContext): void {
    const worldX = context.pointerX * this.config.worldScaleX + context.tiltX * 2.4;
    const worldY = context.pointerY * this.config.worldScaleY + context.tiltY * 2.4;

    sample.gravityWellPos.set(worldX, worldY, 0);
    sample.gravityWellRadius = this.config.radius;

    const pointerMagnitude = Math.min(
      1,
      Math.sqrt(context.pointerX * context.pointerX + context.pointerY * context.pointerY)
    );
    const tiltMagnitude = Math.min(
      1,
      Math.sqrt(context.tiltX * context.tiltX + context.tiltY * context.tiltY)
    );

    const influence = THREE.MathUtils.clamp(
      0.35 + pointerMagnitude * 0.5 + tiltMagnitude * 0.35,
      0.25,
      1.4
    );

    sample.gravityWellStrength += this.config.strength * influence;
    sample.turbulenceGain += tiltMagnitude * 0.2;
    sample.flockingInfluence += pointerMagnitude * 0.3;
  }
}
