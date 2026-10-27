// Before a tool runs, blocks edits to protected files and asks before
// actions the workflow says need the maintainer first (docs/standards/workflow.md rule 3).
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { readEvent, repoRoot, repoPath, verdict } from './lib.mjs'

const event = readEvent()
const root = repoRoot(event.cwd)

// Files no agent edits by hand. Each entry: [test, reason].
const PROTECTED = [
  [
    (p) => p.startsWith('plan/'),
    'plan/ is the frozen approved P1 record. Change docs/spec/ and add a decision instead.',
  ],
  [(p) => p === '.git' || p.startsWith('.git/'), 'Never edit .git directly.'],
  [(p) => p.split('/').includes('node_modules'), 'Never edit node_modules.'],
  [
    (p) => p.endsWith('pnpm-lock.yaml'),
    'The lockfile is written by pnpm only.',
  ],
  [(p) => /(^|\/)\.env(\.|$)/.test(p), 'Never edit .env files.'],
]

// Shell commands that need the maintainer first. Each entry: [pattern, reason].
const ASK_FIRST = [
  [
    /\bgit\s+push\b[^;&|]*\s(-f|--force|--force-with-lease)\b/,
    'Force-pushing needs the maintainer first.',
  ],
  [
    /\bgit\s+push\b[^;&|]*\s(--delete|-d)\b|\bgit\s+push\b[^;&|]*\s:\S/,
    'Deleting a remote branch needs the maintainer first.',
  ],
  [
    /\bgit\s+branch\b[^;&|]*\s(-d|-D|--delete)\b/,
    'Deleting a branch needs the maintainer first.',
  ],
  [
    /\bgit\s+rebase\b/,
    'Rebasing can rewrite pushed commits; it needs the maintainer first.',
  ],
  [
    /\bgit\s+reset\b[^;&|]*--hard\b/,
    'A hard reset discards work; it needs the maintainer first.',
  ],
  [
    /\bgit\s+clean\b[^;&|]*\s-\w*f/,
    'git clean deletes files; it needs the maintainer first.',
  ],
  [/--no-verify\b/, 'Skipping git hooks needs the maintainer first.'],
  [
    /\b(pnpm|npm|yarn|bun)\b[^;&|]*\s(add|install|i)\s+[^-\s;&|]/,
    'Adding a dependency the specs do not name needs the maintainer first.',
  ],
]

/** Decision rows (`| D-NN | …`) in a text. */
function decisionRows(text) {
  return (text ?? '').split('\n').filter((l) => /^\| D-\d+ \|/.test(l))
}

/** True if an edit to docs/decisions.md would change or remove an existing entry. */
function rewritesDecisions() {
  if (event.oldText !== null) {
    const pairs = event.edits ?? [
      { old_string: event.oldText, new_string: event.newText },
    ]
    return pairs.some((e) => {
      const after = new Set(decisionRows(e.new_string))
      return decisionRows(e.old_string).some((row) => !after.has(row))
    })
  }
  if (event.newText !== null) {
    const file = join(root, 'docs', 'decisions.md')
    if (!existsSync(file)) return false
    const after = new Set(decisionRows(event.newText))
    return decisionRows(readFileSync(file, 'utf8')).some(
      (row) => !after.has(row),
    )
  }
  return false
}

if (event.command) {
  for (const [pattern, reason] of ASK_FIRST) {
    if (pattern.test(event.command)) verdict({ decision: 'ask', reason })
  }
  verdict({ decision: 'allow' })
}

const rel = repoPath({ root, filePath: event.filePath, cwd: event.cwd })
if (rel) {
  for (const [test, reason] of PROTECTED) {
    if (test(rel)) verdict({ decision: 'deny', reason })
  }
  if (rel === 'docs/decisions.md' && rewritesDecisions()) {
    verdict({
      decision: 'deny',
      reason:
        'Decision entries are append-only. Add a new entry that amends the old one instead.',
    })
  }
}
verdict({ decision: 'allow' })
