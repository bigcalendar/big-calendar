import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtemp, writeFile, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { rmSync } from 'node:fs'
import matter from 'gray-matter'
import { handleInit } from './init.js'

let tmp: string

beforeEach(async () => {
  tmp = await mkdtemp(join(tmpdir(), 'bc-init-'))
})

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true })
})

describe('handleInit — status-check mode (no content args)', () => {
  it('reports missing bc.md with guidance when no file exists', async () => {
    const result = await handleInit({ projectDir: tmp })
    const text = result.content[0]?.text ?? ''
    expect(text).toContain('No bc.md found')
    expect(text).toContain('init')
  })

  it('reports existing bc.md with its frontmatter and context', async () => {
    const bcPath = join(tmp, 'bc.md')
    await writeFile(
      bcPath,
      '---\nversion: "1.20.0"\nviews:\n  - month\n---\nFetched from /api/events.\n',
      'utf8',
    )
    const result = await handleInit({ projectDir: tmp })
    const text = result.content[0]?.text ?? ''
    expect(text).toContain('bc.md found at')
    expect(text).toContain('1.20.0')
    expect(text).toContain('month')
    expect(text).toContain('Fetched from /api/events.')
  })
})

describe('handleInit — write mode (content args provided)', () => {
  it('creates bc.md with all provided fields', async () => {
    await handleInit({
      projectDir: tmp,
      version: '1.20.0',
      views: ['month', 'week'],
      features: ['dnd'],
      titleField: 'name',
      startField: 'startDate',
      endField: 'endDate',
      idField: 'id',
      context: 'Events fetched from /api/events.',
    })

    const raw = await readFile(join(tmp, 'bc.md'), 'utf8')
    const parsed = matter(raw)

    expect(parsed.data['version']).toBe('1.20.0')
    expect(parsed.data['views']).toEqual(['month', 'week'])
    expect(parsed.data['features']).toEqual(['dnd'])
    expect((parsed.data['accessors'] as Record<string, string>)['title']).toBe('name')
    expect((parsed.data['accessors'] as Record<string, string>)['start']).toBe('startDate')
    expect((parsed.data['accessors'] as Record<string, string>)['id']).toBe('id')
    expect(parsed.content.trim()).toContain('Events fetched from /api/events.')
  })

  it('creates bc.md when only version is provided', async () => {
    await handleInit({ projectDir: tmp, version: '1.20.0' })

    const raw = await readFile(join(tmp, 'bc.md'), 'utf8')
    const parsed = matter(raw)
    expect(parsed.data['version']).toBe('1.20.0')
  })

  it('returns a success message containing the written path', async () => {
    const result = await handleInit({ projectDir: tmp, version: '1.20.0' })
    const text = result.content[0]?.text ?? ''
    expect(text).toContain('bc.md written to')
    expect(text).toContain('1.20.0')
  })

  it('omits the accessors block when no field mappings are provided', async () => {
    await handleInit({ projectDir: tmp, version: '1.20.0', views: ['month'] })

    const raw = await readFile(join(tmp, 'bc.md'), 'utf8')
    const parsed = matter(raw)
    expect(parsed.data['accessors']).toBeUndefined()
  })

  it('includes resource fields in accessors when provided', async () => {
    await handleInit({
      projectDir: tmp,
      version: '1.20.0',
      resourceIdField: 'resId',
      resourceTitleField: 'resLabel',
    })

    const raw = await readFile(join(tmp, 'bc.md'), 'utf8')
    const parsed = matter(raw)
    expect((parsed.data['accessors'] as Record<string, string>)['resourceId']).toBe('resId')
    expect((parsed.data['accessors'] as Record<string, string>)['resourceTitle']).toBe('resLabel')
  })

  it('writes allDay and tooltip fields when provided', async () => {
    await handleInit({ projectDir: tmp, allDayField: 'isAllDay', version: '1.20.0' })

    const raw = await readFile(join(tmp, 'bc.md'), 'utf8')
    const parsed = matter(raw)
    expect((parsed.data['accessors'] as Record<string, string>)['allDay']).toBe('isAllDay')
  })
})
