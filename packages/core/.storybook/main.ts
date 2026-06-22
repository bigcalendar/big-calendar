import { resolve } from 'node:path'
import type { StorybookConfig } from '@storybook/react-vite'

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
        // Future framework packages: add one entry here per package.
        // vue: { title: 'Vue', url: './vue', index: './vue/index.json' },
      }
    : {
        react: {
          title: 'React',
          url: 'http://localhost:6006',
        },
        // Future framework packages: add one entry here per package.
        // vue: { title: 'Vue', url: 'http://localhost:6008' },
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
      '@big-calendar/core/utils': resolve(pkgs, 'core/src/utils/index.ts'),
      '@big-calendar/react': resolve(pkgs, 'react/src/index.ts'),
      '@big-calendar/storybook-shared': resolve(pkgs, 'storybook-shared/src/index.ts'),
      '@big-calendar/styles': resolve(pkgs, 'styles/src'),
    }
    // STORYBOOK_SITE_BASE is set in CI to the GitHub Pages root (e.g. /big-calendar/).
    // Local dev leaves this unset so the instance stays at /.
    config.base = process.env.STORYBOOK_SITE_BASE ?? '/'
    return config
  },
}

export default config
