// `node src/check-decisions.cli.ts <base-ref>`: runs the decision-entry check on this branch against
// the base, printing each problem and exiting 1 if there are any.
import { execFileSync } from 'node:child_process'
import { checkDecisions } from './decisions.ts'

const base = process.argv[2] ?? 'origin/main'
function git(args: readonly string[]): string {
  return execFileSync('git', args, { encoding: 'utf8' })
}
const problems = checkDecisions({
  changedFiles: git(['diff', '--name-only', `${base}...HEAD`])
    .split('\n')
    .filter(Boolean),
  decisionsDiff: git([
    'diff',
    '--unified=0',
    `${base}...HEAD`,
    '--',
    'docs/decisions.md',
  ]),
})
for (const problem of problems) console.error(`✗ ${problem}`)
console.log(
  problems.length
    ? `${String(problems.length)} decision problem(s)`
    : 'decision entries: ok',
)
process.exitCode = problems.length ? 1 : 0
