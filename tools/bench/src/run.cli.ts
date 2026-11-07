// `pnpm nx bench @big-calendar/tools-bench -- --out results/branch.json [--scenario plumbing]
// [--profile chromium-4x]`: runs the benchmarks and writes the JSON results (a CI artifact).
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { PROFILES } from './profiles.ts'
import { runBenchmarks, scenarioFiles } from './run.ts'

const { values } = parseArgs({
  options: {
    out: { type: 'string', default: 'results/branch.json' },
    scenario: { type: 'string', multiple: true },
    profile: { type: 'string', multiple: true },
  },
})
const scenarios = values.scenario
  ? scenarioFiles().filter((file) =>
      values.scenario?.some((name) => file.endsWith(`/${name}.ts`)),
    )
  : undefined
const profiles = values.profile
  ? PROFILES.filter((profile) => values.profile?.includes(profile.name))
  : undefined
const results = await runBenchmarks({
  ...(scenarios && { scenarios }),
  ...(profiles && { profiles }),
})
const out = resolve(join(import.meta.dirname, '..'), values.out)
mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, `${JSON.stringify(results, null, 2)}\n`)
for (const result of results) {
  console.log(
    `${result.scenario} · ${result.profile}: median ${result.medianMs.toFixed(2)}ms (cold ${result.coldMs.toFixed(2)}ms)`,
  )
}
