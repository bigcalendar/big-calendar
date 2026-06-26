import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import type { Plugin } from 'vite'

function shebanPlugin(): Plugin {
  return {
    name: 'shebang-cli',
    generateBundle(_options, bundle) {
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (fileName === 'cli.js' && chunk.type === 'chunk') {
          chunk.code = `#!/usr/bin/env node\n${chunk.code}`
        }
      }
    },
  }
}

export default defineConfig({
  build: {
    target: 'es2024',
    sourcemap: true,
    lib: {
      entry: {
        index: resolve(import.meta.dirname, 'src/index.ts'),
        cli: resolve(import.meta.dirname, 'src/cli.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: (id) => !id.startsWith('.') && !id.startsWith('/'),
    },
  },
  plugins: [
    dts({ tsconfigPath: resolve(import.meta.dirname, 'tsconfig.json') }),
    shebanPlugin(),
  ],
})
