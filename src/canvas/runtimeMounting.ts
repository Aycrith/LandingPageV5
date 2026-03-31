export function nextActIndex(activeAct: number, totalActs: number) {
  return (activeAct + 1) % totalActs;
}

export function resolveMountedActs({
  activeAct,
  totalActs,
  warmupActIndex,
  warmupReady,
  rebirthBlend = 0,
  lookahead = 2,
}: {
  activeAct: number;
  totalActs: number;
  warmupActIndex: number | null;
  warmupReady: boolean;
  rebirthBlend?: number;
  lookahead?: number;
}): number[] {
  const mountedActs = new Set<number>([activeAct]);

  if (warmupReady) {
    let currentAct = activeAct;
    for (let step = 0; step < lookahead; step += 1) {
      currentAct = nextActIndex(currentAct, totalActs);
      mountedActs.add(currentAct);
    }
  }

  if (!warmupReady && warmupActIndex != null) {
    mountedActs.add(warmupActIndex);
  }

  if (activeAct === totalActs - 1 && (warmupReady || rebirthBlend > 0.01)) {
    mountedActs.add(0);
  }

  return Array.from(mountedActs).sort((a, b) => a - b);
}
