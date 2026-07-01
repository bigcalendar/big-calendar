import { resolve } from 'node:path'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vitest/config'
import { packageAliases } from '../aliases.ts'

const pkgs = resolve(import.meta.dirname, '..')

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })],
  resolve: {
    alias: packageAliases(pkgs),
    conditions: ['browser'],
  },
  test: {
    reporters: ['dot'],
    environment: 'jsdom',
    globals: true,
    passWithNoTests: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      perFile: true,
      thresholds: { branches: 85, functions: 95 },
      include: ['src/**/*.ts', 'src/**/*.svelte', 'src/**/*.svelte.ts'],
      exclude: ['src/**/*.{test,spec}.ts', 'src/index.ts', 'src/testing/**'],
    },
  },
})
