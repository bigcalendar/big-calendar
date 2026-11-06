# Progress

## Next step

**S0 in progress** (foundations) on `slice/s0-foundations`. Slice spec approved 2026-11-02 (D-97): `docs/spec/slices/s0.md`, whose task list has the detail. Continue with the first unchecked task. Archive and reset done (D-96; PR #3 merged). Attempt 1's `release.yml` and `docs.yml` workflows are disabled in GitHub; the new workflows use other file names.

### S0 tasks

1. [x] Remove attempt 1
2. [x] Workspace
3. [x] Git hooks
4. [x] Lint
5. [x] Package skeletons
6. [x] Build proofs
7. [x] Type checks
8. [x] Tests (Playwright end-to-end config moves to task 11, with the Storybook shell it tests)
9. [x] Size and binding budgets
10. [x] Benchmark harness
11. [x] Storybook shell (with the Playwright browser suite)
12. [ ] Bundler and runner smoke tests
13. [ ] CI
14. [ ] Nx Release configuration (dry run only)
15. [ ] Agent setup follow-ups
16. [ ] Slice finish (skill `slice-finish`)

## Before S1 starts

- **NVDA + Firefox run** of the P3 prototype (D-91): `node prototypes/p3-vanilla/serve.mjs`, then `prototypes/p3-vanilla/SCREEN-READER-SCRIPT.md`. The maintainer has no Windows machine yet (2026-10-28). It must confirm the two "NVDA check" items in `docs/spec/accessibility.md` (sections 2.6 and 4.3). Any finding is fixed through a new decision.

## Where things stand (2026-11-02)

- **P5 approved** 2026-11-02 (D-94 answers, D-95 approval): `docs/spec/api.md` (types and public API) and `docs/spec/rbc-parity.md` (RBC 1.20.0 map); `plan/P5-API.md` is the review record. Reference types in `prototypes/p5-types/` (`npm run check`: 26 must-fail cases). Feature-definition types are public and stable from 1.0, with the machine contract.
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
