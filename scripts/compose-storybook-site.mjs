/**
 * Assembles the composed Storybook site by embedding each framework package's
 * built output into the core hub's build output as a ref subdirectory.
 *
 * Run after all per-package `build-storybook` targets have completed.
 * The hub (packages/core/storybook-static/) is the deployment root; each ref
 * is nested inside it so the entire site is one self-contained static artifact.
 *
 * To add a future framework package:
 *   1. Add its build to storybook-site:build in storybook-site/project.json
 *   2. Add one line to REFS below
 *   3. Add a matching entry in packages/core/.storybook/main.ts refs config
 */
import { access, cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { constants } from 'node:fs'
import { resolve, join } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')

const HUB_DIST = join(ROOT, 'packages/core/storybook-static')

/** ref name → source dist path */
const REFS = [
  { name: 'react',   dist: join(ROOT, 'packages/react/storybook-static') },
  { name: 'vue',     dist: join(ROOT, 'packages/vue/storybook-static') },
  { name: 'angular', dist: join(ROOT, 'packages/angular/storybook-static') },
  { name: 'lit',     dist: join(ROOT, 'packages/lit/storybook-static') },
]

const ensureExists = async (path, label) => {
  try {
    await access(path, constants.F_OK)
  } catch {
    console.error(`\n  error  Missing ${label}\n         ${path}\n`)
    process.exit(1)
  }
}

/**
 * Storybook 10 emits index.json for refs, but some static composition clients
 * still request stories.json and metadata.json. Mirror index.json to both names
 * so the hub avoids 404 requests when deployed to a static host.
 */
const mirrorManifests = async (refDistPath) => {
  const indexPath = resolve(refDistPath, 'index.json')
  await ensureExists(indexPath, 'ref index.json')
  const content = await readFile(indexPath, 'utf8')
  await Promise.all(
    ['stories.json', 'metadata.json'].map((name) =>
      writeFile(resolve(refDistPath, name), content, 'utf8'),
    ),
  )
}

const copyRef = async (sourcePath, refName) => {
  const dest = resolve(HUB_DIST, refName)
  await rm(dest, { recursive: true, force: true })
  await mkdir(dest, { recursive: true })
  await cp(sourcePath, dest, { recursive: true })
  await mirrorManifests(dest)
  console.log(`  copy  packages/${refName}/storybook-static  →  packages/core/storybook-static/${refName}/`)
}

await ensureExists(HUB_DIST, 'core hub build output (packages/core/storybook-static)')

for (const { name, dist } of REFS) {
  await ensureExists(dist, `${name} build output (packages/${name}/storybook-static)`)
}

for (const { name, dist } of REFS) {
  await copyRef(dist, name)
}

console.log('\n  done  packages/core/storybook-static/ ready for deployment\n')
