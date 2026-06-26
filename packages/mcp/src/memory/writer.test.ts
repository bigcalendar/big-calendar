import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { rmSync } from 'node:fs'
import matter from 'gray-matter'
import { writeBcMd, updateBcMd } from './writer.js'

let tmp: string

beforeEach(async () => {
  tmp = await mkdtemp(join(tmpdir(), 'bc-writer-'))
})

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true })
})

describe('writeBcMd', () => {
  it('writes frontmatter and prose to a new file', async () => {
    const bcPath = join(tmp, 'bc.md')
    await writeBcMd(
      bcPath,
      {
        version: '1.20.0',
        views: ['month', 'week'],
        features: ['dnd'],
        accessors: { title: 'name', start: 'startDate', end: 'endDate' },
      },
      'Events are fetched from /api/events.',
    )

    const raw = await readFile(bcPath, 'utf8')
    const parsed = matter(raw)

    expect(parsed.data['version']).toBe('1.20.0')
    expect(parsed.data['views']).toEqual(['month', 'week'])
    expect(parsed.data['features']).toEqual(['dnd'])
    expect((parsed.data['accessors'] as Record<string, string>)['title']).toBe('name')
    expect(parsed.content.trim()).toContain('Events are fetched from /api/events.')
  })

  it('overwrites an existing file', async () => {
    const bcPath = join(tmp, 'bc.md')
    await writeBcMd(bcPath, { version: '1.0.0' }, 'Old content.')
    await writeBcMd(bcPath, { version: '2.0.0' }, 'New content.')

    const raw = await readFile(bcPath, 'utf8')
    const parsed = matter(raw)

    expect(parsed.data['version']).toBe('2.0.0')
    expect(parsed.content.trim()).toContain('New content.')
  })

  it('writes a file with empty frontmatter and no prose', async () => {
    const bcPath = join(tmp, 'bc.md')
    await writeBcMd(bcPath, {}, '')

    const raw = await readFile(bcPath, 'utf8')
    expect(raw).toBeDefined()
    const parsed = matter(raw)
    expect(parsed.data).toEqual({})
  })
})

describe('updateBcMd', () => {
  it('creates a new file when none exists', async () => {
    const bcPath = join(tmp, 'bc.md')
    await updateBcMd(bcPath, { version: '1.20.0', views: ['month'] })

    const raw = await readFile(bcPath, 'utf8')
    const parsed = matter(raw)
    expect(parsed.data['version']).toBe('1.20.0')
    expect(parsed.data['views']).toEqual(['month'])
  })

  it('merges patch into existing frontmatter', async () => {
    const bcPath = join(tmp, 'bc.md')
    await writeBcMd(
      bcPath,
      { version: '1.20.0', views: ['month'] },
      'Original prose.',
    )
    await updateBcMd(bcPath, { features: ['dnd'] })

    const raw = await readFile(bcPath, 'utf8')
    const parsed = matter(raw)
    expect(parsed.data['version']).toBe('1.20.0')
    expect(parsed.data['views']).toEqual(['month'])
    expect(parsed.data['features']).toEqual(['dnd'])
    expect(parsed.content.trim()).toContain('Original prose.')
  })

  it('replaces prose when contentPatch is provided', async () => {
    const bcPath = join(tmp, 'bc.md')
    await writeBcMd(bcPath, { version: '1.20.0' }, 'Old prose.')
    await updateBcMd(bcPath, {}, 'Updated prose.')

    const raw = await readFile(bcPath, 'utf8')
    const parsed = matter(raw)
    expect(parsed.content.trim()).toContain('Updated prose.')
    expect(parsed.content).not.toContain('Old prose.')
  })

  it('overwrites a field when patch has the same key', async () => {
    const bcPath = join(tmp, 'bc.md')
    await writeBcMd(bcPath, { version: '1.0.0' }, '')
    await updateBcMd(bcPath, { version: '1.20.0' })

    const raw = await readFile(bcPath, 'utf8')
    const parsed = matter(raw)
    expect(parsed.data['version']).toBe('1.20.0')
  })
})
