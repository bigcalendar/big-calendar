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
    environment: 'node',
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
