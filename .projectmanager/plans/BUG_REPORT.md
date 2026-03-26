# Bug Report & Improvement Analysis
_Generated: 2026-03-26_

## 🐛 Bugs & Issues
- 1. **[LOW]** `src/stores/scrollStore.ts`: The JSDoc comment says `/** Active act index 0-4 */` but `NUM_ACTS = 6`, so the valid range is actually `0-5`. This is a documentation bug that could mislead developers.
- 2. **[LOW]** `tests/viewport-audit-stability.spec.ts`: Imports `sampleHeap` from `./viewport-audit.helpers`, but the helpers preview does not export `sampleHeap` in its visible exports list (`ACT_SNAPSHOTS, FLAGSHIP_AUDIT_QUERY, unexpectedWarnings`). While it could exist further in the file, the explicit export list omits it — this may indicate a missing export or a build-time error.

## 🚀 Recommended Improvements
- 1. **[LOW]** `src/stores/cursorStore.ts`: Module-level mutable variables (`_lastX`, `_lastY`, `_lastTime`) will be shared across all consumers and persist across hot-reloads, which can cause stale velocity calculations after HMR. Consider moving this state into the store itself or into a ref-based pattern.
- 2. **[LOW]** `src/stores/cursorStore.ts`: Division by `window.innerWidth` / `window.innerHeight` could produce `Infinity` or `NaN` if the window dimensions are zero (e.g., minimized window on some platforms). A guard similar to the `0.0001` floors used in `src/lib/scene.ts` would be safer:
- 3. **[LOW]** `tests/webgl-telemetry-audit.spec.ts`: The `maxScroll` computation uses `Math.max(body.scrollHeight, documentElement.scrollHeight, documentElement.clientHeight) - window.innerHeight`. Including `clientHeight` in the max is unusual — `clientHeight` is the viewport height, so `maxScroll` could become 0 or negative if the page isn't scrollable. Typically only `scrollHeight` values are compared.
- 4. **[MEDIUM]** `src/lib/scene.ts`: `resolveDetailLod` — the combined `emphasis` value can exceed 1.0 (`coverageSignal` max 1.4 × 0.72 + `distanceSignal` max 1.0 × 0.58 = 1.588`). The thresholds (0.9, 0.42, 0.58) seem intentionally calibrated for this, but the lack of clamping or documentation on the intended range makes this fragile. Consider adding a comment documenting the expected range or clamping to `[0, 1]` if the over-1.0 behavior is unintentional.
- 5. **[LOW]** `src/stores/sceneLoadStore.ts`: `markStableFrameReady` returns `{}` (empty object) when already stable, which triggers a Zustand state update (new reference) even though nothing changed. This is functionally harmless but suboptimal — Zustand's `set` with an identical-looking empty object won't trigger re-renders, but returning `state` directly or using a guard outside `set` would be cleaner.

---
## Resolution Status

| Issue | Status | Notes |
|-------|--------|-------|
| Bug 1: 1. **[LOW]** `src/stores/scrollStore.ts`: The JSDo... | ⬜ TODO | |
| Bug 2: 2. **[LOW]** `tests/viewport-audit-stability.spec.... | ⬜ TODO | |
