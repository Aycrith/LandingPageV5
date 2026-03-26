# Task Template — Copy This For Your Next Task

Use this template every time you start a new task. Copy it into `/memories/session/current-task.md` and fill it out BEFORE agent starts coding.

---

## Task: [FEATURE NAME]

**Date Started:** [DATE]  
**Estimated Duration:** [30 min / 1 hour / half-day]  
**Status:** [ ] Planning | [ ] In Progress | [ ] Complete

---

## Goal

[ONE SENTENCE: What is the end state?]

Example: "Add viewport audit metrics to telemetry store and expose via audit endpoint"

---

## Current State

[2-3 sentences: What exists now that needs to change?]

Example: "Currently viewport fill ratio is calculated but not persisted. We have no way to track device capability distribution across users."

---

## Scope (What IS in this task)

- [ ] File/Directory 1: [reason]
- [ ] File/Directory 2: [reason]
- [ ] File/Directory 3: [reason]

Example:
- [ ] src/stores/viewportAuditStore.ts — Add GPU/device metrics
- [ ] src/lib/telemetry.ts — Wire audit data to telemetry
- [ ] tests/viewport-audit.spec.ts — Add test cases

---

## Out of Scope (What is NOT in this task)

- ❌ Refactor old stores (other task)
- ❌ Change audit UI display (separate feature)
- ❌ Performance optimization beyond scope (next phase)

---

## Success Criteria (Checkboxes)

- [ ] Viewport metrics stored in Zustand with types
- [ ] Metrics published to telemetry on every audit
- [ ] Tests verify metrics format matches API schema
- [ ] npm run lint passes
- [ ] npm run audit:viewport:stability passes
- [ ] No console errors during 3-minute session
- [ ] Code review approved

---

## Entry Point (Where Agent Starts)

**First file to open:** `src/stores/viewportAuditStore.ts`  
**Line range:** L45-60 (existing useEffect hook)  
**First action:** Add new TypeScript interface for device metrics

**Expected outcome after first step:**
```typescript
export interface DeviceMetrics {
  capability: 'high' | 'medium' | 'low';
  gpuBudget: number;
  viewport: { width: number; height: number };
  timestamp: number;
}
```

---

## Detailed Step Checklist

Use THIS format for steps. Keep each step 5-15 minutes.

### Phase 1: Type & Store Setup (Steps 1-2)

#### Step 1: Create type definitions
- **File:** src/stores/viewportAuditStore.ts
- **Line range:** L1-30 (top of file, before Zustand code)
- **Action:** Add `export interface DeviceMetrics { ... }` with 4 fields
- **Validation:** File compiles, no TS errors
- **Time est:** 8 min
- **Status:** [ ] Complete

#### Step 2: Add metrics to store state
- **File:** src/stores/viewportAuditStore.ts
- **Line range:** L60-80 (ViewportAuditState interface)
- **Action:** Add `deviceMetrics: DeviceMetrics[]` array field
- **Validation:** Store still compiles, imports work in Experience.tsx
- **Time est:** 5 min
- **Status:** [ ] Complete

### Phase 2: Populate Data (Steps 3-4)

#### Step 3: Capture metrics in ViewportAuditProbe
- **File:** src/canvas/ViewportAuditProbe.tsx
- **Line range:** L110-135 (measurement function)
- **Action:** Calculate device capability, add to store action
- **Validation:** npm run lint passes, no console errors
- **Time est:** 12 min
- **Status:** [ ] Complete

#### Step 4: Wire to telemetry
- **File:** src/lib/telemetry.ts
- **Line range:** L80-100 (metric collection)
- **Action:** Subscribe to store changes, batch metrics every 5 events
- **Validation:** Metrics reported to console in dev mode
- **Time est:** 10 min
- **Status:** [ ] Complete

### Phase 3: Testing & Validation (Step 5)

#### Step 5: Add test case
- **File:** tests/viewport-audit.spec.ts
- **Line range:** Create new test block after line 200
- **Action:** Assert metrics captured and published correctly
- **Validation:** `npm run test` passes (or audit spec if no unit tests)
- **Time est:** 8 min
- **Status:** [ ] Complete

---

## Milestones

- **Milestone 1** (after step 2): Types defined, store compiles ✓
- **Milestone 2** (after step 4): Metrics flow end-to-end ✓
- **Milestone 3** (after step 5): Tests passing, linter green ✓

---

## Progress Log

Fill this IN AS YOU GO (agent updates after each step):

| Time | Step | What Completed | Status | Notes |
|------|------|----------------|--------|-------|
| 2:15 | 1 | Type definitions | ✅ | Took 10 min, extended DeviceMetrics with extra field |
| 2:27 | 2 | Store state update | ✅ | Added deviceMetrics array, no imports needed |
| 2:40 | 3 | ViewportAuditProbe capture | 🔄 | In progress, debugging capability detection |
| - | 4 | Telemetry wiring | [ ] | Not started |
| - | 5 | Test case | [ ] | Not started |

---

## Known Blockers / Questions

- [ ] No blockers yet
- [ ] Q: Is deviceMetrics array or object? → A: Array for history / resets each frame
- [ ] Q: What fields in DeviceMetrics? → A: capability, gpuBudget, viewport, timestamp

---

## Final Validation (Before Commit)

- [ ] npm run lint ✓
- [ ] npm run dev starts without errors ✓
- [ ] Console clean (no warnings on errors for this feature) ✓
- [ ] All test cases passing ✓
- [ ] Code review ready (will request review)
- [ ] Documentation updated (if any new APIs)
- [ ] Git commit message written

---

## Notes

[Space for blockers, decisions, learnings discovered during work]

Example:
- Discovered ViewportAuditProbe fires before scene loads, had to defer metric capture
- deviceMetrics should reset each frame for telemetry accuracy

---

**Ready to start?** Agent loads this plan, validates entry point, confirms all boxes above are green, then begins Step 1.

