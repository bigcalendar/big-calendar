import jscodeshift from 'jscodeshift'
import { describe, expect, it } from 'vitest'
import transform, { parser } from './merge-accessors'

const j = jscodeshift.withParser(parser)

function run(source: string): string | null {
  const result = transform(
    { source, path: 'test.tsx' },
    { j, jscodeshift: j, stats: () => {}, report: () => {} },
    {}, // codeql[js/superfluous-trailing-arguments] 
    // jscodeshift Transform type declares options: Options as required; {} satisfies the type even though this implementation ignores it
  )
  return (result as string | null | undefined) ?? null
}

describe('merge-accessors', () => {
  it('returns null when no *Accessor props are present', () => {
    const source = `<Calendar events={events} />`
    expect(run(source)).toBeNull()
  })

  it('returns null for non-Calendar elements even if they have *Accessor props', () => {
    const source = `<Foo titleAccessor="title" />`
    expect(run(source)).toBeNull()
  })

  describe('single accessor prop', () => {
    it('converts a string-literal titleAccessor', () => {
      const source = `<Calendar titleAccessor="title" />`
      const result = run(source)
      expect(result).not.toBeNull()
      expect(result).toContain('accessors=')
      expect(result).toContain('title:')
      expect(result).not.toContain('titleAccessor')
    })

    it('converts a function expression accessor', () => {
      const source = `<Calendar allDayAccessor={e => e.isAllDay} />`
      const result = run(source)
      expect(result).not.toBeNull()
      expect(result).toContain('allDay:')
      expect(result).not.toContain('allDayAccessor')
    })

    it('converts a JSX string expression accessor', () => {
      const source = `<Calendar startAccessor={"start"} />`
      const result = run(source)
      expect(result).not.toBeNull()
      expect(result).toContain('start:')
      expect(result).not.toContain('startAccessor')
    })
  })

  describe('all 11 accessor props', () => {
    it('collapses all accessor props into a single accessors object', () => {
      const source = [
        `<Calendar`,
        `  titleAccessor="title"`,
        `  tooltipAccessor="description"`,
        `  allDayAccessor="allDay"`,
        `  startAccessor="start"`,
        `  endAccessor="end"`,
        `  resourceAccessor="resource"`,
        `  resourceIdAccessor="id"`,
        `  resourceTitleAccessor="name"`,
        `  draggableAccessor={e => e.isDraggable}`,
        `  resizableAccessor={e => e.isResizable}`,
        `  typeAccessor="type"`,
        `/>`,
      ].join('\n')
      const result = run(source)
      expect(result).not.toBeNull()
      expect(result).toContain('accessors=')
      expect(result).toContain('title:')
      expect(result).toContain('tooltip:')
      expect(result).toContain('allDay:')
      expect(result).toContain('start:')
      expect(result).toContain('end:')
      expect(result).toContain('resource:')
      expect(result).toContain('resourceId:')
      expect(result).toContain('resourceTitle:')
      expect(result).toContain('draggable:')
      expect(result).toContain('resizable:')
      expect(result).toContain('type:')
      // None of the old prop names remain
      ;[
        'titleAccessor',
        'tooltipAccessor',
        'allDayAccessor',
        'startAccessor',
        'endAccessor',
        'resourceAccessor',
        'resourceIdAccessor',
        'resourceTitleAccessor',
        'draggableAccessor',
        'resizableAccessor',
        'typeAccessor',
      ].forEach((prop) => expect(result).not.toContain(prop))
    })
  })

  describe('non-accessor props are preserved', () => {
    it('keeps events, localizer and other props untouched', () => {
      const source = `<Calendar events={events} localizer={localizer} titleAccessor="title" />`
      const result = run(source)
      expect(result).not.toBeNull()
      expect(result).toContain('events={events}')
      expect(result).toContain('localizer={localizer}')
      expect(result).not.toContain('titleAccessor')
    })
  })

  describe('existing accessors prop', () => {
    it('merges new keys into an existing accessors object', () => {
      const source = `<Calendar accessors={{ title: "myTitle" }} startAccessor="start" />`
      const result = run(source)
      expect(result).not.toBeNull()
      expect(result).toContain('title:')
      expect(result).toContain('start:')
      expect(result).not.toContain('startAccessor')
      // Only one accessors attribute
      const matches = result?.match(/accessors=/g) ?? []
      expect(matches).toHaveLength(1)
    })

    it('merges multiple new keys into existing accessors', () => {
      const source = [
        `<Calendar`,
        `  accessors={{ tooltip: "desc" }}`,
        `  titleAccessor="title"`,
        `  startAccessor="start"`,
        `/>`,
      ].join('\n')
      const result = run(source)
      expect(result).not.toBeNull()
      expect(result).toContain('tooltip:')
      expect(result).toContain('title:')
      expect(result).toContain('start:')
      const matches = result?.match(/accessors=/g) ?? []
      expect(matches).toHaveLength(1)
    })
  })

  describe('new accessors prop placement', () => {
    it('inserts accessors at the position of the first *Accessor prop', () => {
      const source = `<Calendar events={events} titleAccessor="title" onNavigate={onNavigate} />`
      const result = run(source)
      expect(result).not.toBeNull()
      // accessors appears before onNavigate in the output
      const accessorsIdx = result!.indexOf('accessors=')
      const navigateIdx = result!.indexOf('onNavigate=')
      expect(accessorsIdx).toBeLessThan(navigateIdx)
    })
  })

  describe('multiple Calendar elements in a file', () => {
    it('transforms every Calendar element independently', () => {
      const source = [
        `<>`,
        `  <Calendar titleAccessor="title" />`,
        `  <Calendar startAccessor="start" />`,
        `</>`,
      ].join('\n')
      const result = run(source)
      expect(result).not.toBeNull()
      expect(result).not.toContain('titleAccessor')
      expect(result).not.toContain('startAccessor')
      const matches = result?.match(/accessors=/g) ?? []
      expect(matches).toHaveLength(2)
    })
  })

  describe('mixed file (Calendar + other elements)', () => {
    it('only transforms Calendar elements and leaves others untouched', () => {
      const source = [
        `<div titleAccessor="title">`,
        `  <Calendar startAccessor="start" />`,
        `</div>`,
      ].join('\n')
      const result = run(source)
      expect(result).not.toBeNull()
      // The div's titleAccessor is NOT removed (it's not a Calendar element)
      expect(result).toContain('titleAccessor')
      // The Calendar's startAccessor IS removed
      expect(result).not.toContain('startAccessor')
      expect(result).toContain('accessors=')
    })
  })
})
