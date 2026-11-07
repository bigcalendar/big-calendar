// The published packages and their built files, read from the workspace.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

/** The workspace root. */
export const root = fileURLToPath(new URL('../../..', import.meta.url))

/** A published package, as the checks see it. */
export interface PublishedPackage {
  /** The npm name, such as `@big-calendar/core`. */
  name: string
  /** Its folder. */
  dir: string
  /** `package.json`'s `sideEffects`. */
  sideEffects: boolean | readonly string[]
}

/** Every package in `packages/`. */
export function publishedPackages(): PublishedPackage[] {
  const dir = join(root, 'packages')
  return readdirSync(dir).map((folder) => {
    const manifest = JSON.parse(
      readFileSync(join(dir, folder, 'package.json'), 'utf8'),
    ) as {
      name: string
      sideEffects: boolean | string[]
    }
    return {
      name: manifest.name,
      dir: join(dir, folder),
      sideEffects: manifest.sideEffects,
    }
  })
}

/** The built JavaScript files in a package's `dist`. */
export function builtFiles(pkg: PublishedPackage): string[] {
  const dist = join(pkg.dir, 'dist')
  return readdirSync(dist, { recursive: true, encoding: 'utf8' })
    .filter((file) => file.endsWith('.js'))
    .map((file) => join(dist, file))
}
