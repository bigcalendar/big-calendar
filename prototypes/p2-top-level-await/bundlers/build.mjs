// Builds every scenario with every bundler into dist/<build>/<scenario>.html.
import {
  cpSync,
  mkdirSync,
  rmSync,
  writeFileSync,
  readdirSync,
  readFileSync,
} from 'node:fs'
import { join, resolve } from 'node:path'
import { build as viteBuild } from 'vite'
import { rollup } from 'rollup'
import * as esbuild from 'esbuild'
import webpack from 'webpack'
import { rspack } from '@rspack/core'

const root = resolve(import.meta.dirname)
const src = join(root, 'src')
const dist = join(root, 'dist')
export const SCENARIOS = ['static', 'concurrent', 'mixed', 'many', 'late']
const only = process.argv[2]

function html({ build, script, module = true }) {
  return `<!doctype html><html data-build="${build}"><head><meta charset="utf-8"></head><body>running<script ${module ? 'type="module" ' : ''}src="${script}"></script></body></html>\n`
}
const entries = Object.fromEntries(
  SCENARIOS.map((s) => [s, join(src, `${s}.js`)]),
)
const results = {}

async function step(name, fn) {
  if (only && only !== name) return
  const out = join(dist, name)
  rmSync(out, { recursive: true, force: true })
  mkdirSync(out, { recursive: true })
  try {
    await fn(out)
    // Where did the polyfill end up? It should be in its own file, not in an entry.
    const files = readdirSync(out, { recursive: true }).filter((f) =>
      /\.m?js$/.test(f),
    )
    const withMarker = files.filter((f) =>
      readFileSync(join(out, f), 'utf8').includes('BC_FAKE_POLYFILL_MARKER'),
    )
    const entryNames = new Set(
      SCENARIOS.flatMap((s) => [`${s}.js`, `assets/${s}.js`]),
    )
    results[name] = {
      ok: true,
      polyfillFiles: withMarker,
      polyfillInEntry: withMarker.some((f) => entryNames.has(f)),
    }
  } catch (error) {
    results[name] = {
      ok: false,
      error: String(error?.message ?? error).slice(0, 2000),
    }
  }
}

await step('unbundled', (out) => {
  cpSync(src, out, { recursive: true })
  for (const s of SCENARIOS)
    writeFileSync(
      join(out, `${s}.html`),
      html({ build: 'unbundled', script: `./${s}.js` }),
    )
})

await step('vite', async (out) => {
  const pages = join(root, '.vite-pages')
  rmSync(pages, { recursive: true, force: true })
  mkdirSync(pages)
  cpSync(src, join(pages, 'src'), { recursive: true })
  for (const s of SCENARIOS)
    writeFileSync(
      join(pages, `${s}.html`),
      html({ build: 'vite', script: `./src/${s}.js` }),
    )
  await viteBuild({
    root: pages,
    logLevel: 'warn',
    configFile: false,
    base: './',
    build: {
      outDir: out,
      emptyOutDir: true,
      minify: false,
      rollupOptions: {
        input: Object.fromEntries(
          SCENARIOS.map((s) => [s, join(pages, `${s}.html`)]),
        ),
      },
    },
  })
})

await step('rollup', async (out) => {
  const bundle = await rollup({ input: entries })
  await bundle.write({ dir: out, format: 'es', entryFileNames: '[name].js' })
  for (const s of SCENARIOS)
    writeFileSync(
      join(out, `${s}.html`),
      html({ build: 'rollup', script: `./${s}.js` }),
    )
})

await step('esbuild', async (out) => {
  await esbuild.build({
    entryPoints: entries,
    bundle: true,
    splitting: true,
    format: 'esm',
    outdir: out,
    logLevel: 'warning',
  })
  for (const s of SCENARIOS)
    writeFileSync(
      join(out, `${s}.html`),
      html({ build: 'esbuild', script: `./${s}.js` }),
    )
})

function runCompiler(compiler) {
  return new Promise((ok, fail) =>
    compiler.run((err, stats) => {
      if (err) return fail(err)
      if (stats.hasErrors())
        return fail(new Error(stats.toString({ all: false, errors: true })))
      ok()
    }),
  )
}
const packConfig = (out) => ({
  mode: 'production',
  context: root,
  entry: entries,
  output: { path: out, filename: '[name].js', publicPath: 'auto' },
  optimization: { minimize: false },
  devtool: false,
})

await step('webpack', async (out) => {
  await runCompiler(webpack(packConfig(out)))
  for (const s of SCENARIOS)
    writeFileSync(
      join(out, `${s}.html`),
      html({ build: 'webpack', script: `./${s}.js`, module: false }),
    )
})

await step('rspack', async (out) => {
  await runCompiler(rspack(packConfig(out)))
  for (const s of SCENARIOS)
    writeFileSync(
      join(out, `${s}.html`),
      html({ build: 'rspack', script: `./${s}.js`, module: false }),
    )
})

writeFileSync(
  join(dist, 'build-results.json'),
  JSON.stringify(results, null, 2),
)
console.log(JSON.stringify(results, null, 2))
