// The one library build every package uses (D-21, D-97): ESM only, ES2025 output, one file per public
// entry point, every dependency external. `tsc --build` writes the declarations next to it (the
// `typecheck` target), so Vite must not empty `dist`.
import babel from '@rolldown/plugin-babel'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { defineConfig, type UserConfig } from 'vite'

/** Options for {@link libraryConfig}. */
export interface LibraryOptions {
  /** The package folder; pass `import.meta.dirname`. */
  root: string
  /** Public entry points: published subpath (`.`, `./dnd`) to source file. */
  entries: Readonly<Record<string, string>>
  /** Compile with the React Compiler (D-47): `react` and `react-ui` only. */
  reactCompiler?: boolean
}

/** Turns `./dnd` into the output file name `dnd`, and `.` into `index`. */
function outputName(subpath: string): string {
  return subpath === '.' ? 'index' : subpath.replace(/^\.\//, '')
}

/** Builds a package's Vite config. */
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
  })
}
