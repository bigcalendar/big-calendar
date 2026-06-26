import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import matter from 'gray-matter'
import { BC_MD_FILENAME, BcMdFrontmatterSchema, type BcMd } from './schema.js'

/**
 * Walks up the directory tree from `startDir` looking for a `bc.md` file.
 * Returns the absolute path to the first one found, or `null` if none exists.
 */
export function findBcMd(startDir: string): string | null {
  let dir = startDir
  for (;;) {
    const candidate = join(dir, BC_MD_FILENAME)
    if (existsSync(candidate)) return candidate
    const parent = dirname(dir)
    if (parent === dir) return null
    dir = parent
  }
}

/**
 * Reads and parses a `bc.md` file at `filePath`.
 * Frontmatter is validated against the schema; unknown keys are stripped.
 * The prose body (everything below the `---` block) is returned as `content`.
 */
export async function readBcMd(filePath: string): Promise<BcMd> {
  const raw = await readFile(filePath, 'utf8')
  const parsed = matter(raw)
  const result = BcMdFrontmatterSchema.safeParse(parsed.data)
  return {
    frontmatter: result.success ? result.data : {},
    content: parsed.content.trim(),
  }
}
