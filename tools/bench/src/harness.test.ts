// The harness's own checks: the statistics, the comparison rules, and one real run of the plumbing
// scenario in Chromium, so a broken harness fails here before it fails in CI.
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { compare, REGRESSION_LIMIT, toMarkdown } from './compare.ts'
import { PROFILES } from './profiles.ts'
import { runBenchmarks, type BenchResult } from './run.ts'
import { median } from './stats.ts'

function result(overrides: Partial<BenchResult>): BenchResult {
  return {
    profile: 'chromium-4x',
    scenario: 'month',
    coldMs: 1,
    medianMs: 10,
    runsMs: [],
    budgetMs: 50,
    ...overrides,
  }
}

describe('median', () => {
  it('handles odd and even lengths', () => {
    expect(median([3, 1, 2])).toBe(2)
    expect(median([4, 1, 3, 2])).toBe(2.5)
  })
})

describe('compare', () => {
  it('passes a run within budget and within 10% of main', () => {
    const [row] = compare({
      main: [result({ medianMs: 10 })],
      branch: [result({ medianMs: 10.5 })],
    })
    expect(row?.failures).toEqual([])
  })

  it(`fails a median more than ${String(REGRESSION_LIMIT * 100)}% slower than main`, () => {
    const [row] = compare({
      main: [result({ medianMs: 10 })],
      branch: [result({ medianMs: 11.5 })],
    })
    expect(row?.failures).toEqual(['15.0% slower than main'])
  })

  it('ignores changes under the 1ms timer resolution (D-103)', () => {
    const [row] = compare({
      main: [result({ medianMs: 4 })],
      branch: [result({ medianMs: 4.9 })],
    })
    expect(row?.failures).toEqual([])
  })

  it('fails a gated profile over its budget, but not a tracked one', () => {
    const rows = compare({
      main: [],
      branch: [
        result({ medianMs: 60 }),
        result({ profile: 'firefox', medianMs: 60, budgetMs: undefined }),
      ],
    })
    expect(rows.map((row) => row.failures)).toEqual([
      ['over the 50ms budget'],
      [],
    ])
  })

  it('writes the PR table', () => {
    const table = toMarkdown(
      compare({ main: [result({})], branch: [result({ medianMs: 12 })] }),
    )
    expect(table).toContain(
      '| month · chromium-4x | 50ms | 10.00ms | 12.00ms | +20.0% | ❌ 20.0% slower than main |',
    )
  })
})

describe('runner', () => {
  it(
    'runs the plumbing scenario in a real browser',
    { timeout: 60_000 },
    async () => {
      const results = await runBenchmarks({
        scenarios: [
          join(import.meta.dirname, '..', 'scenarios', 'plumbing.ts'),
        ],
        profiles: PROFILES.filter((profile) => profile.name === 'chromium-4x'),
      })
      expect(results).toHaveLength(1)
      expect(results[0]?.scenario).toBe('plumbing')
      expect(results[0]?.runsMs).toHaveLength(10)
      expect(results[0]?.medianMs).toBeGreaterThan(0)
    },
  )
})
