import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

const SRC = resolve(import.meta.dirname, 'src')
const SKIP_DIRS = new Set(['internal', 'testing'])

// One entry per public src/<Name>/ directory.
// The entry key uses the "<Name>/index" form so Vite's Rollup outputs
// dist/<Name>/index.js, matching the package.json "./*" wildcard exactly.
const subpathEntries = Object.fromEntries(
  readdirSync(SRC, { withFileTypes: true })
    .filter(d => d.isDirectory() && !SKIP_DIRS.has(d.name))
    .map(d => [`${d.name}/index`, resolve(SRC, d.name, 'index.ts')])
)

export default defineConfig({
  build: {
    target: 'es2024',
    sourcemap: true,
    lib: {
      entry: {
        index: resolve(SRC, 'index.ts'),
        ...subpathEntries,
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: (id) => !id.startsWith('.') && !id.startsWith('/'),
    },
  },
  plugins: [
    dts({ tsconfigPath: resolve(import.meta.dirname, 'tsconfig.json') }),
  ],
})
