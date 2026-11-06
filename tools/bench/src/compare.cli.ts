// `node src/compare.cli.ts --main results/main.json --branch results/branch.json [--markdown out.md]`:
// prints the PR table, optionally writes it for the PR comment, and exits 1 when a check fails.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { parseArgs } from 'node:util'
import { compare, toMarkdown } from './compare.ts'
import type { BenchResult } from './run.ts'

const { values } = parseArgs({
  options: {
    main: { type: 'string', default: 'results/main.json' },
    branch: { type: 'string', default: 'results/branch.json' },
    markdown: { type: 'string' },
  },
})
function load(file: string): BenchResult[] {
  return existsSync(file)
    ? (JSON.parse(readFileSync(file, 'utf8')) as BenchResult[])
    : []
}
const rows = compare({ main: load(values.main), branch: load(values.branch) })
const table = toMarkdown(rows)
console.log(table)
if (values.markdown) writeFileSync(values.markdown, `${table}\n`)
process.exitCode = rows.some((row) => row.failures.length > 0) ? 1 : 0
