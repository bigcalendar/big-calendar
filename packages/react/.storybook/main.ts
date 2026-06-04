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
}

export default config
