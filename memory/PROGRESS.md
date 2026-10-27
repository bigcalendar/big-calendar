# Progress

## Next step

**Waiting for the maintainer's review of P0** (the agent context toolset) on the `planning` branch. Don't start P2 until P0 is approved.

When P0 is approved:

1. Record the approval in `docs/decisions.md` with the `decide` skill, including the maintainer's answer on each item under "Needs a P0 decision" below.
2. Remove the _(P0 proposal)_ markers from `docs/standards/` for the items approved (and delete the rejected ones).
3. Start **P2** (Baseline 2025 support matrix; exit criteria in `docs/spec/roadmap.md`). The order after P0 is P2 → P3 → P4 → P5 → S0, each approved individually.

## Where things stand (2026-10-27)

- **P1 approved** 2026-10-27. `plan/P1-PLAN.md` is the frozen record.
- **P0 built** 2026-10-27, in review:
  - `docs/spec/` (17 topic specs, split verbatim from P1, cross-references rewritten as links; index in `docs/spec/README.md`), including `roadmap.md` (P1 §14–§16);
  - `docs/decisions.md`: the single decision log, D-01 to D-84 in numeric order;
  - `docs/standards/` (8 files, including `workflow.md` with P1 §3 verbatim and `writing.md`), `docs/checklists/` (6 checklists);
  - `.agents/skills/` (8 skills) with `.claude/skills` symlinked to it; `.claude/agents/` (4 agents, Sonnet); `.claude/rules/` (6 path rules);
  - `scripts/agent-hooks/` (4 hooks + shared `lib.mjs`) wired in `.claude/settings.json`; `.mcp.json` (Playwright, Nx);
  - root `AGENTS.md` and `CLAUDE.md` (`@AGENTS.md`);
  - attempt-1 context removed: old root `CLAUDE.md`, all of old `memory/` (including `ADAPTER_STANDARDS.md`), and `plan/NEXT.md`.

## Needs a P0 decision

Choices made while building P0 that no decision covers. Each needs the maintainer's yes or no.

1. **Standards marked _(P0 proposal)_** in `docs/standards/code.md` (barrels hold no logic) and `docs/standards/testing.md` (missing helpers go in `@big-calendar/testing`; query by role; fake clock and explicit zone; cite T-rules; bug fixes start with a failing test).
2. **Slice spec location:** the `slice-start` skill puts each slice's kickoff spec in `docs/spec/slices/s<N>.md`.
3. **Roadmap location:** P1 §14–§16 became `docs/spec/roadmap.md`, so it is covered by the "spec changes need a decision" rule like any other spec.
4. **`.mcp.json` is now committed** (it was gitignored in attempt 1). Servers run through `npx … @latest`; pin versions in S0 if preferred.
5. **`docs/decisions.md` is excluded from Prettier**, so appending a row never re-pads every other row.
6. **Guard hook scope** (`scripts/agent-hooks/guard-protected.mjs`): denies edits to `plan/`, `.git/`, `node_modules/`, `pnpm-lock.yaml`, `.env*` and past decision rows; asks before force-push, branch deletion, rebase, `reset --hard`, `git clean`, `--no-verify` and `pnpm/npm/yarn add`.
7. **Checkpoint wording:** P1 §3 rule 3 lists `memory/DECISIONS.md`, but D-49 says `memory/` holds only PROGRESS and ERRORS. `docs/standards/workflow.md` follows D-49 and notes the difference.

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
