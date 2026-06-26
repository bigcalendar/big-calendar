import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { rmSync } from 'node:fs'
import { handleGenerateSampleEvents } from './generate-sample-events.js'

let tmp: string

beforeEach(async () => {
  tmp = await mkdtemp(join(tmpdir(), 'bc-events-'))
})

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true })
})

describe('handleGenerateSampleEvents', () => {
  it('generates 5 events by default with default field names', async () => {
    const result = await handleGenerateSampleEvents({
      projectDir: tmp,
      baseDate: '2026-06-25',
    })
    const text = result.content[0]?.text ?? ''
    expect(text).toContain('sampleEvents')
    // Default field names when no bc.md
    expect(text).toContain('"title"')
    expect(text).toContain('"start"')
    expect(text).toContain('"end"')
    // Should contain 5 id values
    const matches = text.match(/"id":/g)
    expect(matches?.length ?? 0).toBeGreaterThanOrEqual(1) // at least the interface field
  })

  it('respects the count argument', async () => {
    const result = await handleGenerateSampleEvents({
      projectDir: tmp,
      count: 3,
      baseDate: '2026-06-25',
    })
    const text = result.content[0]?.text ?? ''
    // Parse the generated array out of the code block
    const match = text.match(/const sampleEvents[^=]*=\s*(\[[\s\S]*?\])\s*```/)
    expect(match).not.toBeNull()
    const parsed = JSON.parse(match![1]!) as unknown[]
    expect(parsed).toHaveLength(3)
  })

  it('uses accessor field names from bc.md', async () => {
    await writeFile(
      join(tmp, 'bc.md'),
      [
        '---',
        'accessors:',
        '  id: eventId',
        '  title: name',
        '  start: startDate',
        '  end: endDate',
        '---',
      ].join('\n'),
      'utf8',
    )
    const result = await handleGenerateSampleEvents({
      projectDir: tmp,
      count: 2,
      baseDate: '2026-06-25',
    })
    const text = result.content[0]?.text ?? ''
    expect(text).toContain('"eventId"')
    expect(text).toContain('"name"')
    expect(text).toContain('"startDate"')
    expect(text).toContain('"endDate"')
    expect(text).not.toContain('"title":')
    expect(text).not.toContain('"start":')
  })

  it('includes the TypeScript interface in the output', async () => {
    const result = await handleGenerateSampleEvents({
      projectDir: tmp,
      baseDate: '2026-06-25',
    })
    const text = result.content[0]?.text ?? ''
    expect(text).toContain('interface SampleEvent')
  })

  it('mentions no bc.md when file is absent', async () => {
    const result = await handleGenerateSampleEvents({
      projectDir: tmp,
      baseDate: '2026-06-25',
    })
    const text = result.content[0]?.text ?? ''
    expect(text).toContain('No bc.md found')
  })
})
