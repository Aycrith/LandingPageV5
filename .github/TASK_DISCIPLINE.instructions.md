---
applyTo: "**"
---

# Task Discipline & Plan Adherence System

## BEFORE EVERY AGENT SESSION

**You must load, validate, and anchor to the current task plan.** Do not begin work until this checklist passes.

### Mandatory Pre-Work Validation

1. **Task Context** (REQUIRED)
   - [ ] Is there a `.taskplan.md` or structured task document in the session memory?
   - [ ] Does it define: GOAL, SCOPE, SUCCESS_CRITERIA, ENTRY_POINT?
   - [ ] If YES → Load it immediately. If NO → Ask user to provide a structured plan first.

2. **Entry Point Clarity** (REQUIRED)
   - [ ] Do you know EXACTLY the first file to open?  
   - [ ] Do you know EXACTLY the first code block to modify or create?
   - [ ] Do you have a numbered checklist of steps 1-N?
   - [ ] If uncertain on any → STOP and ask: "Please clarify the entry point. What file should I open first?"

---

## ANCHOR LOOP: ATOMIC FOCUS PATTERN

During execution, maintain this repeating anchor loop.

### Every Tool Call: Verify Progress

- Am I on step [N] moving toward [MILESTONE]?
- Does this change serve the SUCCESS_CRITERIA?
- Have I avoided scope creep into unplanned files?

### After Each Atomic Change

- [ ] Does this move toward the milestone?
- [ ] Is quality acceptable (lints, passes tests)?
- [ ] Update session memory with: COMPLETED_STEP

If drift is detected → STOP, re-read plan, refocus.

---

## Completion Protocol (MANDATORY)

Before ending any task:

- [ ] Ensure all checklist items are marked complete, blocked, or skipped with a reason.
- [ ] Send a brief final summary to the user.
- [ ] Trigger the completion signal/tool immediately after the summary.

Do not end a session after only a narrative response when a completion signal is required.

---

## DRIFT DETECTION & RECOVERY

🚨 **DRIFT SIGNALS:**
- Opening files outside SCOPE section
- Refactoring code "while you're at it"
- Making >2 concurrent changes
- Working >5 min without documenting progress
- More than 3 file edits without user confirmation

**RECOVERY:**
1. STOP immediately
2. Re-read GOAL and SCOPE from task plan
3. Close unrelated files
4. Ask: "Have I drifted? Focus back on [goal]?"
5. Resume from last checkpoint

---

## SESSION MEMORY FORMAT

Create `/memories/session/current-task.md` with:

**Goal:** One sentence  
**Scope:** Files included/excluded  
**Entry Point:** File + line range + first action
**Checklist:** 3-10 atomic steps with file paths  
**Milestones:** Numbered checkpoints  
**Progress Log:** What was completed, when, and next steps

