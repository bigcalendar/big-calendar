# Progress

## Next step

**Waiting for the maintainer's P2 review.** The draft is `plan/P2-SUPPORT-MATRIX.md`; its evidence is in `prototypes/p2-top-level-await/`. Don't start P3 until P2 is approved.

The draft ends with seven answers needed. The big one is finding 1: top-level `await` (D-32's `temporal` loader) breaks in Safari 26.2–26.6 when lazy imports reach the calendar at the same time. Recommended: option B (an explicit `temporalReady` promise, hidden from React users).

On approval: record the answers with the `decide` skill (each one that changes D-32, D-43 or a standard says so), move the draft to `docs/spec/support-matrix.md` in the same commit, add the approved rules to `docs/standards/styling.md` and `testing.md`, then start P3.

## Where things stand (2026-10-28)

- **P2 drafted** 2026-10-28, in review: `plan/P2-SUPPORT-MATRIX.md`.

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
