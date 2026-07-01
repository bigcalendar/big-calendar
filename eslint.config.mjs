import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import nx from '@nx/eslint-plugin'
import prettier from 'eslint-config-prettier'
import globals from 'globals'

/**
 * Flat ESLint config for the Big Calendar workspace.
 *
 * - typescript-eslint (non-type-checked) base rules
 * - @nx/enforce-module-boundaries enforces the §3 dependency graph via scope tags
 * - Appendix A naming rules for types/interfaces/enums
 * - prettier turns off all stylistic rules (Prettier owns formatting)
 */
export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      '**/node_modules/**',
      '**/storybook-static/**',
      '.nx/**',
      '**/*.config.*',
      '**/vitest.workspace.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { '@nx': nx },
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [],
          depConstraints: [
            {
              sourceTag: 'scope:localizer',
              onlyDependOnLibsWithTags: ['scope:localizer'],
            },
            {
              sourceTag: 'scope:core',
              onlyDependOnLibsWithTags: ['scope:core', 'scope:localizer'],
            },
            {
              sourceTag: 'scope:styles',
              onlyDependOnLibsWithTags: [],
            },
            {
              sourceTag: 'scope:dnd',
              onlyDependOnLibsWithTags: ['scope:core', 'scope:dnd'],
            },
            {
              sourceTag: 'scope:ui',
              onlyDependOnLibsWithTags: [
                'scope:core',
                'scope:styles',
                'scope:dnd',
                'scope:localizer',
                'scope:ui',
              ],
            },
            {
              sourceTag: 'scope:tooling',
              onlyDependOnLibsWithTags: ['*'],
            },
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'typeLike', format: ['PascalCase'] },
        {
          selector: 'interface',
          format: ['PascalCase'],
          custom: { regex: '^I[A-Z]', match: false },
        },
      ],
    },
  },
  prettier,
)
