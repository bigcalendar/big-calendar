// Proves each lint and boundary rule catches the fixture written to break it (S0 exit criterion).
// The fixtures are ignored by the normal lint run, so this test lints them with ignores off.
import { ESLint } from 'eslint'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('../..', import.meta.url))
const eslint = new ESLint({ cwd: root, ignore: false })

const cases: readonly { file: string; rule: string; why: string }[] = [
  {
    file: 'kernel/src/imports-machines.function.ts',
    rule: '@nx/enforce-module-boundaries',
    why: 'the kernel imports nothing in the workspace',
  },
  {
    file: 'kernel/src/imports-react.function.ts',
    rule: '@nx/enforce-module-boundaries',
    why: 'the kernel never imports a framework',
  },
  {
    file: 'react-ui-parts/src/imports-core.component.tsx',
    rule: '@nx/enforce-module-boundaries',
    why: 'react-ui imports only the binding and styles',
  },
  {
    file: 'kernel/src/helpers.ts',
    rule: '@nx/workspace-file-suffix',
    why: 'D-46 file suffixes',
  },
  {
    file: 'kernel/src/undocumented.function.ts',
    rule: '@nx/workspace-require-tsdoc',
    why: 'TSDoc on every export (D-65)',
  },
  {
    file: 'kernel/src/arrow.function.ts',
    rule: 'func-style',
    why: 'function declarations (D-46)',
  },
  {
    file: 'kernel/src/two-params.function.ts',
    rule: 'max-params',
    why: 'one object parameter (D-46)',
  },
  {
    file: 'kernel/src/inner-html.function.ts',
    rule: 'no-restricted-syntax',
    why: 'no innerHTML (strict CSP)',
  },
  {
    file: 'react-binding/src/timer.hook.ts',
    rule: 'no-restricted-globals',
    why: 'no timers in the binding',
  },
  {
    file: 'react-binding/src/focus.hook.ts',
    rule: 'no-restricted-syntax',
    why: 'no focus logic in the binding',
  },
  {
    file: 'react-binding/src/keys.component.tsx',
    rule: 'no-restricted-syntax',
    why: 'no keyboard handling in the binding',
  },
  {
    file: 'react-binding/src/nameless.component.tsx',
    rule: '@nx/workspace-display-name',
    why: 'displayName on components (D-46)',
  },
  {
    file: 'react-ui-parts/src/stateful.component.tsx',
    rule: 'no-restricted-imports',
    why: 'react-ui holds no state',
  },
]

describe('lint fixtures', () => {
  it.each(cases)('$file fails $rule ($why)', async ({ file, rule }) => {
    const [result] = await eslint.lintFiles([`tools/fixtures/${file}`])
    const rules = result?.messages.map((message) => message.ruleId) ?? []
    expect(rules).toContain(rule)
  })

  it('passes the stand-in index files, so failures come from the rule under test', async () => {
    const results = await eslint.lintFiles([
      'tools/fixtures/kernel/src/index.ts',
      'tools/fixtures/machines/src/index.ts',
    ])
    expect(results.flatMap((result) => result.messages)).toEqual([])
  })
})
