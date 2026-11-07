// Rule 5: only the maintainer decides when 1.0 ships. Nx Release keeps 0.x on breaking changes, and
// this guard fails if any published package's version reaches 1.0.0 anyway (D-106). Remove it, by
// decision, when the maintainer ships 1.0.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const packagesDir = fileURLToPath(new URL('../../../packages', import.meta.url))

describe('versions stay below 1.0', () => {
  for (const folder of readdirSync(packagesDir)) {
    const manifest = JSON.parse(
      readFileSync(join(packagesDir, folder, 'package.json'), 'utf8'),
    ) as {
      name: string
      version: string
    }
    it(`${manifest.name} is ${manifest.version}`, () => {
      expect(Number(manifest.version.split('.')[0])).toBe(0)
    })
  }
})
