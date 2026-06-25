import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

const pkgs = resolve(import.meta.dirname, '..')

export default defineConfig({
  resolve: {
    alias: {
      '@big-calendar/core/utils': resolve(pkgs, 'core/src/utils/index.ts'),
      '@big-calendar/core': resolve(pkgs, 'core/src/index.ts'),
      '@big-calendar/dnd': resolve(pkgs, 'dnd/src/index.ts'),
      '@big-calendar/localizer-luxon': resolve(pkgs, 'localizer-luxon/src/index.ts'),
      '@big-calendar/localizer-temporal': resolve(pkgs, 'localizer-temporal/src/index.ts'),
    },
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
