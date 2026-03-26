---
applyTo: "**.md"
description: "Use when creating a detailed project plan, task breakdown, or implementation roadmap that will guide coding agents through focused, drift-free execution."
---

# Structured Task Plan Generator

## Purpose

Generate a detailed, numbered task plan that prevents agent drift and provides explicit entry points.

## Input Format

Provide:
1. **High-level goal** (one sentence)
2. **Current state** (2-3 sentences)  
3. **Acceptance criteria** (3-5 bullets)
4. **Rough scope** (what files/systems are involved?)

Example:
```
Goal: Add adaptive LOD system to viewport

Current state: 
All models load at full detail. This causes frame drops on mobile.

Acceptance criteria:
- [ ] DetailLod store tracks viewport and GPU budget
- [ ] SeamlessWorld scales hero mesh LOD based on camera distance
- [ ] Fallback geometry loads for streamlined tier
- [ ] No frame spikes during LOD transitions

Scope: src/stores/, src/canvas/SeamlessWorld.tsx, public/models/*/
```

## Output Format (REQUIRED)

Agent generates comprehensive plan with sections:

### 1. Executive Summary
- GOAL (single sentence)
- SUCCESS_CRITERIA (3-6 checkboxes)
- ESTIMATED_TIME (total + phase breakdown)

### 2. Architecture Context
- Key files involved
- Data flow (ASCII)
- Dependencies and constraints

### 3. Detailed Step List

Each STEP is:
- **Atomic** (5-15 minutes)
- **Testable** (can run linter)
- **Clear entry point** (file + line range)

Format:
```
## Phase 1: Foundation (Steps 1-3)

### Step 1: Create DetailLod store type
- File: src/stores/detailLodStore.ts (new file)
- Action: Create Zustand store with DetailLodState interface
- Validation: npm run lint passes
- Time: ~10 min

### Step 2: Export store
- File: src/stores/index.ts
- Action: Add export line
- Validation: Import works without errors
- Time: ~2 min

### Step 3: Initialize in Experience
- File: src/canvas/Experience.tsx
- Line range: L45-65
- Action: Call useDetailLodStore() in useEffect
- Validation: No console errors
- Time: ~8 min
```

### 4. Success Checkpoints
- **Checkpoint 1** (after phase 1): [concrete deliverable]
- **Checkpoint 2** (after phase 2): [concrete deliverable]  
- **Checkpoint 3**: All tests passing, build clean

### 5. Known Constraints
- Don't refactor unrelated code
- Keep WebGL resource cleanup
- Maintain React hooks lint rules
- No breaking changes to existing APIs

### 6. Exit Condition
What defines "DONE"?
- All steps completed
- Linter passes
- Tests passing  
- No new console errors
- Code review approved

---

## Agent Responsibilities

After generating plan:

1. **Save to session memory** as `/memories/session/current-task.md`
2. **Validate with user** — ask: "Does this look complete?"
3. **Get approval** — get explicit ✅ before execution
4. **Anchor to it** — reference plan on every tool invocation
5. **Report progress** — update session memory after each phase

---

## Anti-Patterns

❌ "Implement entire feature" (too big)
✅ Break into 5-10 smaller steps

❌ "Edit the component" (vague)
✅ Give exact file paths and line ranges

❌ Skip testing/validation
✅ Include "npm run lint passes" on every step

❌ Create plans without user approval
✅ Always ask "Ready to proceed?" before start

