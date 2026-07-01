import jscodeshift from 'jscodeshift'
import { describe, expect, it } from 'vitest'
import transform, { parser } from './rename-callbacks'

const j = jscodeshift.withParser(parser)

function run(source: string): string | null {
  const result = transform(
    { source, path: 'test.tsx' },
    { j, jscodeshift: j, stats: () => {}, report: () => {} },
    // codeql[js/superfluous-trailing-arguments] 
    {}, 
    // jscodeshift Transform type declares options: Options as required; {} satisfies the type even though this implementation ignores it
  )
  return (result as string | null | undefined) ?? null
}

describe('rename-callbacks', () => {
  it('returns null when no matching callbacks are present', () => {
    const source = `<Calendar events={events} />`
    expect(run(source)).toBeNull()
  })

  it('returns null for non-Calendar elements', () => {
    const source = `<Foo onSelectEvent={handler} />`
    expect(run(source)).toBeNull()
  })

  describe('onSelectEvent → onEventClick', () => {
    it('renames onSelectEvent on <Calendar>', () => {
      const source = `<Calendar onSelectEvent={handler} />`
      const result = run(source)
      expect(result).not.toBeNull()
      expect(result).toContain('onEventClick={handler}')
      expect(result).not.toContain('onSelectEvent')
    })

    it('renames onSelectEvent on <CalendarProvider>', () => {
      const source = `<CalendarProvider onSelectEvent={handler}><Calendar /></CalendarProvider>`
      const result = run(source)
      expect(result).not.toBeNull()
      expect(result).toContain('onEventClick={handler}')
      expect(result).not.toContain('onSelectEvent')
    })

    it('preserves the handler expression unchanged', () => {
      const source = `<Calendar onSelectEvent={(event) => handleEvent(event)} />`
      const result = run(source)
      expect(result).toContain('onEventClick={(event) => handleEvent(event)}')
      expect(result).not.toContain('onSelectEvent')
    })

    it('renames onSelectEvent passed as a variable reference', () => {
      const source = `<Calendar onSelectEvent={myHandler} />`
      const result = run(source)
      expect(result).toContain('onEventClick={myHandler}')
    })
  })

  describe('onDoubleClickEvent → onEventDoubleClick', () => {
    it('renames onDoubleClickEvent on <Calendar>', () => {
      const source = `<Calendar onDoubleClickEvent={handler} />`
      const result = run(source)
      expect(result).not.toBeNull()
      expect(result).toContain('onEventDoubleClick={handler}')
      expect(result).not.toContain('onDoubleClickEvent')
    })

    it('renames onDoubleClickEvent on <CalendarProvider>', () => {
      const source = `<CalendarProvider onDoubleClickEvent={handler}><Calendar /></CalendarProvider>`
      const result = run(source)
      expect(result).not.toBeNull()
      expect(result).toContain('onEventDoubleClick={handler}')
      expect(result).not.toContain('onDoubleClickEvent')
    })
  })

  describe('both callbacks together', () => {
    it('renames both callbacks in a single element', () => {
      const source = [
        `<Calendar`,
        `  onSelectEvent={handleSelect}`,
        `  onDoubleClickEvent={handleDouble}`,
        `/>`,
      ].join('\n')
      const result = run(source)
      expect(result).not.toBeNull()
      expect(result).toContain('onEventClick={handleSelect}')
      expect(result).toContain('onEventDoubleClick={handleDouble}')
      expect(result).not.toContain('onSelectEvent')
      expect(result).not.toContain('onDoubleClickEvent')
    })

    it('renames callbacks and leaves other props untouched', () => {
      const source = [
        `<Calendar`,
        `  localizer={localizer}`,
        `  events={events}`,
        `  onSelectEvent={handler}`,
        `  onNavigate={onNavigate}`,
        `/>`,
      ].join('\n')
      const result = run(source)
      expect(result).not.toBeNull()
      expect(result).toContain('localizer={localizer}')
      expect(result).toContain('events={events}')
      expect(result).toContain('onEventClick={handler}')
      expect(result).toContain('onNavigate={onNavigate}')
      expect(result).not.toContain('onSelectEvent')
    })
  })

  describe('multiple Calendar elements', () => {
    it('transforms every matching element in the file', () => {
      const source = [
        `<>`,
        `  <Calendar onSelectEvent={a} />`,
        `  <Calendar onDoubleClickEvent={b} />`,
        `</>`,
      ].join('\n')
      const result = run(source)
      expect(result).not.toBeNull()
      expect(result).not.toContain('onSelectEvent')
      expect(result).not.toContain('onDoubleClickEvent')
      expect(result).toContain('onEventClick={a}')
      expect(result).toContain('onEventDoubleClick={b}')
    })
  })

  describe('mixed file (Calendar + unrelated elements)', () => {
    it('only transforms Calendar and CalendarProvider elements', () => {
      const source = [
        `<div onSelectEvent={ignored}>`,
        `  <Calendar onSelectEvent={handler} />`,
        `</div>`,
      ].join('\n')
      const result = run(source)
      expect(result).not.toBeNull()
      // The div's prop is untouched
      expect(result).toContain('onSelectEvent={ignored}')
      // The Calendar's prop is renamed
      expect(result).toContain('onEventClick={handler}')
    })
  })
})
