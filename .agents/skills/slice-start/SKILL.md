---
name: slice-start
description: Start a Big Calendar implementation slice (S0–S11). Use when the maintainer approves starting a slice. Never use it to start a slice on your own.
---

# Slice start

## Preconditions (stop if any fails)

- The previous slice is approved (merged), and so are P0–P5 for S0.
- The maintainer has said to start this slice.
- Every open item this slice depends on is resolved (`docs/spec/roadmap.md`, open items register).

## Steps

1. Branch off an up-to-date `main`: `slice/s<N>-<short-name>` (for example `slice/s1-day-grid`).
2. Read the slice's row in `docs/spec/roadmap.md` (scope and exit criteria) and the standard gates (`docs/checklists/slice-gates.md`).
3. Read the specs for the slice's scope, and the P3/P5 sections that apply.
4. **Write the slice spec**: what this slice builds that P3 and P5 don't already pin down, plus its task list (small, independently committable tasks, each with its code, tests and docs). List every question you find. Put it in `docs/spec/slices/s<N>.md`.
5. **Kickoff gate.** Give the slice spec and questions to the maintainer. Record each answer with the `decide` skill. Don't start coding until the slice spec is approved (rule 7).
6. Update `memory/PROGRESS.md`: the slice, its branch, the task list and the Next step.
7. Work through the tasks. Each one: code + tests + docs in one commit (rule 8), `spec-check` before committing, push often.
