import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

// Library build: ESM only, ES2024 target, all bare imports externalized so
// packages never bundle each other or their peers.
export default defineConfig({
  build: {
    target: 'es2024',
    sourcemap: true,
    lib: {
      entry: {
        index: resolve(import.meta.dirname, 'src/index.ts'),
        utils: resolve(import.meta.dirname, 'src/utils/index.ts'),
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
