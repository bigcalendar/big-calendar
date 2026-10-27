// Shared helpers for the agent hooks. The hook logic is tool-neutral: each
// script reads one JSON event on stdin and normalizes it here, so any agent's
// thin config can call the same scripts (see README.md).
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { resolve, relative, isAbsolute } from 'node:path'

/**
 * Reads the hook event from stdin and normalizes it.
 * Accepts Claude Code's shape (`hook_event_name`, `tool_name`, `tool_input`)
 * or the neutral shape documented in README.md.
 */
export function readEvent() {
  let raw = {}
  try {
    const text = readFileSync(0, 'utf8').trim()
    if (text) raw = JSON.parse(text)
  } catch {
    // No stdin or invalid JSON: treat as an empty event.
  }
  const input = raw.tool_input ?? raw.input ?? {}
  const cwd = raw.cwd ?? process.env.CLAUDE_PROJECT_DIR ?? process.cwd()
  return {
    event: raw.event ?? raw.hook_event_name ?? '',
    tool: raw.tool ?? raw.tool_name ?? '',
    filePath: raw.filePath ?? input.file_path ?? input.notebook_path ?? '',
    command: raw.command ?? input.command ?? '',
    oldText: input.old_string ?? null,
    newText: input.new_string ?? input.content ?? null,
    edits: input.edits ?? null,
    reentrant: Boolean(raw.reentrant ?? raw.stop_hook_active),
    cwd,
    raw,
  }
}

/** The repository root, or null outside a git repo. */
export function repoRoot(cwd) {
  try {
    return execFileSync('git', ['rev-parse', '--show-toplevel'], {
      cwd,
      encoding: 'utf8',
    }).trim()
  } catch {
    return null
  }
}

/** A file path relative to the repo root, using forward slashes, or null if outside it. */
export function repoPath({ root, filePath, cwd }) {
  if (!root || !filePath) return null
  const abs = isAbsolute(filePath) ? filePath : resolve(cwd, filePath)
  const rel = relative(root, abs)
  if (rel.startsWith('..') || isAbsolute(rel)) return null
  return rel.split('\\').join('/')
}

/**
 * Reports a guard verdict and exits.
 * `decision` is 'allow', 'ask' or 'deny'. With `--format=claude`, 'ask' and
 * 'deny' use Claude Code's PreToolUse JSON; otherwise any non-allow verdict
 * exits 2 with the reason on stderr, which blocks in agents that lack an
 * "ask" mode.
 */
export function verdict({ decision, reason }) {
  if (decision === 'allow') process.exit(0)
  if (process.argv.includes('--format=claude')) {
    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: decision,
          permissionDecisionReason: reason,
        },
      }),
    )
    process.exit(0)
  }
  process.stderr.write(`${decision}: ${reason}\n`)
  process.exit(2)
}
