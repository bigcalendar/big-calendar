import type { StorybookConfig } from '@storybook/angular'

const config: StorybookConfig = {
  stories: ['../stories/**/*.mdx', '../stories/**/*.stories.@(ts)'],
  addons: ['@storybook/addon-docs'],
  framework: {
    name: '@storybook/angular',
    options: {},
  },
}

export default config
