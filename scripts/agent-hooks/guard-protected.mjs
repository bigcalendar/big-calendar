// Before a tool runs, blocks edits to protected files and asks before
// actions the workflow says need the maintainer first (docs/standards/workflow.md rule 3).
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { readEvent, repoRoot, repoPath, verdict } from './lib.mjs'

const event = readEvent()
const root = repoRoot(event.cwd)

// Files no agent edits by hand. Each entry: [test, reason].
const PROTECTED = [
  [(p) => p === '.git' || p.startsWith('.git/'), 'Never edit .git directly.'],
  [(p) => p.split('/').includes('node_modules'), 'Never edit node_modules.'],
  [
    (p) => p.endsWith('pnpm-lock.yaml'),
    'The lockfile is written by pnpm only.',
  ],
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
    /\bgit\s+reset\b[^;&|]*--hard\b/,
    'A hard reset discards work; it needs the maintainer first.',
  ],
  [
    /\bgit\s+clean\b[^;&|]*\s-\w*f/,
    'git clean deletes files; it needs the maintainer first.',
  ],
  [/--no-verify\b/, 'Skipping git hooks needs the maintainer first.'],
]

const DEPENDENCY_FIELDS = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
]
const ADD_REASON =
  'Adding a dependency the specs do not name needs the maintainer first.'

/** Splits a shell command into simple commands, each a list of words. */
function simpleCommands(command) {
  return command
    .split(/&&|\|\||[;|&\n]/)
    .map((part) => part.trim().split(/\s+/).filter(Boolean))
    .filter((words) => words.length)
}

function git(args) {
  return execFileSync('git', args, {
    cwd: event.cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim()
}

/** True if a package-manager command adds a named package (`pnpm -F core add x`, `npm i x`). */
function addsPackage(words) {
  const pm = words.findIndex((w) => /^(pnpm|npm|yarn|bun)$/.test(w))
  if (pm === -1) return false
  // Options that take a value before the subcommand, e.g. `pnpm --filter core add x`.
  const valued = new Set([
    '--filter',
    '-F',
    '-C',
    '--dir',
    '--prefix',
    '--cwd',
    '--workspace',
  ])
  let i = pm + 1
  while (i < words.length && words[i].startsWith('-'))
    i += valued.has(words[i]) ? 2 : 1
  if (!['add', 'install', 'i'].includes(words[i])) return false
  return words.slice(i + 1).some((w) => !w.startsWith('-'))
}

/** True if a `git rebase` would rewrite commits that already exist on a remote. */
function rebasesPushedCommits(words) {
  const at = words.findIndex((w, i) => w === 'rebase' && words[i - 1] === 'git')
  if (at === -1) return false
  const args = words.slice(at + 1)
  const control = [
    '--continue',
    '--abort',
    '--skip',
    '--quit',
    '--edit-todo',
    '--show-current-patch',
  ]
  if (args.some((a) => control.includes(a))) return false
  // Options that take a value, so their value isn't read as <upstream> or <branch>.
  const valued = new Set([
    '--onto',
    '-s',
    '--strategy',
    '-X',
    '--strategy-option',
    '-x',
    '--exec',
  ])
  const positional = []
  for (let i = 0; i < args.length; i++) {
    if (valued.has(args[i])) i++
    else if (!args[i].startsWith('-')) positional.push(args[i])
  }
  const root = args.includes('--root')
  const branch = (root ? positional[0] : positional[1]) ?? 'HEAD'
  const range = root
    ? [branch]
    : [`${positional[0] ?? '@{upstream}'}..${branch}`]
  try {
    const rewritten = git(['rev-list', '--count', ...range])
    const localOnly = git([
      'rev-list',
      '--count',
      ...range,
      '--not',
      '--remotes',
    ])
    return Number(rewritten) > Number(localOnly)
  } catch {
    // Can't resolve the range: ask rather than guess.
    return true
  }
}

/** Applies an Edit/MultiEdit/Write to the current text, returning the text after it. */
function textAfterEdit(before) {
  if (event.isWrite) return event.newText
  const edits = event.edits ?? [
    {
      old_string: event.oldText,
      new_string: event.newText,
      replace_all: event.replaceAll,
    },
  ]
  let text = before
  for (const e of edits) {
    text = e.replace_all
      ? text.split(e.old_string).join(e.new_string)
      : text.replace(e.old_string, () => e.new_string)
  }
  return text
}

/** Dependency names a package.json declares, ignoring workspace-internal ones. */
function dependencyNames(text) {
  const names = new Set()
  const pkg = JSON.parse(text)
  for (const field of DEPENDENCY_FIELDS) {
    for (const [name, version] of Object.entries(pkg[field] ?? {})) {
      if (!String(version).startsWith('workspace:')) names.add(name)
    }
  }
  return names
}

/** True if editing this package.json adds a dependency entry. */
function addsDependencyEntry(abs) {
  try {
    const before = existsSync(abs) ? readFileSync(abs, 'utf8') : '{}'
    const had = dependencyNames(before)
    return [...dependencyNames(textAfterEdit(before))].some(
      (name) => !had.has(name),
    )
  } catch {
    // Not valid JSON mid-edit: lint and review catch it later.
    return false
  }
}

if (event.command) {
  for (const [pattern, reason] of ASK_FIRST) {
    if (pattern.test(event.command)) verdict({ decision: 'ask', reason })
  }
  for (const words of simpleCommands(event.command)) {
    if (addsPackage(words)) verdict({ decision: 'ask', reason: ADD_REASON })
    if (rebasesPushedCommits(words)) {
      verdict({
        decision: 'ask',
        reason:
          'This rebase rewrites commits that are already pushed; it needs the maintainer first.',
      })
    }
  }
  verdict({ decision: 'allow' })
}

const rel = repoPath({ root, filePath: event.filePath, cwd: event.cwd })
if (rel) {
  for (const [test, reason] of PROTECTED) {
    if (test(rel)) verdict({ decision: 'deny', reason })
  }
  if (
    rel.split('/').pop() === 'package.json' &&
    addsDependencyEntry(join(root, rel))
  ) {
    verdict({ decision: 'ask', reason: ADD_REASON })
  }
}
verdict({ decision: 'allow' })
