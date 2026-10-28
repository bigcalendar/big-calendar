# Progress

## Next step

**P3 in progress** (accessibility spec plus vanilla prototype). Continue with the first unchecked task below. Exit criteria: `docs/spec/roadmap.md`, row P3.

### P3 tasks

1. [x] Draft the accessibility spec: `plan/P3-ACCESSIBILITY.md` (moves to `docs/spec/accessibility.md` on approval, like P2).
2. [x] Prototype scaffold: `prototypes/p3-vanilla/` with a tiny static server, fixture data, live-region and roving-focus helpers.
3. [x] Month grid: roles, roving focus, event group, Shift+Arrow selection, "+N more" popover.
4. [x] Time grid: per-slot cells, the all-day row (embedded day grid) and the focus hop, DST days (T-14).
5. [x] Keyboard and single-pointer move (keyboard DnD and its WCAG 2.5.7 alternative), context menu, invalid drops (D-76).
6. [ ] O-6: build the move machine twice (hand-written state machine vs XState) and compare.
7. [x] Automated checks: axe on all three engines, forced colors, 400% zoom, reduced motion.
8. [x] Screen-reader script with expected announcements (`docs/checklists/screen-reader-script.md`).
9. [x] Maintainer ran VoiceOver + Safari (2026-10-28): all steps passed; Lighthouse accessibility 100. Answers to every Proposed item recorded as D-89 (one change: Shift+Left/Right is a continuous span), and the prototype updated to match.
10. [ ] Maintainer runs NVDA + Firefox **once Windows is available** (the maintainer has no Windows machine yet, 2026-10-28).
11. [ ] Findings resolved; stop for the maintainer's P3 review.

Findings so far are in section 13 of the draft. Tasks 2–5 are verified by scripted keyboard runs in Chromium (focus names and live-region text), not yet by a screen reader. The prototype runs with `node prototypes/p3-vanilla/serve.mjs`.

P3 scope answers (2026-10-28): desktop screen readers only (VoiceOver, NVDA); mobile screen readers are checked during the per-slice real-device checks from S1. These go into the P3 decision entry on approval.

## Where things stand (2026-10-28)

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
