// At session start, prints the branch and the "Next step" section of
// memory/PROGRESS.md so every agent starts from the same place.
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { readEvent, repoRoot } from './lib.mjs'

const event = readEvent()
const root = repoRoot(event.cwd) ?? event.cwd

function git(args) {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
  } catch {
    return ''
  }
}

/** Returns the body of the first `##` section whose heading starts with `title`. */
function section(text, title) {
  const lines = text.split('\n')
  const start = lines.findIndex((l) => l.startsWith(`## ${title}`))
  if (start === -1) return ''
  const end = lines.findIndex((l, i) => i > start && l.startsWith('## '))
  return lines
    .slice(start, end === -1 ? undefined : end)
    .join('\n')
    .trim()
}

const out = ['# Big Calendar session brief', '']
out.push(`Branch: ${git(['branch', '--show-current']) || '(detached)'}`)
const dirty = git(['status', '--porcelain'])
if (dirty) out.push(`Uncommitted changes: ${dirty.split('\n').length} file(s)`)
out.push('')

const progress = join(root, 'memory', 'PROGRESS.md')
if (existsSync(progress)) {
  const next = section(readFileSync(progress, 'utf8'), 'Next step')
  out.push(
    next ||
      'memory/PROGRESS.md has no "Next step" section. Ask the maintainer what to do.',
  )
} else {
  out.push('memory/PROGRESS.md is missing. Ask the maintainer what to do.')
}

const errors = join(root, 'memory', 'ERRORS.md')
if (existsSync(errors)) {
  const count = (readFileSync(errors, 'utf8').match(/^### /gm) ?? []).length
  if (count)
    out.push(
      '',
      `memory/ERRORS.md lists ${count} failed approach(es). Check it before retrying anything in the same area.`,
    )
}

out.push(
  '',
  'Rules: no inline decisions (use the decide skill); read only the specs the task needs (routing table in AGENTS.md).',
)
process.stdout.write(out.join('\n') + '\n')
