// When an agent is about to stop, typechecks the projects affected by
// uncommitted TypeScript changes. A failure blocks the stop once, with the errors.
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { readEvent, repoRoot } from './lib.mjs'

const event = readEvent()
// Already continuing because of this hook: don't loop.
if (event.reentrant) process.exit(0)

const root = repoRoot(event.cwd)
const nx = root && join(root, 'node_modules', '.bin', 'nx')
if (!root || !existsSync(nx)) process.exit(0)

let changed = ''
try {
  changed = execFileSync('git', ['status', '--porcelain'], {
    cwd: root,
    encoding: 'utf8',
  })
} catch {
  process.exit(0)
}
const touchesTs = changed
  .split('\n')
  .some((l) => /^.. packages\/.*\.(ts|tsx|mts|cts)$/.test(l))
if (!touchesTs) process.exit(0)

try {
  execFileSync(
    nx,
    ['affected', '-t', 'typecheck', '--uncommitted', '--outputStyle=static'],
    {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  )
  process.exit(0)
} catch (error) {
  const output = `${error.stdout ?? ''}${error.stderr ?? ''}`.trim().split('\n')
  process.stderr.write(
    [
      'Typecheck failed for uncommitted changes. Fix these before stopping:',
      ...output.slice(-60),
    ].join('\n') + '\n',
  )
  process.exit(2)
}
