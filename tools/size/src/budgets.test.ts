// D-63: every public entry point stays within its size budget; the binding stays within its line
// budget. Fixtures over each limit prove the checks fail (S0 exit criterion).
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  BINDING_LINE_BUDGET,
  bindingLines,
  codeLines,
} from './binding-lines.function'
import { checkBudgets, parseBudget } from './budgets.function'
import { publishedPackages, root } from './packages.function'

describe('size budgets', () => {
  for (const pkg of publishedPackages()) {
    it(`${pkg.name} is within its budgets`, async () => {
      const results = await checkBudgets(pkg.dir)
      expect(
        results.length,
        'every package has at least one budget',
      ).toBeGreaterThan(0)
      for (const result of results) {
        expect(
          result.bytes,
          `${result.specifier}: ${String(result.bytes)} B gzip`,
        ).toBeLessThanOrEqual(result.budget)
      }
    })
  }

  it('catches an entry point over its budget (fixture)', async () => {
    const [result] = await checkBudgets(join(root, 'tools/fixtures/size-over'))
    expect(result?.bytes).toBeGreaterThan(result?.budget ?? Infinity)
  })

  it('parses budgets', () => {
    expect(parseBudget('1 KB')).toBe(1024)
    expect(parseBudget('12.5 KB')).toBe(12800)
    expect(parseBudget('800 B')).toBe(800)
    expect(() => parseBudget('1MB')).toThrow(/Bad size budget/)
  })
})

describe('binding line budget', () => {
  it(`@big-calendar/react has at most ${String(BINDING_LINE_BUDGET)} lines of code`, () => {
    expect(bindingLines(join(root, 'packages/react/src'))).toBeLessThanOrEqual(
      BINDING_LINE_BUDGET,
    )
  })

  it('catches a binding over the budget (fixture)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'binding-over-'))
    const body = Array.from(
      { length: BINDING_LINE_BUDGET + 1 },
      (_, i) => `export const line${String(i)} = ${String(i)}`,
    )
    writeFileSync(join(dir, 'too-long.function.ts'), body.join('\n'))
    writeFileSync(join(dir, 'ignored.type.ts'), body.join('\n'))
    expect(bindingLines(dir)).toBe(BINDING_LINE_BUDGET + 1)
  })

  it('skips comments and blank lines', () => {
    expect(codeLines('// note\n\n/** doc\n * more\n */\nconst a = 1\n')).toBe(1)
  })
})
