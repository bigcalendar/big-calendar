// Size budgets per public entry point (D-63, D-97). Each entry is bundled as an app would ship it
// (esbuild, minified, production), then gzipped at level 9, as P4 measured (testing standard).
import { build } from 'esbuild'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

/** One entry point's measured size against its budget. */
export interface BudgetResult {
  /** The import specifier, such as `@big-calendar/core` or `@big-calendar/react-ui/dnd`. */
  specifier: string
  /** Gzipped bytes. */
  bytes: number
  /** The budget in bytes. */
  budget: number
}

/** Parses a budget such as `1 KB`, `12.5 KB` or `800 B` into bytes. */
export function parseBudget(text: string): number {
  const match = /^(\d+(?:\.\d+)?)\s*(B|KB)$/.exec(text.trim())
  if (!match?.[1] || !match[2])
    throw new Error(`Bad size budget "${text}": use "<n> KB" or "<n> B".`)
  return Math.round(Number(match[1]) * (match[2] === 'KB' ? 1024 : 1))
}

/** Bundles one entry point as an app would and returns its gzipped size. */
async function measure({
  specifier,
  resolveDir,
}: {
  specifier: string
  resolveDir: string
}): Promise<number> {
  const result = await build({
    stdin: {
      contents: `export * from '${specifier}'`,
      resolveDir,
      loader: 'js',
    },
    bundle: true,
    minify: true,
    format: 'esm',
    write: false,
    target: 'es2025',
    define: { 'process.env.NODE_ENV': '"production"' },
    external: ['react', 'react-dom', 'react/*'],
    logLevel: 'silent',
  })
  const code = result.outputFiles.map((file) => file.contents)
  return gzipSync(Buffer.concat(code), { level: 9 }).length
}

/** Measures every budgeted entry point of the package in `dir`. */
export async function checkBudgets(dir: string): Promise<BudgetResult[]> {
  const manifest = JSON.parse(
    readFileSync(join(dir, 'package.json'), 'utf8'),
  ) as {
    name: string
    bigCalendar?: { sizeBudgets?: Record<string, string> }
  }
  const budgets = manifest.bigCalendar?.sizeBudgets ?? {}
  return Promise.all(
    Object.entries(budgets).map(async ([subpath, budget]) => {
      const specifier =
        subpath === '.'
          ? manifest.name
          : `${manifest.name}/${subpath.replace(/^\.\//, '')}`
      return {
        specifier,
        bytes: await measure({ specifier, resolveDir: dir }),
        budget: parseBudget(budget),
      }
    }),
  )
}
