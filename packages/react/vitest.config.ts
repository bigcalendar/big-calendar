import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'
import { packageAliases } from '../aliases.ts'

const pkgs = resolve(import.meta.dirname, '..')

export default defineConfig({
  resolve: {
    alias: packageAliases(pkgs),
  },
  test: {
    reporters: ['dot'],
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      perFile: true,
      thresholds: { branches: 85, functions: 95 },
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.{test,spec}.{ts,tsx}', 'src/index.ts', 'src/testing/**'],
    },
  },
})
