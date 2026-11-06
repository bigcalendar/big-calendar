import { mkdirSync, mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { writePackage } from './new-package.ts'

function workspace(): string {
  const root = mkdtempSync(join(tmpdir(), 'new-package-'))
  mkdirSync(join(root, 'packages'))
  return root
}

describe('new-package scaffold', () => {
  it('writes a framework-free package that tests in Node with kernel coverage', () => {
    const root = workspace()
    writePackage({
      root,
      name: 'recurrence',
      layer: 'module',
      purpose: 'RRULE expansion.',
      dependsOn: ['core'],
    })
    const manifest = JSON.parse(
      readFileSync(join(root, 'packages/recurrence/package.json'), 'utf8'),
    ) as Record<string, unknown>
    expect(manifest).toMatchObject({
      name: '@big-calendar/recurrence',
      sideEffects: false,
      dependencies: { '@big-calendar/core': 'workspace:*' },
      nx: { name: 'recurrence', tags: ['layer:module'] },
    })
    const vite = readFileSync(
      join(root, 'packages/recurrence/vite.config.ts'),
      'utf8',
    )
    expect(vite).toContain("testEnvironment: 'node'")
    expect(vite).toContain('coverage.frameworkFree')
  })

  it('writes a React package with the compiler, browser tests and peers', () => {
    const root = workspace()
    writePackage({
      root,
      name: 'react-extra',
      layer: 'ui',
      purpose: 'Extra UI.',
      dependsOn: ['react'],
    })
    const vite = readFileSync(
      join(root, 'packages/react-extra/vite.config.ts'),
      'utf8',
    )
    expect(vite).toContain('reactCompiler: true')
    expect(vite).toContain("testEnvironment: 'browser'")
    const manifest = JSON.parse(
      readFileSync(join(root, 'packages/react-extra/package.json'), 'utf8'),
    ) as Record<string, unknown>
    expect(manifest).toMatchObject({
      sideEffects: ['**/*.css'],
      peerDependencies: { react: '>=19', 'react-dom': '>=19' },
    })
  })

  it('refuses to overwrite a package', () => {
    const root = workspace()
    writePackage({
      root,
      name: 'core',
      layer: 'kernel',
      purpose: 'Kernel.',
      dependsOn: [],
    })
    expect(() =>
      writePackage({
        root,
        name: 'core',
        layer: 'kernel',
        purpose: 'Kernel.',
        dependsOn: [],
      }),
    ).toThrow(/already exists/)
  })
})
