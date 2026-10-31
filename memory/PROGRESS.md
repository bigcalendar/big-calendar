# Progress

## Next step

**P5 in progress** (types and public API spec), started 2026-10-30. Continue with the first unchecked task below. Exit criteria: `docs/spec/roadmap.md`, row P5. Draft: `plan/P5-API.md`. Types: `prototypes/p5-types/` (npm, outside the workspace; `npm run check` runs `tsc`).

Kickoff answers (2026-10-30, maintainer): the types are real `.ts` files type-checked in the prototype, with must-compile and must-fail usage files; the review is in four parts, each part's questions answered before the next starts, then one P5 approval; the RBC parity matrix covers react-big-calendar 1.20.0, read from its installed source. Dependencies authorized for the prototype only: `typescript`, `@types/react`, `react-big-calendar`, `@types/react-big-calendar`.

### P5 tasks

1. [x] Kickoff answers; prototype scaffold.
2. [x] **Part 1:** canonical data types (events, background events, resources, sources, processed events), `createCalendar` options, registered features (D-52), state slices and atoms (D-53), store, actions and signals, permission cascade, `temporalReady` on the kernel side. Answered 2026-10-31: every recommendation accepted (draft, "Answers, part 1"); recorded in the decision log with the other parts at task 6.
3. [ ] **Part 2:** machine contract (D-90), prop-getter descriptors and `mergeProps` (D-72), effects, typed drafts, `Change`, callback names and payloads (D-33), live constraints. Stop for answers.
4. [ ] **Part 3:** React binding (hooks, `normalize`, waiting for `temporalReady`), `react-ui` slots, part manifest format, `formats` slots and `messages` keys (D-40). Stop for answers.
5. [ ] **Part 4:** RBC 1.20.0 prop-by-prop parity matrix and the `components` → slot mapping table. Stop for answers.
6. [ ] All answers recorded as a decision; stop for P5 approval.

Open for the maintainer (not blocking): post the comment draft for temporal-polyfill#121 at the end of `prototypes/p4-bench/temporal/UPSTREAM-ISSUES.md` (D-93).

## Before S1 starts

- **NVDA + Firefox run** of the P3 prototype (D-91): `node prototypes/p3-vanilla/serve.mjs`, then `prototypes/p3-vanilla/SCREEN-READER-SCRIPT.md`. The maintainer has no Windows machine yet (2026-10-28). It must confirm the two "NVDA check" items in `docs/spec/accessibility.md` (sections 2.6 and 4.3). Any finding is fixed through a new decision.

## Where things stand (2026-10-30)

- **P4 approved** 2026-10-30 (D-92 answers, D-93 approval): results in `docs/spec/date-engine.md` (`temporal-polyfill`, epoch-BigInt instant ordering, phone tracking), `reactivity.md` (`@preact/signals-core`), `interaction-accessibility.md` (own DnD code on native DnD; O-5 resolved), `support-matrix.md` and `docs/standards/testing.md` (harness). Record: `plan/P4-BENCHMARKS.md`; evidence in `prototypes/p4-bench/` (run `npm install` there first; same for `prototypes/p3-vanilla/o6/`). Upstream: temporal-polyfill#123 filed, #121 already open.
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
