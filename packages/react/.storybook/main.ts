import { resolve } from 'node:path'
import type { StorybookConfig } from '@storybook/react-vite'

/**
 * Storybook config for `@big-calendar/react`. Stories and `.mdx` docs live in
 * the sibling `stories/` folder (Cutter, 2026-06-03) — kept out of the package
 * build (`tsconfig` includes only `src`) and out of Nx production cache inputs.
 */
const config: StorybookConfig = {
  stories: ['../stories/**/*.mdx', '../stories/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal: (config) => {
    // Point every @big-calendar/* import at the package source so CSS and TS
    // changes show up in Storybook immediately without a rebuild step.
    const pkgs = resolve(import.meta.dirname, '../..')
    config.resolve ??= {}
    config.resolve.alias = {
      ...(config.resolve.alias as Record<string, string>),
      '@big-calendar/core/utils': resolve(pkgs, 'core/src/utils/index.ts'),
      '@big-calendar/core': resolve(pkgs, 'core/src/index.ts'),
      '@big-calendar/dnd': resolve(pkgs, 'dnd/src/index.ts'),
      '@big-calendar/localizer': resolve(pkgs, 'localizer/src/index.ts'),
      '@big-calendar/localizer-luxon': resolve(pkgs, 'localizer-luxon/src/index.ts'),
      '@big-calendar/localizer-temporal': resolve(pkgs, 'localizer-temporal/src/index.ts'),
      '@big-calendar/storybook-shared': resolve(pkgs, 'storybook-shared/src/index.ts'),
      '@big-calendar/styles': resolve(pkgs, 'styles/src'),
    }
    return config
  },
}

export default config
