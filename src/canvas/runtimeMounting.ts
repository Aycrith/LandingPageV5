export function nextActIndex(activeAct: number, totalActs: number) {
  return (activeAct + 1) % totalActs;
}

export function resolveMountedActs({
  activeAct,
  totalActs,
  warmupActIndex,
  warmupReady,
  rebirthBlend = 0,
}: {
  activeAct: number;
  totalActs: number;
  warmupActIndex: number | null;
  warmupReady: boolean;
  rebirthBlend?: number;
}): number[] {
  const mountedActs = new Set<number>([
    activeAct,
    nextActIndex(activeAct, totalActs),
  ]);

  if (!warmupReady && warmupActIndex != null) {
    mountedActs.add(warmupActIndex);
  }

  if (activeAct === totalActs - 1 && rebirthBlend > 0.01) {
    mountedActs.add(0);
  }

  return Array.from(mountedActs).sort((a, b) => a - b);
}
