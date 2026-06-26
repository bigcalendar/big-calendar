import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { rmSync } from 'node:fs'
import { handleScaffoldCalendar } from './scaffold-calendar.js'

let tmp: string

beforeEach(async () => {
  tmp = await mkdtemp(join(tmpdir(), 'bc-scaffold-'))
})

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true })
})

describe('handleScaffoldCalendar', () => {
  it('returns a generic template when no bc.md exists', async () => {
    const result = await handleScaffoldCalendar({ projectDir: tmp })
    const text = result.content[0]?.text ?? ''
    expect(text).toContain('No bc.md found')
    expect(text).toContain('CalendarProvider')
    expect(text).toContain('Calendar')
    expect(text).toContain('createTemporalLocalizer')
  })

  it('uses custom component name', async () => {
    const result = await handleScaffoldCalendar({
      projectDir: tmp,
      componentName: 'ScheduleView',
    })
    const text = result.content[0]?.text ?? ''
    expect(text).toContain('function ScheduleView')
  })

  it('includes accessor field names from bc.md', async () => {
    await writeFile(
      join(tmp, 'bc.md'),
      [
        '---',
        'version: "1.20.0"',
        'views:',
        '  - month',
        '  - week',
        'accessors:',
        '  title: name',
        '  start: startDate',
        '  end: endDate',
        '  id: eventId',
        '---',
      ].join('\n'),
      'utf8',
    )
    const result = await handleScaffoldCalendar({ projectDir: tmp })
    const text = result.content[0]?.text ?? ''
    expect(text).toContain("title: 'name'")
    expect(text).toContain("start: 'startDate'")
    expect(text).toContain("end: 'endDate'")
    expect(text).toContain("id: 'eventId'")
  })

  it('includes enabled views from bc.md', async () => {
    await writeFile(
      join(tmp, 'bc.md'),
      '---\nviews:\n  - month\n  - agenda\n---\n',
      'utf8',
    )
    const result = await handleScaffoldCalendar({ projectDir: tmp })
    const text = result.content[0]?.text ?? ''
    expect(text).toContain('"month"')
    expect(text).toContain('"agenda"')
  })

  it('includes DnD setup when features includes dnd', async () => {
    await writeFile(
      join(tmp, 'bc.md'),
      '---\nfeatures:\n  - dnd\n---\n',
      'utf8',
    )
    const result = await handleScaffoldCalendar({ projectDir: tmp })
    const text = result.content[0]?.text ?? ''
    expect(text).toContain('useCalendarDnd')
    expect(text).toContain('containerRef')
    expect(text).toContain('onEventDrop')
  })

  it('does not include DnD setup when dnd is not in features', async () => {
    await writeFile(join(tmp, 'bc.md'), '---\nfeatures:\n  - selection\n---\n', 'utf8')
    const result = await handleScaffoldCalendar({ projectDir: tmp })
    const text = result.content[0]?.text ?? ''
    expect(text).not.toContain('useCalendarDnd')
    expect(text).not.toContain('onEventDrop')
  })
})
