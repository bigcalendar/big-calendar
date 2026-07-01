import { resolve } from 'node:path'
import type { StorybookConfig } from '@storybook/react-vite'
import { packageAliases } from '../../aliases.ts'

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
    const pkgs = resolve(import.meta.dirname, '../..')
    config.resolve ??= {}
    config.resolve.alias = {
      ...(config.resolve.alias as Record<string, string>),
      ...packageAliases(pkgs),
    }
    // STORYBOOK_SITE_BASE is set in CI to the GitHub Pages root (e.g. /big-calendar/).
    // This instance mounts under the /react/ subpath in the composed site.
    // Local dev leaves this unset so the instance stays at /.
    const siteBase = process.env.STORYBOOK_SITE_BASE
    config.base = siteBase ? `${siteBase}react/` : '/'
    return config
  },
}

export default config
