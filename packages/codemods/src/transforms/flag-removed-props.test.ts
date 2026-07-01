import jscodeshift from 'jscodeshift'
import { describe, expect, it } from 'vitest'
import transform, { parser } from './flag-removed-props'

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

describe('flag-removed-props', () => {
  it('returns null when no removed props are present', () => {
    const source = `<Calendar events={events} />`
    expect(run(source)).toBeNull()
  })

  it('returns null for non-Calendar elements', () => {
    const source = `<Foo popup />`
    expect(run(source)).toBeNull()
  })

  describe('popup', () => {
    it('injects a TODO comment on the popup prop', () => {
      const source = `<Calendar popup />`
      const result = run(source)
      expect(result).not.toBeNull()
      expect(result).toContain('TODO: removed')
      expect(result).toContain('popup')
      // The prop itself is still present (not silently deleted)
      expect(result).toMatch(/popup/)
    })

    it('keeps popup in the output', () => {
      const source = `<Calendar popup />`
      const result = run(source)
      expect(result).toContain('popup')
    })
  })

  describe('popupOffset', () => {
    it('injects a TODO comment on popupOffset', () => {
      const source = `<Calendar popupOffset={10} />`
      const result = run(source)
      expect(result).not.toBeNull()
      expect(result).toContain('TODO: removed')
      expect(result).toContain('popupOffset')
    })
  })

  describe('rtl', () => {
    it('injects a TODO comment on rtl', () => {
      const source = `<Calendar rtl />`
      const result = run(source)
      expect(result).not.toBeNull()
      expect(result).toContain('TODO: removed')
      expect(result).toContain('rtl')
    })
  })

  describe('onSelectSlot', () => {
    it('injects a TODO comment explaining the split', () => {
      const source = `<Calendar onSelectSlot={handler} />`
      const result = run(source)
      expect(result).not.toBeNull()
      expect(result).toContain('TODO: removed')
      expect(result).toContain('onSlotClick')
      expect(result).toContain('onSelectSlot')
    })
  })

  describe('culture', () => {
    it('injects a TODO comment on culture', () => {
      const source = `<Calendar culture="en-US" />`
      const result = run(source)
      expect(result).not.toBeNull()
      expect(result).toContain('TODO: removed')
      expect(result).toContain('culture')
    })
  })

  describe('formats', () => {
    it('injects a TODO comment on formats', () => {
      const source = `<Calendar formats={myFormats} />`
      const result = run(source)
      expect(result).not.toBeNull()
      expect(result).toContain('TODO: removed')
      expect(result).toContain('formats')
    })
  })

  describe('multiple removed props on one element', () => {
    it('annotates every removed prop independently', () => {
      const source = [
        `<Calendar`,
        `  popup`,
        `  rtl`,
        `  onSelectSlot={handler}`,
        `  events={events}`,
        `/>`,
      ].join('\n')
      const result = run(source)
      expect(result).not.toBeNull()
      // Three TODO comments injected
      const matches = result?.match(/TODO: removed/g) ?? []
      expect(matches.length).toBeGreaterThanOrEqual(3)
      // Unrelated prop is untouched (no comment added)
      expect(result).toContain('events={events}')
    })
  })

  describe('CalendarProvider', () => {
    it('flags removed props on CalendarProvider too', () => {
      const source = `<CalendarProvider popup><Calendar /></CalendarProvider>`
      const result = run(source)
      expect(result).not.toBeNull()
      expect(result).toContain('TODO: removed')
    })
  })

  describe('mixed file', () => {
    it('does not annotate removed prop names on non-Calendar elements', () => {
      const source = [
        `<div popup>`,
        `  <Calendar popup />`,
        `</div>`,
      ].join('\n')
      const result = run(source)
      expect(result).not.toBeNull()
      // Only ONE TODO (on the Calendar, not the div)
      const matches = result?.match(/TODO: removed/g) ?? []
      expect(matches).toHaveLength(1)
    })
  })
})
