import { readFile, writeFile } from 'node:fs/promises'
import matter from 'gray-matter'
import { BcMdFrontmatterSchema, type BcMdFrontmatter } from './schema.js'

/**
 * Writes a new `bc.md` to `filePath`, overwriting any existing file.
 * `content` is the free-form prose body below the frontmatter block.
 */
export async function writeBcMd(
  filePath: string,
  frontmatter: BcMdFrontmatter,
  content: string,
): Promise<void> {
  const output = matter.stringify(content, frontmatter as Record<string, unknown>)
  await writeFile(filePath, output, 'utf8')
}

/**
 * Reads the existing `bc.md` at `filePath`, merges `patch` into its frontmatter,
 * optionally replaces the prose body, and writes the result back.
 * If the file does not exist yet, it is created from scratch.
 */
export async function updateBcMd(
  filePath: string,
  patch: Partial<BcMdFrontmatter>,
  contentPatch?: string,
): Promise<void> {
  let existingData: Record<string, unknown> = {}
  let existingContent = ''

  try {
    const raw = await readFile(filePath, 'utf8')
    const parsed = matter(raw)
    existingData = parsed.data as Record<string, unknown>
    existingContent = parsed.content
  } catch {
    // File doesn't exist — start empty
  }

  const merged = BcMdFrontmatterSchema.parse({ ...existingData, ...patch })
  const content = contentPatch !== undefined ? contentPatch : existingContent
  const output = matter.stringify(content, merged as Record<string, unknown>)
  await writeFile(filePath, output, 'utf8')
}
