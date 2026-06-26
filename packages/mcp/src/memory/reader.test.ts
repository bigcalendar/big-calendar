import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtemp, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { rmSync } from 'node:fs'
import { findBcMd, readBcMd } from './reader.js'

let tmp: string

beforeEach(async () => {
  tmp = await mkdtemp(join(tmpdir(), 'bc-reader-'))
})

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true })
})

describe('findBcMd', () => {
  it('returns null when no bc.md exists in the tree', () => {
    expect(findBcMd(tmp)).toBeNull()
  })

  it('finds bc.md in the start directory', async () => {
    const bcPath = join(tmp, 'bc.md')
    await writeFile(bcPath, '---\nversion: "1.0.0"\n---\n', 'utf8')
    expect(findBcMd(tmp)).toBe(bcPath)
  })

  it('finds bc.md in a parent directory', async () => {
    const child = join(tmp, 'src', 'components')
    await mkdir(child, { recursive: true })
    const bcPath = join(tmp, 'bc.md')
    await writeFile(bcPath, '---\n---\n', 'utf8')
    expect(findBcMd(child)).toBe(bcPath)
  })
})

describe('readBcMd', () => {
  it('parses frontmatter and prose content', async () => {
    const bcPath = join(tmp, 'bc.md')
    await writeFile(
      bcPath,
      [
        '---',
        'version: "1.20.0"',
        'views:',
        '  - month',
        '  - week',
        'features:',
        '  - dnd',
        'accessors:',
        '  title: name',
        '  start: startDate',
        '  end: endDate',
        '---',
        '',
        'Events are fetched from /api/events.',
      ].join('\n'),
      'utf8',
    )

    const result = await readBcMd(bcPath)

    expect(result.frontmatter.version).toBe('1.20.0')
    expect(result.frontmatter.views).toEqual(['month', 'week'])
    expect(result.frontmatter.features).toEqual(['dnd'])
    expect(result.frontmatter.accessors?.title).toBe('name')
    expect(result.frontmatter.accessors?.start).toBe('startDate')
    expect(result.frontmatter.accessors?.end).toBe('endDate')
    expect(result.content).toContain('Events are fetched from /api/events.')
  })

  it('returns empty frontmatter for invalid/missing fields', async () => {
    const bcPath = join(tmp, 'bc.md')
    await writeFile(bcPath, '---\nunknownKey: 42\n---\nSome prose.\n', 'utf8')

    const result = await readBcMd(bcPath)

    expect(result.frontmatter).toEqual({})
    expect(result.content).toBe('Some prose.')
  })

  it('handles a bc.md with no frontmatter block', async () => {
    const bcPath = join(tmp, 'bc.md')
    await writeFile(bcPath, 'Just prose, no frontmatter.\n', 'utf8')

    const result = await readBcMd(bcPath)

    expect(result.frontmatter).toEqual({})
    expect(result.content).toContain('Just prose, no frontmatter.')
  })

  it('handles an empty bc.md', async () => {
    const bcPath = join(tmp, 'bc.md')
    await writeFile(bcPath, '', 'utf8')

    const result = await readBcMd(bcPath)

    expect(result.frontmatter).toEqual({})
    expect(result.content).toBe('')
  })
})
