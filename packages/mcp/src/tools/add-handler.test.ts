import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { rmSync } from 'node:fs'
import { handleAddHandler } from './add-handler.js'

let tmp: string

beforeEach(async () => {
  tmp = await mkdtemp(join(tmpdir(), 'bc-handler-'))
})

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true })
})

describe('handleAddHandler', () => {
  it('returns onEventClick snippet with event parameter', async () => {
    const result = await handleAddHandler({ handler: 'onEventClick', projectDir: tmp })
    const text = result.content[0]?.text ?? ''
    expect(text).toContain('onEventClick')
    expect(text).toContain('event')
  })

  it('uses CalendarEvent type when bc.md has accessor mappings', async () => {
    await writeFile(join(tmp, 'bc.md'), '---\naccessors:\n  title: name\n---\n', 'utf8')
    const result = await handleAddHandler({ handler: 'onEventClick', projectDir: tmp })
    const text = result.content[0]?.text ?? ''
    expect(text).toContain('CalendarEvent')
  })

  it('uses unknown type when no bc.md is present', async () => {
    const result = await handleAddHandler({ handler: 'onEventClick', projectDir: tmp })
    const text = result.content[0]?.text ?? ''
    expect(text).toContain('unknown')
  })

  it('returns onSlotSelect snippet with start and end', async () => {
    const result = await handleAddHandler({ handler: 'onSlotSelect', projectDir: tmp })
    const text = result.content[0]?.text ?? ''
    expect(text).toContain('onSlotSelect')
    expect(text).toContain('start')
    expect(text).toContain('end')
  })

  it('returns onEventDrop snippet with DnD note', async () => {
    const result = await handleAddHandler({ handler: 'onEventDrop', projectDir: tmp })
    const text = result.content[0]?.text ?? ''
    expect(text).toContain('onEventDrop')
    expect(text).toContain('start')
    expect(text).toContain('end')
    expect(text).toContain('DnD')
  })

  it('returns onNavigate snippet with date and view', async () => {
    const result = await handleAddHandler({ handler: 'onNavigate', projectDir: tmp })
    const text = result.content[0]?.text ?? ''
    expect(text).toContain('onNavigate')
    expect(text).toContain('date')
    expect(text).toContain('view')
  })

  it('returns onRangeChange snippet with range and view', async () => {
    const result = await handleAddHandler({ handler: 'onRangeChange', projectDir: tmp })
    const text = result.content[0]?.text ?? ''
    expect(text).toContain('onRangeChange')
    expect(text).toContain('range')
    expect(text).toContain('view')
  })
})
