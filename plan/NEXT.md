# NEXT — handoff

> Read this first. It's the only context a new session needs to continue.

## Where things stand (2026-10-27)

- **P1 is approved.** `plan/P1-PLAN.md` is the plan of record: every decision (D-01 to D-84), the open items (§16) and the roadmap (§14–§15).
- Branch: `planning`. Nothing has been built yet.
- Review page (snapshot, not maintained): https://claude.ai/artifact/VJYspbBFEk1D7K34pkSLki

## Next step: build P0 (agent context toolset, plan §17)

Read **only** these sections of `plan/P1-PLAN.md`: §0, §3 (execution rules), §4.2 (package map), §17 (toolset), D-45/D-46 (execution and standards), and D-49. Then build:

1. **Split the approved plan** into topic specs under `docs/spec/`, one file per topic (time semantics §7, edit model §6.1, event fields §6.0, engine §5, headless API §4.4, interaction and accessibility §10, React and styling §11, modules §12, migration §13, developer experience §2.1, gap additions §18).
2. **Move the decision log** (Appendix A) to `docs/decisions.md`. It's the single log from now on. Leave `plan/P1-PLAN.md` as the frozen approved record.
3. **Write the remaining toolset files** listed in §17:
   - root `AGENTS.md` (~60 lines with a routing table) and `CLAUDE.md` (`@AGENTS.md`);
   - `docs/standards/*` (including `writing.md`, per D-64);
   - `docs/checklists/*`;
   - `.agents/skills/*` (8 skills), with `.claude/skills` linked to them;
   - `.claude/agents/*` (4 agents, Sonnet);
   - `.claude/rules/*`;
   - `scripts/agent-hooks/*` with `.claude/settings.json`;
   - `.mcp.json` (Playwright and Nx).
4. **Remove attempt-1 context files** from `planning` (approved): the root `CLAUDE.md` (replaced), `memory/` (replaced by a new `memory/PROGRESS.md` and `memory/ERRORS.md`) and `ADAPTER_STANDARDS.md`. Attempt-1 *code* stays until S0 archives it.
5. **Replace this file** with `memory/PROGRESS.md`, then delete `plan/NEXT.md`.
6. **Commit** on `planning`, **push**, and stop for the maintainer's P0 review. Product configs (ESLint, CI, compiler) wait for S0.

## Answers already given (don't re-ask)

- Push the `planning` branch: **yes**.
- The review page's HTML is not kept in the repo.
- P0 removes the attempt-1 context files.
- After P0 approval, the order is P2 → P3 → P4 → P5 → S0, each approved individually.
