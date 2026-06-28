import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'
import angular from '@analogjs/vite-plugin-angular'
import { packageAliases } from '../aliases.ts'

const pkgs = resolve(import.meta.dirname, '..')

export default defineConfig({
  plugins: [angular({ tsconfig: resolve(import.meta.dirname, 'tsconfig.json') })],
  resolve: {
    alias: packageAliases(pkgs),
  },
  test: {
    reporters: ['dot'],
    environment: 'jsdom',
    globals: true,
    passWithNoTests: true,
    setupFiles: ['@analogjs/vitest-angular/setup-zone', './vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      perFile: true,
      thresholds: { branches: 85, functions: 95 },
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.{test,spec}.ts', 'src/index.ts', 'src/testing/**'],
    },
  },
})
