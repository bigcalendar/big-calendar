# Agent context toolset

> **Normative.** The design below is split verbatim from the approved plan (`plan/P1-PLAN.md` §17, D-49). Changing it needs a new entry in the [decision log](../decisions.md).

The goal is the smallest context that is always loaded, with detail loaded only when an agent touches the relevant files, and rules enforced by tooling wherever possible. Contributors may use any agent, so **all normative content is tool-neutral**. Tool-specific files are thin wrappers that point at it.

```
AGENTS.md                      ~60 lines: what this is, hard rules, routing table, "read PROGRESS first"
CLAUDE.md                      @AGENTS.md
packages/*/AGENTS.md           package purpose, boundaries, local commands, governing specs
packages/*/CLAUDE.md           @AGENTS.md (Claude Code loads nested CLAUDE.md on demand)
docs/spec/*.md                 normative topic specs split from approved P1
docs/standards/*.md            short prose for what tooling can't check (D-46)
docs/decisions.md              the single decision log (seeded with D-01 onward)
docs/checklists/*.md           spec review, a11y review, slice gates, screen-reader script
.agents/skills/<name>/SKILL.md Agent Skills standard: slice-start, slice-finish, decide, resume,
                               new-package, a11y-check, bench, spec-check
.claude/skills -> ../.agents/skills   (unless Claude Code reads .agents/skills directly; S0 verifies)
.claude/agents/*.md            spec-reviewer, a11y-reviewer, test-author, docs-writer (Sonnet)
.claude/rules/*.md             path-scoped pointers into docs/standards
.claude/settings.json          hooks → scripts/agent-hooks/*
scripts/agent-hooks/*.mjs      format-on-edit, session-brief, guard-protected, typecheck-on-stop
.mcp.json                      Playwright, Nx
memory/PROGRESS.md, ERRORS.md  progress and failed approaches only
```

- **Hooks work at three levels.**
  1. The logic lives once, in tool-neutral scripts that read a JSON event on standard input.
  2. Each tool gets a thin config file mapping its own event names to those scripts: Claude Code at P0, other tools when a contributor needs them.
  3. Git hooks and CI back up every check, so agents without hooks still hit the same gates:
     - formatting runs on commit (lint-staged);
     - typecheck runs in PR checks;
     - a CI check fails if `docs/spec/` or `docs/decisions.md` changes without a new decision entry;
     - `AGENTS.md` tells every agent to read the "Next step" section of `PROGRESS.md` first.
- **Agents with no shared format.** Sub-agent definitions are Claude-specific, so their checklists live in `docs/checklists/`, where any agent or person can run them.
- **Attempt-1 context files are removed from `planning` at P0.** That covers the root `CLAUDE.md`, `memory/` and `ADAPTER_STANDARDS.md`, so no agent reads them by mistake. They remain in `main`'s history and in the S0 archive.

## As built at P0

| Piece           | Where                                                          | Notes                                                                                                                 |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Root context    | `AGENTS.md`, `CLAUDE.md` (`@AGENTS.md`)                        | Routing table to everything below                                                                                     |
| Package context | `packages/*/AGENTS.md` + `CLAUDE.md`                           | Not created at P0: the new packages don't exist yet. The `new-package` skill creates them from S0 on                  |
| Specs           | `docs/spec/`                                                   | Index in `docs/spec/README.md`                                                                                        |
| Standards       | `docs/standards/`                                              | Index in `docs/standards/README.md`                                                                                   |
| Decision log    | `docs/decisions.md`                                            | Append-only                                                                                                           |
| Checklists      | `docs/checklists/`                                             | Run by people, by any agent, and by the Claude sub-agents                                                             |
| Skills          | `.agents/skills/<name>/SKILL.md`                               | `.claude/skills` is a symlink to `../.agents/skills`; S0 verifies whether Claude Code reads `.agents/skills` directly |
| Sub-agents      | `.claude/agents/`                                              | `spec-reviewer`, `a11y-reviewer`, `test-author`, `docs-writer`, all on Sonnet                                         |
| Path rules      | `.claude/rules/`                                               | Pointers only; the content is in `docs/standards/`                                                                    |
| Hooks           | `scripts/agent-hooks/*.mjs`, mapped in `.claude/settings.json` | See `scripts/agent-hooks/README.md` for the event format                                                              |
| MCP             | `.mcp.json`                                                    | Playwright and Nx                                                                                                     |

**Backed up by git hooks and CI from S0** (product configs wait for S0): lint-staged formatting on commit, typecheck in PR checks, and the CI check that fails when `docs/spec/` or `docs/decisions.md` changes without a new decision entry.
