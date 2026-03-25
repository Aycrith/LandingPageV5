import * as THREE from "three";

export interface ForceContext {
  dt: number;
  scrollVelocity: number;
  pointerX: number;
  pointerY: number;
  tiltX: number;
  tiltY: number;
}

export interface ForceSample {
  wind: THREE.Vector3;
  gravityWellPos: THREE.Vector3;
  gravityWellStrength: number;
  gravityWellRadius: number;
  turbulenceGain: number;
  flockingInfluence: number;
}

export interface ForceField {
  apply(sample: ForceSample, context: ForceContext): void;
}

function resetSample(sample: ForceSample): ForceSample {
  sample.wind.set(0, 0, 0);
  sample.gravityWellPos.set(0, 0, 0);
  sample.gravityWellStrength = 0;
  sample.gravityWellRadius = 40;
  sample.turbulenceGain = 0;
  sample.flockingInfluence = 0;
  return sample;
}

export function createForceSample(): ForceSample {
  return resetSample({
    wind: new THREE.Vector3(),
    gravityWellPos: new THREE.Vector3(),
    gravityWellStrength: 0,
    gravityWellRadius: 40,
    turbulenceGain: 0,
    flockingInfluence: 0,
  });
}

export class ForceRegistry {
  private readonly fields: ForceField[] = [];

  register(field: ForceField): () => void {
    this.fields.push(field);
    return () => {
      const idx = this.fields.indexOf(field);
      if (idx >= 0) {
        this.fields.splice(idx, 1);
      }
    };
  }

  clear(): void {
    this.fields.length = 0;
  }

  evaluate(context: ForceContext, target?: ForceSample): ForceSample {
    const sample = resetSample(target ?? createForceSample());
    for (const field of this.fields) {
      field.apply(sample, context);
    }
    return sample;
  }
}
