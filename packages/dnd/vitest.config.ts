import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

const pkgs = resolve(import.meta.dirname, '..')

export default defineConfig({
  resolve: {
    alias: {
      '@big-calendar/core': resolve(pkgs, 'core/src/index.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      perFile: true,
      thresholds: { branches: 85, functions: 95 },
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.{test,spec}.ts', 'src/index.ts'],
    },
  },
})
