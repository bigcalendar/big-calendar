# Agent hooks

Tool-neutral hook scripts ([agent toolset](../../docs/standards/agent-toolset.md), level 1). Each one reads a single JSON event on stdin. Each agent tool gets a thin config that maps its own event names to these scripts (level 2); for Claude Code that is `.claude/settings.json`. Git hooks and CI back up every check (level 3, from S0).

| Script                  | Runs                                | Does                                                                                                                                                                                                                                                                                                                | Blocks? |
| ----------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| `session-brief.mjs`     | at session start                    | Prints the branch and the **Next step** section of `memory/PROGRESS.md`                                                                                                                                                                                                                                             | No      |
| `guard-protected.mjs`   | before a file edit or shell command | Denies edits to `.git/`, `node_modules/` and `pnpm-lock.yaml`. Asks before force-push, deleting a branch, `reset --hard`, `git clean -f`, `--no-verify`, a rebase that rewrites pushed commits, and adding a dependency (by command or by a `package.json` edit adding a non-`workspace:` entry). Scope set by D-85 | Yes     |
| `format-on-edit.mjs`    | after a file edit                   | Runs the repo's Prettier on the edited file                                                                                                                                                                                                                                                                         | No      |
| `typecheck-on-stop.mjs` | when the agent stops                | If uncommitted `.ts`/`.tsx` files under `packages/` changed, runs `nx affected -t typecheck --uncommitted`; on failure, blocks the stop once with the errors                                                                                                                                                        | Once    |

## Event format

The scripts accept Claude Code's hook payload as-is, or this neutral shape:

```json
{
  "event": "pre-edit",
  "tool": "edit",
  "filePath": "packages/core/package.json",
  "command": "",
  "reentrant": false,
  "cwd": "/path/to/repo",
  "input": { "old_string": "…", "new_string": "…" }
}
```

- `filePath` or `command` is what the guard checks; `input.old_string`/`new_string` (or `content` for a full write) lets it check `package.json` edits for new dependencies.
- `reentrant: true` tells `typecheck-on-stop` the agent is already continuing because of it, so it doesn't loop.

## Exit codes

- `0`: allow or nothing to do.
- `2`: block; the reason is on stderr.
- `guard-protected.mjs --format=claude` reports "ask" and "deny" as Claude Code `PreToolUse` JSON on stdout instead. Without the flag, "ask" blocks (exit 2), which is the safe default for tools with no ask mode.

## Testing a hook by hand

```sh
echo '{"tool_name":"Bash","tool_input":{"command":"git push --force"}}' | node scripts/agent-hooks/guard-protected.mjs; echo "exit $?"
```
