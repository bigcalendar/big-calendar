// Runs every scenario under every profile: a fresh page each time, one recorded cold run, one
// warm-up, then the median of 10 (testing standard). Scenarios are bundled with esbuild into one
// script injected into a blank page, so no server is needed.
import { build } from 'esbuild'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { chromium, firefox, webkit } from 'playwright'
import { PROFILES, type Profile } from './profiles.ts'
import { median } from './stats.ts'

/** One scenario's timings under one profile. */
export interface BenchResult {
  profile: string
  scenario: string
  coldMs: number
  medianMs: number
  runsMs: number[]
  budgetMs: number | undefined
}

const scenariosDir = join(import.meta.dirname, '..', 'scenarios')
const engines = { chromium, firefox, webkit }

/** The scenario files: every module in `scenarios/` except the contract. */
export function scenarioFiles(): string[] {
  return readdirSync(scenariosDir)
    .filter((file) => file.endsWith('.ts') && file !== 'scenario.ts')
    .map((file) => join(scenariosDir, file))
}

/** Bundles one scenario into a script that runs it in the page and returns the timings. */
async function bundle(file: string): Promise<string> {
  const result = await build({
    stdin: {
      contents: `
        import { scenario } from ${JSON.stringify(file)}
        globalThis.__bench = async () => {
          const state = await scenario.setup()
          const time = () => { const t = performance.now(); scenario.run(state); return performance.now() - t }
          const cold = time()
          time()
          const runs = Array.from({ length: 10 }, time)
          return { name: scenario.name, cold, runs }
        }`,
      resolveDir: scenariosDir,
      loader: 'ts',
    },
    bundle: true,
    format: 'iife',
    target: 'es2025',
    write: false,
    logLevel: 'silent',
  })
  return result.outputFiles.map((output) => output.text).join('')
}

/** Runs one bundled scenario under one profile in a fresh page. */
async function runOne({
  profile,
  script,
}: {
  profile: Profile
  script: string
}) {
  const browser = await engines[profile.engine].launch()
  try {
    const page = await browser.newPage()
    if (profile.deleteTemporal) {
      await page.addInitScript(() => {
        delete (globalThis as { Temporal?: unknown }).Temporal
      })
    }
    if (profile.cpuThrottle > 1) {
      const cdp = await page.context().newCDPSession(page)
      await cdp.send('Emulation.setCPUThrottlingRate', {
        rate: profile.cpuThrottle,
      })
    }
    await page.goto('about:blank')
    await page.addScriptTag({ content: script })
    return await page.evaluate(() =>
      (
        globalThis as unknown as {
          __bench: () => Promise<{ name: string; cold: number; runs: number[] }>
        }
      ).__bench(),
    )
  } finally {
    await browser.close()
  }
}

/** Runs the given scenarios (default: all) under the given profiles (default: all). */
export async function runBenchmarks(
  options: {
    scenarios?: readonly string[]
    profiles?: readonly Profile[]
  } = {},
): Promise<BenchResult[]> {
  const results: BenchResult[] = []
  for (const file of options.scenarios ?? scenarioFiles()) {
    const script = await bundle(file)
    for (const profile of options.profiles ?? PROFILES) {
      const timing = await runOne({ profile, script })
      results.push({
        profile: profile.name,
        scenario: timing.name,
        coldMs: timing.cold,
        medianMs: median(timing.runs),
        runsMs: timing.runs,
        budgetMs: profile.budgetMs,
      })
    }
  }
  return results
}
