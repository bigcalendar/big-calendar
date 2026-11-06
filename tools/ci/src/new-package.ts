// Writes a new published package with the S0 scaffold (new-package skill, D-97): package.json with
// its layer tag and size budget, the lib and spec tsconfigs, the shared Vite build and tests,
// AGENTS.md and CLAUDE.md, and an empty entry point.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

/** The layers a published package can belong to (architecture; Nx tags `layer:*`). */
export type Layer =
  | 'kernel'
  | 'machines'
  | 'binding'
  | 'ui'
  | 'styles'
  | 'module'
  | 'loader'
  | 'testing'
  | 'tooling'

/** What the new package is. */
export interface NewPackage {
  /** The workspace root. */
  root: string
  /** The folder and npm name under `@big-calendar/`, from the package map (D-60). */
  name: string
  layer: Layer
  /** One line: what it is. */
  purpose: string
  /** Workspace packages it depends on, by short name. */
  dependsOn: readonly string[]
}

const reactLayers: readonly Layer[] = ['binding', 'ui']

function json(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`
}

/** Writes the package and returns the files it created. Refuses to overwrite an existing folder. */
export function writePackage(spec: NewPackage): string[] {
  const dir = join(spec.root, 'packages', spec.name)
  if (existsSync(dir)) throw new Error(`packages/${spec.name} already exists.`)
  const react = reactLayers.includes(spec.layer)
  const lib = react ? ['es2025', 'dom', 'dom.iterable'] : ['es2025', 'dom']
  const files: Record<string, string> = {
    'package.json': json({
      name: `@big-calendar/${spec.name}`,
      version: '0.0.0',
      description: spec.purpose,
      license: 'MIT',
      type: 'module',
      sideEffects:
        spec.layer === 'loader'
          ? true
          : spec.layer === 'ui' || spec.layer === 'styles'
            ? ['**/*.css']
            : false,
      exports: {
        '.': {
          '@big-calendar/source': './src/index.ts',
          types: './dist/index.d.ts',
          default: './dist/index.js',
        },
        './package.json': './package.json',
      },
      files: ['dist'],
      scripts: {
        test: react
          ? 'vitest run --project firefox --project webkit && vitest run --project chromium --coverage'
          : 'vitest run',
      },
      ...(spec.dependsOn.length > 0 && {
        dependencies: Object.fromEntries(
          spec.dependsOn.map((dep) => [`@big-calendar/${dep}`, 'workspace:*']),
        ),
      }),
      ...(react && {
        peerDependencies: {
          react: '>=19',
          ...(spec.layer === 'ui' && { 'react-dom': '>=19' }),
        },
      }),
      bigCalendar: { sizeBudgets: { '.': '1 KB' } },
      nx: { name: spec.name, tags: [`layer:${spec.layer}`] },
    }),
    'tsconfig.json': json({
      files: [],
      include: [],
      references: [
        { path: './tsconfig.lib.json' },
        { path: './tsconfig.spec.json' },
      ],
    }),
    'tsconfig.lib.json': json({
      extends: '../../tsconfig.base.json',
      compilerOptions: {
        rootDir: 'src',
        outDir: 'dist',
        tsBuildInfoFile: 'tsconfig.lib.tsbuildinfo',
        lib,
        ...(react && { jsx: 'react-jsx' }),
      },
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
        'src/**/*.stories.tsx',
      ],
      references: spec.dependsOn.map((dep) => ({
        path: `../${dep}/tsconfig.lib.json`,
      })),
    }),
    'tsconfig.spec.json': json({
      extends: '../../tsconfig.base.json',
      compilerOptions: {
        lib,
        ...(react && { jsx: 'react-jsx' }),
        rootDir: 'src',
        outDir: 'out-tsc/spec',
        tsBuildInfoFile: 'out-tsc/tsconfig.spec.tsbuildinfo',
      },
      include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
      references: [{ path: './tsconfig.lib.json' }],
    }),
    'vite.config.ts': `import { coverage, libraryConfig } from '../../vite.library.ts'

export default libraryConfig({
  root: import.meta.dirname,
  entries: { '.': 'src/index.ts' },${react ? '\n  reactCompiler: true,' : ''}
  testEnvironment: '${react ? 'browser' : 'node'}',
  thresholds: coverage.${react ? 'react' : 'frameworkFree'},
})
`,
    'src/index.ts': `// @big-calendar/${spec.name}'s public surface.\nexport {}\n`,
    'AGENTS.md': `# @big-calendar/${spec.name}

${spec.purpose} Layer: \`layer:${spec.layer}\`.

## Boundaries

- May depend on: ${spec.dependsOn.length > 0 ? spec.dependsOn.map((dep) => `\`@big-calendar/${dep}\``).join(', ') : 'nothing in the workspace'}.
- Must not: TODO, from the architecture's dependency direction and this package's specs.

## Governing specs

- TODO: the docs/spec sections that apply.

## Commands

- \`pnpm nx build ${spec.name}\` · \`pnpm nx typecheck ${spec.name}\` · \`pnpm nx lint ${spec.name}\` · \`pnpm nx test ${spec.name}\`
`,
    'CLAUDE.md': '@AGENTS.md\n',
  }
  mkdirSync(join(dir, 'src'), { recursive: true })
  for (const [file, text] of Object.entries(files))
    writeFileSync(join(dir, file), text)
  return Object.keys(files).map((file) => `packages/${spec.name}/${file}`)
}
