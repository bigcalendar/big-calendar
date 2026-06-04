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
}

export default config
