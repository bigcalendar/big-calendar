import { resolve } from 'node:path'
import type { StorybookConfig } from '@storybook/react-vite'

/**
 * Storybook config for `@big-calendar/core`. The core engine is headless (it
 * ships no components), so this is a docs-only Storybook — currently a single
 * placeholder welcome page. Docs live in the sibling `stories/` folder, kept out
 * of the package build and Nx production cache inputs.
 */
const config: StorybookConfig = {
  stories: ['../stories/**/*.mdx', '../stories/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal: (config) => {
    // Point every @big-calendar/* import at the package source so TS and
    // constant changes show up immediately without a rebuild step.
    const pkgs = resolve(import.meta.dirname, '../..')
    config.resolve ??= {}
    config.resolve.alias = {
      ...(config.resolve.alias as Record<string, string>),
      '@big-calendar/dnd': resolve(pkgs, 'dnd/src/index.ts'),
      '@big-calendar/localizer': resolve(pkgs, 'localizer/src/index.ts'),
      '@big-calendar/localizer-luxon': resolve(pkgs, 'localizer-luxon/src/index.ts'),
      '@big-calendar/localizer-temporal': resolve(pkgs, 'localizer-temporal/src/index.ts'),
      '@big-calendar/react': resolve(pkgs, 'react/src/index.ts'),
      '@big-calendar/styles': resolve(pkgs, 'styles/src'),
    }
    return config
  },
}

export default config
