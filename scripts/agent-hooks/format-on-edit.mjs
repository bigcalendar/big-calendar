// After a file edit, formats that file with the repo's Prettier.
// Never blocks: formatting problems are left for lint-staged and CI.
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { readEvent, repoRoot, repoPath } from './lib.mjs'

const event = readEvent()
const root = repoRoot(event.cwd)
const rel = repoPath({ root, filePath: event.filePath, cwd: event.cwd })
const prettier = root && join(root, 'node_modules', '.bin', 'prettier')

if (rel && existsSync(join(root, rel)) && existsSync(prettier)) {
  try {
    execFileSync(
      prettier,
      ['--write', '--ignore-unknown', '--log-level=warn', rel],
      {
        cwd: root,
        stdio: ['ignore', 'ignore', 'pipe'],
      },
    )
  } catch {
    // Unparseable or ignored file: leave it as written.
  }
}
process.exit(0)
