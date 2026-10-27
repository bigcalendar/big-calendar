# Workflow and execution rules

> **Normative.** Rules 1–8 are split verbatim from the approved plan (`plan/P1-PLAN.md` §3). Changing them needs a new entry in the [decision log](../decisions.md).

## Execution rules

1. **No inline decisions.** If a choice is not covered by a Locked item or an Open item's resolution ([open items](../spec/roadmap.md#open-items-register)), stop and ask the maintainer. Record the answer in the [decision log](../decisions.md) before continuing.
2. **Gates.** Each planning artifact (P1–P5) and each slice (S0–S11) ends with a maintainer review. Nothing in the next artifact or slice starts until the current one is approved.
3. **Within a slice, the implementing agent works autonomously** (D-45):
   - **Branching.** Each slice gets its own branch off `main` (for example `slice/s1-day-grid`). The agent commits and pushes often, then opens a pull request at the end of the slice. That PR is the review gate, and the maintainer merges it.
   - **Ask first,** in addition to rule 1: before adding any dependency the plan or P2–P5 doesn't name; before weakening or deleting a test or threshold to make the build pass; and before force-pushing, rebasing pushed commits, deleting branches, or doing anything outside the repo.
   - **Usage budget.** Work in task-sized steps. Near the usage limit, finish the current task, update `memory/PROGRESS.md`, commit, and stop until restarted.
   - **Sub-agents** are allowed for small, isolated, well-specified tasks (for example writing a conformance corpus). The main agent reviews their results.
   - **Checkpoints** go to repo memory: `memory/PROGRESS.md` and `memory/ERRORS.md`. Decisions go to `docs/decisions.md` (D-49; P1's rule 3 also listed `memory/DECISIONS.md`, which D-49 replaced).
4. **Conventional commits**, enforced by commitlint. Nx Release drives versioning, but **nothing is published to npm until 1.0**.
5. **1.0 ships when the maintainer says so.** No plan, slice or agent proposes a 1.0 cutoff.
6. **The binding budget is a hard rule** ([binding budget](../spec/architecture.md#the-binding-budget-hard-rule)). A behavior that seems to need framework code is a design problem. Raise it to the maintainer; do not work around the budget.
7. **Specs before code.** A slice may only implement behavior that has been specified in P3, P5 or a slice spec approved at the slice's kickoff.
8. **Docs ship with the code (D-65).** A task is done only when its code, tests and docs land together in the same commit:
   - **TSDoc** on every exported symbol, enforced by lint: what it does, its parameters and return value, an example where useful, and a link to its docs page. Internal code gets TSDoc wherever its behavior or reasons aren't obvious, checked in review.
   - **Docs-site pages** for the capability (how-to, reference and explanation as they apply).
   - **The tutorial grows slice by slice.** Each slice adds its steps, and its PR shows them working.

   Docs are a review tool. Reviewers read what something is meant to do next to the code that does it.

## Practical notes

These restate the rules above as day-to-day steps. They add nothing new.

- **Commits.** Conventional commit format (`feat(core): …`, `docs(spec): …`). Commit messages say _why_. Never skip hooks (`--no-verify`).
- **Planning artifacts** (P0–P5) are built on the `planning` branch and reviewed there.
- **Memory files.**
  - `memory/PROGRESS.md`: where things stand and the **Next step** section every session reads first. Keep it short; replace stale content rather than appending forever.
  - `memory/ERRORS.md`: approaches that failed and why, so nobody retries them. Never store decisions here.
- **Dependencies.** A dependency is "named" only if a spec, decision or approved planning artifact names it. Anything else is an ask-first.
- **Tool-specific files** (`CLAUDE.md`, `.claude/`) only point at tool-neutral content. Never put a rule only in a tool-specific file.
