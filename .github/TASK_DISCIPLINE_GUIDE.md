# Task Discipline System — Complete Integration Guide

## What Is This?

A **three-layer system** that prevents AI agents from drifting during coding tasks:

1. **Structured planning** — Every task has detailed, numbered checklist before coding
2. **Anchor loops** — Agents verify alignment before every tool call
3. **Drift detection** — Automatic recovery when agents drift off-scope

---

## The Three Layers

### Layer 1: Task Discipline Instructions (Auto-Applied)
**File:** `.github/TASK_DISCIPLINE.instructions.md`

- Applied automatically to ALL files in workspace
- Enforces pre-work validation (plan load, entry point clarity, environment check)
- Defines anchor loop pattern (check → execute → validate)
- Provides drift detection signals and recovery steps
- Institutes tool usage discipline

**How it loads:** Automatically included for every workspace file.

### Layer 2: Task Planning Instructions (On-Demand)
**File:** `.github/instructions/task-planning.instructions.md`

- Invoked when starting new features/bug fixes/refactoring
- Teaches agents to generate structured task plans
- Enforces 3-10 atomic steps with file paths and line ranges
- Includes acceptance criteria and checkpoints

**How to use:**
```
User: "I need to add feature X. Here's the goal and state."

Agent: [Loads task-planning.instructions.md] → Generates Step 1...Step N plan
```

### Layer 3: Task Anchor Prompt (Pre-Execution)
**File:** `.github/TASK_ANCHOR.prompt.md`

- Quick validation checklist before ANY coding
- Confirms plan exists, entry point clear, environment ready
- Catches drift immediately with recovery instructions

**How to use:**
```
User: "/TASK_ANCHOR"

Agent: [Validates] → Confirms all boxes green OR lists what needs fixing
```

---

## Typical Workflow

### Session 1: Planning (30 min)

```
1. User: "I want to implement feature X. Current state is Y, criteria are Z."

2. Agent: [Loads task-planning.instructions.md]
   → Generates detailed plan with 7 steps
   → Saves to /memories/session/current-task.md

3. User: ✅ "Approved!"

4. Agent: "Ready. First step opens X file at line Y."
```

### Session 2: Execution (45 min, next day)

```
1. User: "/TASK_ANCHOR"

2. Agent: [Loads TASK_ANCHOR.prompt.md]
   → Validates: ✅ Plan exists, ✅ Position clear, ✅ Environment ready
   → Confirms: "Resuming Step 3 of 7..."

3. Agent: [Anchor loop]
   - Opens file, makes ONE focused change
   - Runs: npm run lint
   - Updates session progress
   - Confirms: "✅ Step 3 complete. Moving to Step 4..."

4. Repeats until done, all tests green → Commit
```

---

## Commands & Prompts

### For Initial Planning

```
"I'm building [FEATURE]. Current: [STATE]. 
Acceptance: [CRITERIA]. 
Generate detailed task plan with clear entry points."
```

### For Pre-Execution Validation

```
"/TASK_ANCHOR"
```

Or manually:

```
Confirm my current task plan, position, and exact next action.
```

### For Drift Recovery

```
I think I've drifted. Show me goal and scope again. 
What should I focus on right now?
```

---

## Session Memory (Under /memories/session/)

### current-task.md (Created after planning)

```markdown
# Current Task: [FEATURE]

## Goal
[One sentence]

## Success Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Entry Point
- File: src/feature/File.tsx
- Line: L45-60
- First action: Add type definition

## Checklist
- [ ] Step 1: Create types (File1.ts, L1-20)
- [ ] Step 2: Add store (stores/File.ts)
- [ ] Step 3: Wire component (File2.tsx, L100-120)
- ...
```

### progress.md (Updated after each phase)

```markdown
# Session Progress

**Session:** 2/26 — Feature X
**Total steps:** 7
**Current step:** 3 of 7 (43% complete)

## Completed ✅
- [2:15pm] Step 1: Types → npm lint ✓
- [2:22pm] Step 2: Store → imports work ✓

## In Progress 🔄
- Step 3: Connect to system
- Blockders: None
- Est. done: 2:35pm

## Next
- [TODO] Step 4: UI
- [TODO] Step 5: Tests
- [TODO] Step 6: Final QA
```

---

## File Structure

```
.github/
├── TASK_DISCIPLINE.instructions.md     ← Always-on
├── TASK_ANCHOR.prompt.md               ← Pre-execution validation
└── instructions/
    └── task-planning.instructions.md   ← Generate detailed plans

/memories/session/
├── current-task.md                     ← Active task plan
└── progress.md                         ← Execution progress
```

---

## Drift Prevention Checklist

Before making ANY code change:

- ✅ Am I on step [N] of [TOTAL]?
- ✅ Am I editing file [LISTED_IN_SCOPE]?
- ✅ Does this change move toward [MILESTONE]?
- ✅ Is this step [ATOMIC] and [TESTABLE]?
- ✅ Have I validated? (npm run lint)

If **any** answer is NO → STOP and ask for clarification.

---

## Key Patterns  

### ✅ DOs

- Create 3-10 step plans
- Put file paths and line ranges in EVERY step
- Validate after EVERY atomic change
- Update progress.md after each phase
- Ask user for approval before major changes
- Reference plan on every tool invocation

### ❌ DON'Ts

- Skip planning for "small" tasks
- Make changes without knowing entry point
- Refactor unrelated code "while you're at it"
- Open files outside SCOPE section
- Make >2 concurrent changes
- Work without explicit user ✅ approval

---

## Emergency Drift Reset

If an agent has completely lost focus:

```
Stop. Reset plan:
1. What is the original goal (one sentence)?
2. What files are in scope?
3. What step are we on now?
4. Show me the exact next action.

Then proceed step-by-step with explicit validation.
```

This forces re-anchoring.

---

## For Teams

If multiple agents work on same task:

1. One person creates task plan (using task-planning.instructions.md)
2. All agents reference same /memories/session/current-task.md
3. Each agent updates /memories/session/progress.md after their phase
4. Everyone uses /TASK_ANCHOR before resuming

Ensures alignment.

---

## Summary: What You Get

| Before | After |
|--------|-------|
| Agents drift into tangential work | Agents locked to 3-10 step checklist |
| "Step 1 is... opening a file?" | "Step 1 opens [FILE] at [L123-L145]" |
| No recovery from scope creep | Automatic drift detection + recovery |
| Vague success ("make better") | Explicit checkboxes (linter, tests, review) |
| Re-discover plan each session | One /memories/session/current-task.md forever |
| Hours of exploration | Clear entry → predictable 30-45min execution |

