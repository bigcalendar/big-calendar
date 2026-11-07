// The binding budget (architecture, hard rule): about 600 lines of source in `@big-calendar/react`,
// excluding types (`*.type.ts`), tests, stories, comments and blank lines.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/** The binding's line budget. */
export const BINDING_LINE_BUDGET = 600

/** Counts the lines of code in one TypeScript source text. */
export function codeLines(source: string): number {
  const withoutBlocks = source.replace(/\/\*[\s\S]*?\*\//g, '')
  return withoutBlocks
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '' && !line.startsWith('//')).length
}

/** Counts the binding's lines of code in the `src` folder `dir`. */
export function bindingLines(dir: string): number {
  const files = readdirSync(dir, { recursive: true, encoding: 'utf8' }).filter(
    (file) =>
      /\.tsx?$/.test(file) &&
      !/\.(type|test|stories)\.tsx?$/.test(file) &&
      !file.endsWith('.test-d.ts'),
  )
  let total = 0
  for (const file of files)
    total += codeLines(readFileSync(join(dir, file), 'utf8'))
  return total
}
