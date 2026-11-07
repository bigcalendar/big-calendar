// D-63: every package is side-effect-free except the CSS and the `temporal` loader. Importing a
// package only for its side effects must bundle to nothing, even with the `sideEffects` hint
// ignored, so the hint can't hide real top-level effects.
import { build } from 'esbuild'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { publishedPackages, root } from './packages.function'

async function sideEffectOutput(entry: {
  contents: string
  resolveDir: string
}): Promise<string> {
  const result = await build({
    stdin: { ...entry, loader: 'js' },
    bundle: true,
    write: false,
    format: 'esm',
    minify: true,
    ignoreAnnotations: true,
    external: ['react', 'react-dom', 'react/*'],
    logLevel: 'silent',
  })
  return result.outputFiles
    .map((file) => file.text)
    .join('')
    .trim()
}

describe('side effects', () => {
  // `false`, or side effects only in CSS files: the JavaScript must be pure either way.
  const pure = publishedPackages().filter(
    (pkg) =>
      pkg.sideEffects === false ||
      (typeof pkg.sideEffects !== 'boolean' &&
        pkg.sideEffects.every((glob) => glob.endsWith('.css')) &&
        pkg.name !== '@big-calendar/styles'),
  )

  it('covers every package except the temporal loader and styles', () => {
    expect(pure.map((pkg) => pkg.name).sort()).toEqual([
      '@big-calendar/core',
      '@big-calendar/interactions',
      '@big-calendar/react',
      '@big-calendar/react-ui',
      '@big-calendar/testing',
    ])
  })

  for (const pkg of pure) {
    it(`${pkg.name} has no top-level side effects`, async () => {
      const output = await sideEffectOutput({
        contents: `import '${pkg.name}'`,
        resolveDir: join(root, 'tools/size'),
      })
      expect(output).toBe('')
    })
  }

  it('catches a top-level side effect (fixture)', async () => {
    const output = await sideEffectOutput({
      contents: `import './side-effect.js'`,
      resolveDir: join(root, 'tools/fixtures/build/src'),
    })
    expect(output).not.toBe('')
  })
})
