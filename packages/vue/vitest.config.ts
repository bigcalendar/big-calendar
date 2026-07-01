import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { packageAliases } from '../aliases.ts'

const pkgs = resolve(import.meta.dirname, '..')

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: packageAliases(pkgs),
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
      include: ['src/**/*.{ts,vue}'],
      exclude: ['src/**/*.{test,spec}.ts', 'src/index.ts', 'src/testing/**'],
    },
  },
})
