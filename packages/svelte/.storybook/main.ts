import { resolve } from 'node:path'
import type { StorybookConfig } from '@storybook/svelte-vite'
import { packageAliases } from '../../aliases.ts'

const config: StorybookConfig = {
  stories: ['../stories/**/*.mdx', '../stories/**/*.stories.@(ts)'],
  addons: ['@storybook/addon-docs'],
  framework: {
    name: '@storybook/svelte-vite',
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
    config.base = siteBase ? `${siteBase}svelte/` : '/'
    return config
  },
}

export default config
