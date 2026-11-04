// D-47: the React packages build with the React Compiler. The shared build helper, with
// `reactCompiler: true` as the react and react-ui configs pass it, must compile a component.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { build, type Rolldown } from 'vite'
import { describe, expect, it } from 'vitest'
// eslint-disable-next-line @nx/enforce-module-boundaries -- the root build helper belongs to no project
import { libraryConfig } from '../../../vite.library'
import { root } from './packages.function'

async function buildFixture(reactCompiler: boolean): Promise<string> {
  const config = libraryConfig({
    root: join(root, 'tools/fixtures/react-compiler'),
    entries: { '.': 'src/greeting.component.tsx' },
    reactCompiler,
  })
  const output = (await build({
    ...config,
    logLevel: 'silent',
    build: { ...config.build, write: false, sourcemap: false },
  })) as Rolldown.RolldownOutput[]
  return output
    .flatMap((result) =>
      result.output.map((chunk) => ('code' in chunk ? chunk.code : '')),
    )
    .join('')
}

describe('React Compiler', () => {
  it('compiles components when reactCompiler is on', async () => {
    expect(await buildFixture(true)).toContain('react/compiler-runtime')
  })

  it('leaves them alone when it is off, so the check above means something', async () => {
    expect(await buildFixture(false)).not.toContain('react/compiler-runtime')
  })

  it('is on for both React packages', () => {
    for (const pkg of ['react', 'react-ui']) {
      const config = readFileSync(
        join(root, 'packages', pkg, 'vite.config.ts'),
        'utf8',
      )
      expect(config, pkg).toContain('reactCompiler: true')
    }
  })
})
