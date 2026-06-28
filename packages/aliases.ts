import { resolve } from 'node:path'

/**
 * Canonical @big-calendar/* source aliases used by both vitest configs and
 * Storybook viteFinal hooks. Pass the absolute path to the `packages/`
 * directory (the common ancestor of all packages).
 *
 * The more-specific `core/utils` entry must precede `core` so Vite picks
 * the right entry point when resolving sub-path imports.
 */
export function packageAliases(pkgsDir: string): Record<string, string> {
  return {
    '@big-calendar/core/utils': resolve(pkgsDir, 'core/src/utils/index.ts'),
    '@big-calendar/core': resolve(pkgsDir, 'core/src/index.ts'),
    '@big-calendar/dnd': resolve(pkgsDir, 'dnd/src/index.ts'),
    '@big-calendar/localizer': resolve(pkgsDir, 'localizer/src/index.ts'),
    '@big-calendar/localizer-luxon': resolve(pkgsDir, 'localizer-luxon/src/index.ts'),
    '@big-calendar/localizer-temporal': resolve(pkgsDir, 'localizer-temporal/src/index.ts'),
    '@big-calendar/angular': resolve(pkgsDir, 'angular/src/index.ts'),
    '@big-calendar/react': resolve(pkgsDir, 'react/src/index.ts'),
    '@big-calendar/storybook-shared': resolve(pkgsDir, 'storybook-shared/src/index.ts'),
    '@big-calendar/styles': resolve(pkgsDir, 'styles/src'),
  }
}
