import jscodeshift from 'jscodeshift'
import { describe, expect, it } from 'vitest'
import transform, { parser } from './rename-props'

const j = jscodeshift.withParser(parser)

function run(source: string): string | null {
  const result = transform(
    { source, path: 'test.tsx' },
    { j, jscodeshift: j, stats: () => {}, report: () => {} },
    {}, // codeql[js/superfluous-trailing-arguments] - jscodeshift Transform type declares options: Options as required; {} satisfies the type even though this implementation ignores it
  )
  return (result as string | null | undefined) ?? null
}

describe('rename-props', () => {
  it('returns null when no matching props are present', () => {
    const source = `<Calendar events={events} />`
    expect(run(source)).toBeNull()
  })

  it('returns null for non-Calendar elements', () => {
    const source = `<Foo resourceGroupingLayout={false} />`
    expect(run(source)).toBeNull()
  })

  describe('resourceGroupingLayout → resourceLayout', () => {
    it('renames resourceGroupingLayout on <Calendar>', () => {
      const source = `<Calendar resourceGroupingLayout={false} />`
      const result = run(source)
      expect(result).not.toBeNull()
      expect(result).toContain('resourceLayout={false}')
      expect(result).not.toContain('resourceGroupingLayout')
    })

    it('renames resourceGroupingLayout on <CalendarProvider>', () => {
      const source = `<CalendarProvider resourceGroupingLayout={true}><Calendar /></CalendarProvider>`
      const result = run(source)
      expect(result).not.toBeNull()
      expect(result).toContain('resourceLayout={true}')
      expect(result).not.toContain('resourceGroupingLayout')
    })

    it('preserves the boolean value expression unchanged', () => {
      const source = `<Calendar resourceGroupingLayout={isGrouped} />`
      const result = run(source)
      expect(result).toContain('resourceLayout={isGrouped}')
    })
  })

  describe('onSelecting → onSlotSelecting', () => {
    it('renames onSelecting on <Calendar>', () => {
      const source = `<Calendar onSelecting={handler} />`
      const result = run(source)
      expect(result).not.toBeNull()
      expect(result).toContain('onSlotSelecting={handler}')
      expect(result).not.toContain('onSelecting=')
    })

    it('renames onSelecting on <CalendarProvider>', () => {
      const source = `<CalendarProvider onSelecting={(range) => canSelect(range)}><Calendar /></CalendarProvider>`
      const result = run(source)
      expect(result).not.toBeNull()
      expect(result).toContain('onSlotSelecting={(range) => canSelect(range)}')
      expect(result).not.toContain('onSelecting=')
    })
  })

  describe('both props together', () => {
    it('renames both props in a single element', () => {
      const source = [
        `<Calendar`,
        `  resourceGroupingLayout={false}`,
        `  onSelecting={handler}`,
        `/>`,
      ].join('\n')
      const result = run(source)
      expect(result).not.toBeNull()
      expect(result).toContain('resourceLayout={false}')
      expect(result).toContain('onSlotSelecting={handler}')
      expect(result).not.toContain('resourceGroupingLayout')
      expect(result).not.toContain('onSelecting=')
    })

    it('renames props and leaves other props untouched', () => {
      const source = [
        `<Calendar`,
        `  localizer={localizer}`,
        `  events={events}`,
        `  resourceGroupingLayout={false}`,
        `  onSelecting={handler}`,
        `  onNavigate={onNavigate}`,
        `/>`,
      ].join('\n')
      const result = run(source)
      expect(result).not.toBeNull()
      expect(result).toContain('localizer={localizer}')
      expect(result).toContain('events={events}')
      expect(result).toContain('onNavigate={onNavigate}')
      expect(result).toContain('resourceLayout={false}')
      expect(result).toContain('onSlotSelecting={handler}')
    })
  })

  describe('multiple Calendar elements', () => {
    it('transforms every matching element in the file', () => {
      const source = [
        `<>`,
        `  <Calendar resourceGroupingLayout={false} />`,
        `  <Calendar onSelecting={handler} />`,
        `</>`,
      ].join('\n')
      const result = run(source)
      expect(result).not.toBeNull()
      expect(result).not.toContain('resourceGroupingLayout')
      expect(result).not.toContain('onSelecting=')
      expect(result).toContain('resourceLayout={false}')
      expect(result).toContain('onSlotSelecting={handler}')
    })
  })

  describe('mixed file (Calendar + unrelated elements)', () => {
    it('only transforms Calendar and CalendarProvider elements', () => {
      const source = [
        `<div onSelecting={ignored}>`,
        `  <Calendar onSelecting={handler} />`,
        `</div>`,
      ].join('\n')
      const result = run(source)
      expect(result).not.toBeNull()
      // The div's prop is untouched
      expect(result).toContain('onSelecting={ignored}')
      // The Calendar's prop is renamed
      expect(result).toContain('onSlotSelecting={handler}')
    })
  })
})
