// D-21: every package is compiled to ES2025. esbuild lowers anything newer when asked for an es2025
// target, so a built file that changes under that transform holds newer syntax.
import { transform } from 'esbuild'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { builtFiles, publishedPackages, root } from './packages.function'

async function newerThanEs2025(code: string): Promise<boolean> {
  const options = {
    format: 'esm',
    legalComments: 'none',
    minifyWhitespace: true,
  } as const
  const [esnext, es2025] = await Promise.all([
    transform(code, { ...options, target: 'esnext' }),
    transform(code, { ...options, target: 'es2025' }),
  ])
  return esnext.code !== es2025.code
}

describe('ES2025 output', () => {
  for (const pkg of publishedPackages()) {
    it(`${pkg.name} has no syntax newer than ES2025`, async () => {
      const files = builtFiles(pkg)
      expect(files.length).toBeGreaterThan(0)
      for (const file of files) {
        expect(await newerThanEs2025(readFileSync(file, 'utf8')), file).toBe(
          false,
        )
      }
    })
  }

  it('catches syntax newer than ES2025 (fixture)', async () => {
    const code = readFileSync(
      join(root, 'tools/fixtures/build/src/esnext.js'),
      'utf8',
    )
    expect(await newerThanEs2025(code)).toBe(true)
  })
})
