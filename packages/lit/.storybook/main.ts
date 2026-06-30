import { resolve } from 'node:path'
import type { StorybookConfig } from '@storybook/web-components-vite'
import { packageAliases } from '../../aliases.ts'

const config: StorybookConfig = {
  stories: ['../stories/**/*.mdx', '../stories/**/*.stories.@(ts)'],
  addons: ['@storybook/addon-docs'],
  framework: {
    name: '@storybook/web-components-vite',
    options: {},
  },
  viteFinal: (config) => {
    const pkgs = resolve(import.meta.dirname, '../..')
    config.resolve ??= {}
    config.resolve.alias = {
      ...(config.resolve.alias as Record<string, string>),
      ...packageAliases(pkgs),
    }
    const siteBase = process.env.STORYBOOK_SITE_BASE
    config.base = siteBase ? `${siteBase}lit/` : '/'
    return config
  },
}

export default config
