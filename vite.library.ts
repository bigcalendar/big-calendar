/// <reference types="vitest/config" />
// The one library build every package uses (D-21, D-97): ESM only, ES2025 output, one file per public
// entry point, every dependency external. `tsc --build` writes the declarations next to it (the
// `typecheck` target), so Vite must not empty `dist`. The same config runs the package's unit tests
// (D-42): in Node for framework-free packages, in real browsers for the React ones, never jsdom.
import babel from '@rolldown/plugin-babel'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig, type UserConfig } from 'vite'

/** Coverage thresholds per package, never per file (D-42, D-100). */
export const coverage = {
  /** Kernel, machines, modules, and the framework-free `temporal` and `testing` packages. */
  frameworkFree: { branches: 90, lines: 95 },
  /** The binding and the prebuilt UI. */
  react: { branches: 80 },
} as const

/** Options for {@link libraryConfig}. */
export interface LibraryOptions {
  /** The package folder; pass `import.meta.dirname`. */
  root: string
  /** Public entry points: published subpath (`.`, `./dnd`) to source file. */
  entries: Readonly<Record<string, string>>
  /** Compile with the React Compiler (D-47): `react` and `react-ui` only. */
  reactCompiler?: boolean
  /** Where unit tests run: Node, or Chromium, Firefox and WebKit through Playwright. */
  testEnvironment: 'node' | 'browser'
  /** The package's coverage thresholds, or `false` for a package with no JavaScript (`styles`). */
  thresholds: Readonly<{ branches?: number; lines?: number }> | false
}

/** Turns `./dnd` into the output file name `dnd`, and `.` into `index`. */
function outputName(subpath: string): string {
  return subpath === '.' ? 'index' : subpath.replace(/^\.\//, '')
}

/** Builds a package's Vite config, for both its build and its unit tests. */
export function libraryConfig(options: LibraryOptions): UserConfig {
  const entry = Object.fromEntries(
    Object.entries(options.entries).map(([subpath, file]) => [
      outputName(subpath),
      file,
    ]),
  )
  return defineConfig({
    root: options.root,
    plugins: options.reactCompiler
      ? [react(), babel({ presets: [reactCompilerPreset()] })]
      : [],
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      target: 'es2025',
      minify: false,
      sourcemap: true,
      lib: { entry, formats: ['es'] },
      rolldownOptions: {
        // Bare imports are dependencies or peers; consumers' bundlers resolve them.
        external: (id) =>
          !id.startsWith('.') && !id.startsWith('/') && !id.startsWith('\0'),
        output: { preserveModules: false },
      },
    },
    test: {
      include: ['src/**/*.test.{ts,tsx}'],
      passWithNoTests: true,
      ...(options.testEnvironment === 'browser'
        ? {
            browser: {
              enabled: true,
              headless: true,
              provider: playwright(),
              instances: [
                { browser: 'chromium' },
                { browser: 'firefox' },
                { browser: 'webkit' },
              ],
            },
          }
        : { environment: 'node' }),
      coverage: {
        // V8 coverage works only in Chromium (D-101): browser packages collect it in a separate
        // Chromium run (their `test` script), while every engine runs the tests.
        enabled:
          options.thresholds !== false && options.testEnvironment === 'node',
        provider: 'v8',
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/**/*.test.{ts,tsx}', 'src/**/*.stories.tsx'],
        reportsDirectory: 'coverage',
        thresholds:
          options.thresholds === false ? {} : { ...options.thresholds },
      },
    },
  })
}
