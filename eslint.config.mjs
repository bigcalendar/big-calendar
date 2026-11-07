// Lint for the whole workspace. Everything enforceable lives here (D-46): the dependency direction
// (architecture), the D-46 code standards, TSDoc (D-65), the layer limits on the binding and the
// prebuilt UI (architecture, docs/standards/react.md) and the security rules (docs/standards/code.md).
import js from '@eslint/js'
import nx from '@nx/eslint-plugin'
import reactHooks from 'eslint-plugin-react-hooks'
import tsdoc from 'eslint-plugin-tsdoc'
import tseslint from 'typescript-eslint'

/** The Node globals our scripts use; listed here rather than adding the `globals` package. */
const nodeGlobals = {
  process: 'readonly',
  console: 'readonly',
  URL: 'readonly',
  Buffer: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  structuredClone: 'readonly',
  performance: 'readonly',
}

/** Which layers each layer may import (architecture, "Dependency direction"). */
const depConstraints = [
  { sourceTag: 'layer:kernel', onlyDependOnLibsWithTags: [] },
  { sourceTag: 'layer:loader', onlyDependOnLibsWithTags: [] },
  { sourceTag: 'layer:styles', onlyDependOnLibsWithTags: [] },
  { sourceTag: 'layer:machines', onlyDependOnLibsWithTags: ['layer:kernel'] },
  { sourceTag: 'layer:module', onlyDependOnLibsWithTags: ['layer:kernel'] },
  {
    sourceTag: 'layer:binding',
    onlyDependOnLibsWithTags: ['layer:kernel', 'layer:machines'],
  },
  {
    sourceTag: 'layer:ui',
    onlyDependOnLibsWithTags: ['layer:binding', 'layer:styles'],
  },
  {
    sourceTag: 'layer:testing',
    onlyDependOnLibsWithTags: [
      'layer:kernel',
      'layer:machines',
      'layer:binding',
      'layer:loader',
    ],
  },
  { sourceTag: 'layer:tooling', onlyDependOnLibsWithTags: ['*'] },
  // The kernel and the machines never touch a framework.
  {
    sourceTag: 'layer:kernel',
    bannedExternalImports: ['react', 'react-dom', 'react/*', 'react-dom/*'],
  },
  {
    sourceTag: 'layer:machines',
    bannedExternalImports: ['react', 'react-dom', 'react/*', 'react-dom/*'],
  },
]

/** Code that may never set HTML from strings (strict CSP, gap #15; docs/standards/code.md). */
const noHtmlSinks = [
  {
    selector: 'MemberExpression[property.name=/^(innerHTML|outerHTML)$/]',
    message:
      'No innerHTML or outerHTML: the code runs under a strict CSP with Trusted Types (gap #15).',
  },
  {
    selector: "CallExpression[callee.property.name='insertAdjacentHTML']",
    message:
      'No insertAdjacentHTML: the code runs under a strict CSP with Trusted Types (gap #15).',
  },
  {
    selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
    message:
      'Nothing in Big Calendar renders HTML fields (docs/standards/react.md).',
  },
]

/** Behavior that belongs in the machines, never in the binding or the prebuilt UI (architecture). */
const noBehavior = [
  {
    selector: "CallExpression[callee.property.name='focus']",
    message:
      'Focus belongs to the interaction machines, not the React layers (architecture).',
  },
  {
    selector:
      'CallExpression[callee.property.name=/^(elementFromPoint|elementsFromPoint|getBoundingClientRect|getClientRects)$/]',
    message:
      'Hit-testing belongs to the interaction machines, not the React layers (architecture).',
  },
  {
    selector: 'JSXAttribute[name.name=/^onKey(Down|Up|Press)$/]',
    message:
      'Keyboard handling belongs to the interaction machines; spread the getter props instead.',
  },
  {
    selector: 'TSTypeReference[typeName.name=/^(KeyboardEvent)$/]',
    message:
      'Keyboard handling belongs to the interaction machines (architecture).',
  },
]
const noTimers = [
  'setTimeout',
  'setInterval',
  'clearTimeout',
  'clearInterval',
  'requestAnimationFrame',
  'cancelAnimationFrame',
  'requestIdleCallback',
].map((name) => ({
  name,
  message:
    'Timers belong to the machines runtime, not the React layers (architecture).',
}))

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      '**/out-tsc/**',
      '**/.next/**',
      '**/node_modules/**',
      '**/storybook-static/**',
      'plan/**',
      'prototypes/**',
      // Fixtures break the rules on purpose; tools/fixtures/lint-fixtures.test.ts lints them.
      'tools/fixtures/*/src/**',
      // Type fixtures: they break types on purpose; tools/type-checks/check-fail.mjs checks them.
      'tools/type-checks/src/**',
      'tools/type-checks/fail/**',
    ],
  },
  js.configs.recommended,
  ...nx.configs['flat/base'],
  {
    files: ['**/*.{ts,tsx,js,mjs}'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [],
          depConstraints,
        },
      ],
    },
  },
  // TypeScript, type-checked, in packages and tools.
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { tsdoc },
    rules: {
      'tsdoc/syntax': 'error',
      // The P5 types use mapped types on purpose: an error type must be an inlined mapped type, or
      // the error shows an alias name instead of its message (api.md section 1.3, typing rule).
      '@typescript-eslint/consistent-indexed-object-style': 'off',
      // D-46: function declarations for named functions, each taking one object parameter when it
      // needs more than one value. Inline callbacks are exempt (D-102).
      'func-style': ['error', 'declaration'],
      '@nx/workspace-single-object-param': 'error',
      'no-restricted-syntax': ['error', ...noHtmlSinks],
    },
  },
  // Published package sources: D-46 suffixes and TSDoc on every export.
  {
    files: [
      'packages/*/src/**/*.{ts,tsx}',
      'tools/fixtures/*/src/**/*.{ts,tsx}',
    ],
    rules: {
      '@nx/workspace-file-suffix': 'error',
      '@nx/workspace-require-tsdoc': 'error',
    },
  },
  // React packages: the compiler's rules (D-47) and displayName (D-46).
  {
    files: [
      'packages/{react,react-ui}/src/**/*.{ts,tsx}',
      'tools/fixtures/react-*/**/*.{ts,tsx}',
    ],
    extends: [reactHooks.configs.flat['recommended-latest']],
    rules: { '@nx/workspace-display-name': 'error' },
  },
  // The binding and the prebuilt UI hold no behavior (architecture; docs/standards/react.md).
  {
    files: [
      'packages/{react,react-ui}/src/**/*.{ts,tsx}',
      'tools/fixtures/react-*/**/*.{ts,tsx}',
    ],
    rules: {
      'no-restricted-globals': ['error', ...noTimers],
      'no-restricted-syntax': ['error', ...noHtmlSinks, ...noBehavior],
    },
  },
  // react-ui also keeps no state and no effects: markup and composition only.
  {
    files: [
      'packages/react-ui/src/**/*.{ts,tsx}',
      'tools/fixtures/react-ui-*/**/*.{ts,tsx}',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react',
              importNames: [
                'useState',
                'useReducer',
                'useEffect',
                'useLayoutEffect',
              ],
              message:
                'react-ui holds no behavior or state; it composes the binding (docs/standards/react.md).',
            },
          ],
        },
      ],
    },
  },
  // Type files: `{}` is the empty piece the P5 types intersect with (a family with no state, a view
  // set without a family). `object` isn't equivalent: it has no index signature, so `DefaultViews`
  // stops satisfying `Record<string, ViewDefinition>`.
  {
    files: ['packages/*/src/**/*.type.ts'],
    rules: { '@typescript-eslint/no-empty-object-type': 'off' },
  },
  // Tests and stories don't need TSDoc or suffix checks beyond their own names.
  {
    files: ['**/*.test.{ts,tsx}', '**/*.test-d.ts', '**/*.stories.tsx'],
    rules: {
      '@nx/workspace-require-tsdoc': 'off',
      '@nx/workspace-single-object-param': 'off',
    },
  },
  // Build configs sit outside every package's TypeScript project: lint them without types.
  {
    files: ['vite.library.ts', '**/vite.config.ts', '**/*.config.ts'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { parserOptions: { projectService: false } },
    // Build configs aren't library code; they share the root build helper by path.
    rules: { '@nx/enforce-module-boundaries': 'off' },
  },
  // Plain JavaScript (configs, tools, agent hooks): Node scripts, no type information.
  {
    files: ['**/*.{js,mjs,cjs,jsx}'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: {
      globals: nodeGlobals,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  // The Jest smoke tests use Jest's globals, as apps on Jest do.
  {
    files: ['tools/smoke/jest-*/src/**'],
    languageOptions: { globals: { test: 'readonly', expect: 'readonly' } },
  },
)
