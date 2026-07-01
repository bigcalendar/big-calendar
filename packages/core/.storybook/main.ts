import { resolve } from 'node:path'
import type { StorybookConfig } from '@storybook/react-vite'
import { packageAliases } from '../../aliases.ts'

/**
 * Storybook config for `@big-calendar/core`. This instance is the composition
 * hub — it owns the core engine docs and embeds all framework packages as refs.
 * Docs live in the sibling `stories/` folder, kept out of the package build and
 * Nx production cache inputs.
 *
 * STORYBOOK_BUILD=true   → static build mode; refs use relative paths so the
 *                          assembled dist/storybook-static/ is self-contained.
 * (unset)                → dev mode; refs load from localhost dev servers.
 */
const isStaticBuild = process.env.STORYBOOK_BUILD === 'true'

const config: StorybookConfig = {
  stories: ['../stories/**/*.mdx', '../stories/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  refs: isStaticBuild
    ? {
        react: {
          title: 'React',
          url: './react',
          index: './react/index.json',
        },
        vue: { title: 'Vue', url: './vue', index: './vue/index.json' },
        angular: { title: 'Angular', url: './angular', index: './angular/index.json' },
        lit: { title: 'Lit', url: './lit', index: './lit/index.json' },
        svelte: { title: 'Svelte', url: './svelte', index: './svelte/index.json' },
      }
    : {
        react: {
          title: 'React',
          url: 'http://localhost:6006',
        },
        vue: { title: 'Vue', url: 'http://localhost:6008' },
        angular: { title: 'Angular', url: 'http://localhost:6009' },
        lit: { title: 'Lit', url: 'http://localhost:6010' },
        svelte: { title: 'Svelte', url: 'http://localhost:6011' },
      },
  viteFinal: (config) => {
    const pkgs = resolve(import.meta.dirname, '../..')
    config.resolve ??= {}
    config.resolve.alias = {
      ...(config.resolve.alias as Record<string, string>),
      ...packageAliases(pkgs),
    }
    // STORYBOOK_SITE_BASE is set in CI to the GitHub Pages root (e.g. /big-calendar/).
    // Local dev leaves this unset so the instance stays at /.
    config.base = process.env.STORYBOOK_SITE_BASE ?? '/'
    return config
  },
}

export default config
