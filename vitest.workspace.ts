import { defineWorkspace } from 'vitest/config'

/**
 * Aggregates every package's Vitest config so `nx run-many -t test` and a
 * root `vitest` run resolve the same suites. New packages are picked up by
 * the glob as their `vitest.config.ts` lands.
 */
export default defineWorkspace([
  'packages/*/vitest.config.ts',
  'apps/*/vitest.config.ts',
])
