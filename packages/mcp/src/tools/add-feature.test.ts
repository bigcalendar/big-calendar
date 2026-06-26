import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtemp, writeFile, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { rmSync } from 'node:fs'
import matter from 'gray-matter'
import { handleAddFeature } from './add-feature.js'

let tmp: string

beforeEach(async () => {
  tmp = await mkdtemp(join(tmpdir(), 'bc-feature-'))
})

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true })
})

describe('handleAddFeature — dnd', () => {
  it('returns a DnD code snippet', async () => {
    const result = await handleAddFeature({ feature: 'dnd', projectDir: tmp })
    const text = result.content[0]?.text ?? ''
    expect(text).toContain('useCalendarDnd')
    expect(text).toContain('containerRef')
    expect(text).toContain('onEventDrop')
    expect(text).toContain('onEventResize')
  })

  it('updates bc.md features list when bc.md exists', async () => {
    await writeFile(
      join(tmp, 'bc.md'),
      '---\nversion: "1.20.0"\nfeatures:\n  - selection\n---\n',
      'utf8',
    )
    await handleAddFeature({ feature: 'dnd', projectDir: tmp })

    const raw = await readFile(join(tmp, 'bc.md'), 'utf8')
    const parsed = matter(raw)
    expect(parsed.data['features']).toContain('dnd')
    expect(parsed.data['features']).toContain('selection')
  })

  it('does not duplicate feature in bc.md if already listed', async () => {
    await writeFile(
      join(tmp, 'bc.md'),
      '---\nfeatures:\n  - dnd\n---\n',
      'utf8',
    )
    await handleAddFeature({ feature: 'dnd', projectDir: tmp })

    const raw = await readFile(join(tmp, 'bc.md'), 'utf8')
    const parsed = matter(raw)
    const features = parsed.data['features'] as string[]
    expect(features.filter((f) => f === 'dnd')).toHaveLength(1)
  })
})

describe('handleAddFeature — selection', () => {
  it('returns a slot-selection code snippet', async () => {
    const result = await handleAddFeature({ feature: 'selection', projectDir: tmp })
    const text = result.content[0]?.text ?? ''
    expect(text).toContain('onSlotSelect')
    expect(text).toContain('start')
    expect(text).toContain('end')
  })
})

describe('handleAddFeature — resources', () => {
  it('returns a resources code snippet', async () => {
    const result = await handleAddFeature({ feature: 'resources', projectDir: tmp })
    const text = result.content[0]?.text ?? ''
    expect(text).toContain('resources=')
    expect(text).toContain('resourceId')
    expect(text).toContain('resourceTitle')
  })

  it('uses accessor field names from bc.md in the snippet', async () => {
    await writeFile(
      join(tmp, 'bc.md'),
      [
        '---',
        'accessors:',
        '  resourceId: resId',
        '  resourceTitle: resName',
        '---',
      ].join('\n'),
      'utf8',
    )
    const result = await handleAddFeature({ feature: 'resources', projectDir: tmp })
    const text = result.content[0]?.text ?? ''
    expect(text).toContain('resId')
    expect(text).toContain('resName')
  })
})
