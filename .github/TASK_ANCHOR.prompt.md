---
description: "TASK ANCHOR: Before executing ANY task, validate plan structure and confirm entry points. Use when: starting a coding session, resuming work after interruption, or feeling uncertain about next steps."
---

# Task Anchor Protocol

## Invoke When:
- ✋ Starting a new coding session
- ✋ Resuming after a context switch  
- ✋ Feeling uncertain about next steps
- ✋ Noticing scope creep or drift

## 📋 TASK ANCHOR VALIDATION

### Confirm Current Task Plan

**Is there an active task plan?**
- [ ] YES → Describe the GOAL, SCOPE, and entry point
- [ ] NO → I need you to generate a structured task plan first

**If YES, validate:**
- [ ] GOAL is clear (one sentence)
- [ ] SCOPE is explicit (files included/excluded)
- [ ] SUCCESS CRITERIA are numbered checkboxes  
- [ ] Entry point is explicit (file + line range + first action)
- [ ] Checklist has 3-10 atomic steps

---

### Confirm Current Position

**What step are we on?**
- [ ] Total steps: [N]
- [ ] Current step: [N of N]
- [ ] Current file: [path]
- [ ] Current status: Not started | In progress | Complete

**What is the EXACT next action?**
- [ ] File to open: [path]
- [ ] Line range: [L123-L145] (if applicable)
- [ ] Code to write/edit: [2-3 word summary]
- [ ] Expected outcome: [what changes should exist?]

---

### Confirm Environment

**Build/lint/test system ready?**
- [ ] npm run lint works
- [ ] npm run dev starts without errors
- [ ] Latest commit is clean
- [ ] No uncommitted changes except in task scope

---

### Final Confirmation

Only proceed if ALL boxes are green:

- [ ] Plan is loaded and validated
- [ ] Current position is explicit
- [ ] Next action is crystal clear
- [ ] No blockers exist
- [ ] Environment is ready
- [ ] User gives explicit ✅ approval

---

## If Drift is Detected

**STOP immediately if:**
- You're in files NOT listed in task SCOPE
- You're refactoring code "while you're at it"
- You're making >2 concurrent changes
- You've worked >5 min without progress on a step

**Recovery:**
1. Close all unrelated files
2. Re-read the plan GOAL and SUCCESS_CRITERIA
3. Ask: "Have I drifted? Which step should I focus on?"
4. Return to last completed step
5. Resume with explicit user confirmation

---

## One-Line Anchor Check

**Before EVERY tool invocation, confirm:**

> "Am I on step [N], editing [FILE], moving toward [MILESTONE]?"

If NO → Stop, re-read plan, refocus.

