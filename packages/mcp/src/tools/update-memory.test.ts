import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtemp, writeFile, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { rmSync } from 'node:fs'
import matter from 'gray-matter'
import { handleUpdateMemory } from './update-memory.js'

let tmp: string

beforeEach(async () => {
  tmp = await mkdtemp(join(tmpdir(), 'bc-update-'))
})

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true })
})

describe('handleUpdateMemory', () => {
  it('creates bc.md when it does not exist', async () => {
    await handleUpdateMemory({ projectDir: tmp, version: '1.20.0' })

    const raw = await readFile(join(tmp, 'bc.md'), 'utf8')
    const parsed = matter(raw)
    expect(parsed.data['version']).toBe('1.20.0')
  })

  it('merges patch into existing frontmatter without overwriting untouched fields', async () => {
    await writeFile(
      join(tmp, 'bc.md'),
      '---\nversion: "1.20.0"\nviews:\n  - month\n---\nOriginal prose.\n',
      'utf8',
    )
    await handleUpdateMemory({ projectDir: tmp, features: ['dnd'] })

    const raw = await readFile(join(tmp, 'bc.md'), 'utf8')
    const parsed = matter(raw)
    expect(parsed.data['version']).toBe('1.20.0')
    expect(parsed.data['views']).toEqual(['month'])
    expect(parsed.data['features']).toEqual(['dnd'])
    expect(parsed.content.trim()).toContain('Original prose.')
  })

  it('updates accessor fields when provided', async () => {
    await writeFile(join(tmp, 'bc.md'), '---\nversion: "1.20.0"\n---\n', 'utf8')
    await handleUpdateMemory({
      projectDir: tmp,
      titleField: 'name',
      startField: 'startDate',
    })

    const raw = await readFile(join(tmp, 'bc.md'), 'utf8')
    const parsed = matter(raw)
    expect((parsed.data['accessors'] as Record<string, string>)['title']).toBe('name')
    expect((parsed.data['accessors'] as Record<string, string>)['start']).toBe('startDate')
  })

  it('replaces prose body when context is provided', async () => {
    await writeFile(
      join(tmp, 'bc.md'),
      '---\nversion: "1.20.0"\n---\nOld context.\n',
      'utf8',
    )
    await handleUpdateMemory({ projectDir: tmp, context: 'New context.' })

    const raw = await readFile(join(tmp, 'bc.md'), 'utf8')
    const parsed = matter(raw)
    expect(parsed.content.trim()).toContain('New context.')
    expect(parsed.content).not.toContain('Old context.')
  })

  it('appends to prose body when appendContext is provided', async () => {
    await writeFile(
      join(tmp, 'bc.md'),
      '---\nversion: "1.20.0"\n---\nExisting notes.\n',
      'utf8',
    )
    await handleUpdateMemory({
      projectDir: tmp,
      appendContext: 'Added new implementation detail.',
    })

    const raw = await readFile(join(tmp, 'bc.md'), 'utf8')
    const parsed = matter(raw)
    expect(parsed.content).toContain('Existing notes.')
    expect(parsed.content).toContain('Added new implementation detail.')
  })

  it('returns the updated bc.md contents', async () => {
    const result = await handleUpdateMemory({ projectDir: tmp, version: '2.0.0' })
    const text = result.content[0]?.text ?? ''
    expect(text).toContain('bc.md updated at')
    expect(text).toContain('2.0.0')
  })
})
