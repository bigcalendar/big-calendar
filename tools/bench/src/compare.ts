// Turns two runs (main and the branch, measured back to back on the same machine) into the PR table
// and a verdict: a gated median over budget, or more than 10% slower than main, fails (D-44).

import type { BenchResult } from './run.ts'

/** How much slower than `main` a median may get before the PR fails (D-44). */
export const REGRESSION_LIMIT = 0.1

/**
 * A regression must also be at least this many milliseconds: Firefox and WebKit round
 * `performance.now()` to 1ms on these pages, so smaller changes are noise (D-103).
 */
export const REGRESSION_FLOOR_MS = 1

/** One row of the comparison. */
export interface ComparisonRow {
  benchmark: string
  budgetMs: number | undefined
  mainMs: number | undefined
  branchMs: number
  /** Branch relative to main: 0.05 is 5% slower. `undefined` for a new benchmark. */
  change: number | undefined
  failures: string[]
}

/** Compares a branch run with a `main` run (which may be missing, for the first run). */
export function compare({
  main,
  branch,
}: {
  main: readonly BenchResult[]
  branch: readonly BenchResult[]
}): ComparisonRow[] {
  const byKey = new Map(
    main.map((result) => [`${result.scenario} · ${result.profile}`, result]),
  )
  return branch.map((result) => {
    const benchmark = `${result.scenario} · ${result.profile}`
    const before = byKey.get(benchmark)
    // Firefox and WebKit round `performance.now()` to 1ms here, so a 0ms baseline is possible.
    const change =
      before && before.medianMs > 0
        ? result.medianMs / before.medianMs - 1
        : undefined
    const failures: string[] = []
    if (result.budgetMs !== undefined && result.medianMs > result.budgetMs) {
      failures.push(`over the ${String(result.budgetMs)}ms budget`)
    }
    if (
      before &&
      change !== undefined &&
      change > REGRESSION_LIMIT &&
      result.medianMs - before.medianMs >= REGRESSION_FLOOR_MS
    ) {
      failures.push(`${(change * 100).toFixed(1)}% slower than main`)
    }
    return {
      benchmark,
      budgetMs: result.budgetMs,
      mainMs: before?.medianMs,
      branchMs: result.medianMs,
      change,
      failures,
    }
  })
}

/** The PR comment table (testing standard, "Benchmarks"). */
export function toMarkdown(rows: readonly ComparisonRow[]): string {
  function ms(value: number | undefined): string {
    return value === undefined ? '—' : `${value.toFixed(2)}ms`
  }
  const lines = [
    '| Benchmark | Budget | `main` | Branch | Change | |',
    '| --- | --- | --- | --- | --- | --- |',
    ...rows.map(
      (row) =>
        `| ${row.benchmark} | ${row.budgetMs === undefined ? 'tracked' : `${String(row.budgetMs)}ms`} | ${ms(row.mainMs)} | ${ms(row.branchMs)} | ${row.change === undefined ? 'new' : `${row.change >= 0 ? '+' : ''}${(row.change * 100).toFixed(1)}%`} | ${row.failures.length ? `❌ ${row.failures.join('; ')}` : '✅'} |`,
    ),
  ]
  return lines.join('\n')
}
