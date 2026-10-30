# Progress

## Next step

**P4 in progress** (benchmarks), started 2026-10-29. Continue with the first unchecked task below. Exit criteria: `docs/spec/roadmap.md`, row P4. Draft: `plan/P4-BENCHMARKS.md` (moves to the decision log, specs and testing standard on approval). Evidence: `prototypes/p4-bench/`.

The maintainer authorized (2026-10-29) adding whatever dependencies P4's checks need, in the prototype only, and removing what the evidence doesn't use once results are in.

### P4 tasks

1. [x] Draft and prototype scaffold (`prototypes/p4-bench/`, candidates installed with npm, outside the workspace).
2. [x] Temporal polyfill: sizes; correctness corpus against native Temporal in Chromium and Firefox; engine workload timings (Chromium 4×, WebKit and real Safari 26.6.2 with the polyfill).
3. [x] Numeric fast path: instant ordering with cached Temporal objects vs epoch numbers, inside the workload, against the budgets.
4. [x] Signals: facade (`State`, `Computed`, `Watcher`) over both libraries; sizes; creation, update and "only affected lanes" measurements.
5. [x] DnD (O-5): three engines checked with a mouse on all three engines and by touch on the maintainer's iPhone (2026-10-30); iPhone `safari.html` timings recorded.
6. [x] Harness design for S0 (proposed, draft section 6).
7. [ ] All answers recorded as D-92. **Stopped for the maintainer's P4 review.** On approval: move results into the specs and testing standard with an approval decision, mark O-5 resolved, update the support matrix (Safari 27.0.1 has no native Temporal), then remove `node_modules` from `prototypes/p3-vanilla/o6/` and `prototypes/p4-bench/` (keep `package.json`). Upstream issue drafts await the maintainer: `prototypes/p4-bench/temporal/UPSTREAM-ISSUES.md`.

## Before S1 starts

- **NVDA + Firefox run** of the P3 prototype (D-91): `node prototypes/p3-vanilla/serve.mjs`, then `prototypes/p3-vanilla/SCREEN-READER-SCRIPT.md`. The maintainer has no Windows machine yet (2026-10-28). It must confirm the two "NVDA check" items in `docs/spec/accessibility.md` (sections 2.6 and 4.3). Any finding is fixed through a new decision.

## Where things stand (2026-10-29)

- **P3 approved** 2026-10-29 (D-89 answers, D-90 hand-written machines for O-6, D-91 approval): `docs/spec/accessibility.md`. Evidence in `prototypes/p3-vanilla/` (findings in spec section 13; O-6 comparison in `o6/RESULTS.md`). VoiceOver + Safari passed; NVDA deferred to before S1.
- **P2 approved** 2026-10-28 (D-87, D-88): `docs/spec/support-matrix.md`. Evidence in `prototypes/p2-top-level-await/`. D-87 amends D-32 (the `temporalReady` promise replaces top-level `await`).

- **P1 approved** 2026-10-27. `plan/P1-PLAN.md` is the frozen record.
- **P0 approved** 2026-10-28 (D-85, D-86). Built 2026-10-27:
  - `docs/spec/` (17 topic specs, split verbatim from P1, cross-references rewritten as links; index in `docs/spec/README.md`), including `roadmap.md` (P1 §14–§16);
  - `docs/decisions.md`: the single decision log, D-01 to D-84 in numeric order;
  - `docs/standards/` (8 files, including `workflow.md` with P1 §3 verbatim and `writing.md`), `docs/checklists/` (6 checklists);
  - `.agents/skills/` (8 skills) with `.claude/skills` symlinked to it; `.claude/agents/` (4 agents, Sonnet); `.claude/rules/` (6 path rules);
  - `scripts/agent-hooks/` (4 hooks + shared `lib.mjs`) wired in `.claude/settings.json`; `.mcp.json` (Playwright, Nx);
  - root `AGENTS.md` and `CLAUDE.md` (`@AGENTS.md`);
  - attempt-1 context removed: old root `CLAUDE.md`, all of old `memory/` (including `ADAPTER_STANDARDS.md`), and `plan/NEXT.md`.

## P0 review (2026-10-28)

All seven review items answered and recorded as **D-85**. Items 1–5 and 7 were approved as built. For item 6, the guard hook (`scripts/agent-hooks/guard-protected.mjs`) now:

- denies edits only to `.git/`, `node_modules/` and `pnpm-lock.yaml`;
- asks before force-push, deleting a branch, `reset --hard`, `git clean -f` and `--no-verify`;
- asks before a rebase only when it would rewrite commits already on a remote;
- asks before adding a dependency, by command or by a `package.json` edit that adds a non-`workspace:` entry.

## Deferred to S0 (by plan)

- `packages/*/AGENTS.md` and `CLAUDE.md`: the new packages don't exist yet; the `new-package` skill writes them.
- Verify whether Claude Code reads `.agents/skills` directly; if so, drop the `.claude/skills` symlink.
- Git hooks and CI backing the agent hooks (lint-staged, typecheck in PR, the decision-entry check on `docs/spec/` and `docs/decisions.md`).
- Product configs (ESLint, CI, compiler).

## Answers already given (don't re-ask)

- Push the `planning` branch: **yes**.
- The P1 review page's HTML is not kept in the repo.
- P0 removes the attempt-1 context files.
- After P0 approval, the order is P2 → P3 → P4 → P5 → S0, each approved individually.
