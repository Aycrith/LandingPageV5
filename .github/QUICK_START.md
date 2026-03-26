# 🎯 Task Discipline System — Quick Start

## You now have 3 powerful tools to keep agents on-task and drift-free:

---

## 1️⃣ TASK DISCIPLINE INSTRUCTIONS (Auto-Applied)

**File:** `.github/TASK_DISCIPLINE.instructions.md`

This is ALWAYS active for your workspace. It automatically enforces:
- ✅ Pre-work validation before any coding
- ✅ Anchor loop (check position before every tool call)
- ✅ Drift detection with automatic recovery
- ✅ Clear tool usage discipline

**You don't need to invoke it.** It's included automatically.

---

## 2️⃣ TASK PLANNING GENERATOR (On-Demand)

**File:** `.github/instructions/task-planning.instructions.md`

Use this when starting ANY new task. It teaches agents to generate detailed, step-by-step plans.

### Example Usage:

```
User: "I need to add a loading indicator to the canvas.

Current state: There's no visual feedback during scene load.
Acceptance criteria: Spinner shows during detail load, hides when complete.
Scope: src/dom/LoadingScreen.tsx, src/stores/sceneLoadStore.ts

Generate a detailed task plan with clear entry points."
```

**Agent will generate:**
- GOAL (one sentence)
- SUCCESS_CRITERIA (checkboxes)
- 5-10 atomic steps with exact file paths and line numbers
- Saves to `/memories/session/current-task.md`

Accept it with ✅ and agent begins work.

---

## 3️⃣ TASK ANCHOR PROMPT (Pre-Execution)

**File:** `.github/TASK_ANCHOR.prompt.md`

Use this anytime you resume or feel uncertain about progress.

### Example Usage:

```
User: "/TASK_ANCHOR"
```

**Agent validates:**
- ✅ Plan exists and is loaded
- ✅ Entry point is clear
- ✅ Current step and next action explicit
- ✅ Environment ready (lint, dev server, etc.)

If **all boxes green** → Work continues.  
If **any box red** → Lists blockers and asks what to fix.

---

## Typical Session Flow

### Session 1 (30 min) — Planning Phase

```
1. You: "I'm building feature X..."

2. Agent: [Auto-loads task-planning.instructions]
   → Generates 7-step detailed plan
   → Saves to /memories/session/current-task.md

3. You: ✅ "Looks good, go ahead"

4. Agent: "Ready. Step 1 opens src/file.ts at L45-60..."
```

### Session 2 (45 min) — Execution Phase  

```
1. You: "/TASK_ANCHOR"

2. Agent: [Validates plan, position, environment]
   → "Resuming Step 3 of 7..."

3. Agent: [Anchor loop repeats]
   - Opens file, makes ONE focused change
   - Runs: npm run lint  
   - Updates /memories/session/progress.md
   - Continues to Step 4...

4. All steps done → Linter green → Tests pass → Done
```

---

## ⚡ Key Commands

| Command | What It Does |
|---------|-------------|
| **"I need to build [feature]..."** | Generates detailed task plan with 5-10 steps |
| **"/TASK_ANCHOR"** | Validates current task, position, and next action |
| **"Have I drifted?"** | Agent stops, re-reads goal, confirms refocus |
| **"Reset plan: goal is..."** | Emergency re-anchor if agent is confused |

---

## 📋 Session Memory Structure

These create automatically or you can set up manually:

### `/memories/session/current-task.md`
Contains the active task plan:
- Goal (one sentence)
- Scope (what's in/out)
- Entry point (file + line range + first action)
- Checklist (3-10 steps with file paths)
- Milestones
- Progress log

### `/memories/session/progress.md`
Updated after each phase:
- Started time
- Current step (X of N)
- Completed steps ✅
- Current step status
- Next steps [TODO]
- Quality checkpoints

---

## 🛡️ Drift Prevention (Auto-Engaged)

Agents automatically STOP if they detect:

- ❌ Opening files outside SCOPE section
- ❌ Refactoring code "while at it"
- ❌ Making >2 changes without validation
- ❌ >5 minutes without documenting progress
- ❌ Making decisions not in SUCCESS_CRITERIA

When triggered → Agent asks: "Have I drifted? Focus back on [goal]?"

---

## 📚 Full Documentation

For detailed explanations, see:
- **`.github/TASK_DISCIPLINE_GUIDE.md`** — Complete integration guide (patterns, examples, team workflows)
- **`.github/TASK_DISCIPLINE.instructions.md`** — Full instruction file (technical details)
- **`.github/instructions/task-planning.instructions.md`** — Plan generation format (input/output specs)
- **`.github/TASK_ANCHOR.prompt.md`** — Validation checklist (detailed fields)

---

## 🚀 Start Right Now

### Try It:

1. Pick a task: "I want to add [feature X]"

2. Describe it:
   ```
   Goal: [One sentence]
   Current: [What exists now]
   Criteria: [How we know it's done]
   Files: [What's in scope]
   ```

3. Agent generates plan → You approve ✅ → Agent executes step-by-step

4. Each session starts with "/TASK_ANCHOR" to resume

---

## ✅ Expected Outcomes

| Metric | Before | After |
|--------|--------|-------|
| **Agent drift** | Frequent refactors, tangential work | Locked to plan, every change purposeful |
| **Task clarity** | "Hmm, what was I doing?" | Clear step 3-of-7 with exact next action |
| **Execution time** | Exploration → Hours | Clear entry → 30-45 min execution |
| **Success rate** | Vague goals → Re-done work | Explicit criteria → First-time-right |
| **Context switching** | Restart each session | One task file, seamless resume |

---

## 💡 Pro Tips

- Keep steps **under 15 minutes each** (more = likely to drift)
- **Always include line ranges** (L123-145, not just "the file")
- **Run `/TASK_ANCHOR` before resuming** any multi-session task
- **Update `/memories/session/progress.md` after each phase** so next session knows state
- **Keep scope tight** — narrow scope = better focus, faster completion

---

**You're now set up for focused, drift-free AI-driven development.** 🎯

Questions? Read `.github/TASK_DISCIPLINE_GUIDE.md` for full context.

