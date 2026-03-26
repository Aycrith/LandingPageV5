---
description: "Resume project development from current state. Use when: returning after a break, restarting a session, asking 'what next?', or needing doc-informed next steps for LandingPageV5."
---

# Resume Development (Docs + Current Status)

You are resuming development for this project.

## Inputs

- **Goal (optional):** ${input:goal:If you already know today’s goal, write it here}
- **Focus area (optional):** ${input:focusArea:Which part should be prioritized (e.g., canvas, dom, tests, perf)?}
- **Constraints (optional):** ${input:constraints:Any hard constraints (timebox, no refactors, perf target, etc.)}

If inputs are empty, infer from repository docs + current code/test status.

## Required Workflow

1. **Review project guidance first**
   - Read `AGENTS.md` and any linked workflow docs.
   - Prioritize architecture guidance in `docs/EVOLUTION_STRATEGY.md`.
   - Check relevant QA/perf docs when applicable (`docs/SOCIAL_PREVIEW_QA.md`, `WebGL_Performance_Report.md`, `test-reports/`).

2. **Assess current implementation status**
   - Identify what is already implemented in the target area.
   - Check open issues from the current workspace state (failing tests, lint/build errors, TODO markers, incomplete flows).
   - Distinguish **confirmed state** vs **assumptions**.

3. **Produce a restart brief**
   - 5-10 bullet snapshot of where the project stands.
   - Top risks/blockers (if any).
   - What should be done next and why.

4. **Create an execution plan before coding**
   - Provide a numbered, atomic checklist (small, testable steps).
   - Include file paths for each step.
   - Include validation after each phase (lint/tests/build or equivalent).

5. **Resume implementation immediately**
   - Start at step 1.
   - Keep changes scoped.
   - Re-validate after edits.
   - Report progress in concise deltas.

## Output Format

Return in this order:

1. **Current Status Snapshot**
2. **Recommended Next Goal** (or confirm provided goal)
3. **Step-by-step Plan** (numbered, atomic)
4. **Immediate Action Started** (what you are doing now)
5. **Validation Results** (as soon as commands/checks run)

## Quality Bar

- Prefer project-native patterns over introducing new abstractions.
- Keep 3D runtime logic in `src/canvas/`, DOM/UI in `src/dom/`, shared coordination in `src/stores/`.
- Respect runtime safety conventions (`safeMode`, capability fallback behavior, WebGL context cleanup).
- Avoid unrelated refactors while resuming.
