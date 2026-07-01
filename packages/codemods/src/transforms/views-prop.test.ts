import jscodeshift from 'jscodeshift'
import { describe, expect, it } from 'vitest'
import transform, { parser } from './views-prop'

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

describe('views-prop', () => {
  it('returns null when no views prop is present', () => {
    const source = `<Calendar events={events} />`
    expect(run(source)).toBeNull()
  })

  it('returns null for non-Calendar elements', () => {
    const source = `<Foo views={{ month: true }} />`
    expect(run(source)).toBeNull()
  })

  describe('array views — already compatible', () => {
    it('returns null when views is already an array', () => {
      const source = `<Calendar views={['month', 'week']} />`
      expect(run(source)).toBeNull()
    })
  })

  describe('string views', () => {
    it('wraps a string literal views prop in an array', () => {
      const source = `<Calendar views="month" />`
      const result = run(source)
      expect(result).not.toBeNull()
      expect(result).toContain('month')
      expect(result).toMatch(/views=\{/)
      expect(result).not.toMatch(/views="month"/)
    })
  })

  describe('object views', () => {
    describe('all-boolean object', () => {
      it('converts true entries to a views array and omits false entries', () => {
        const source = `<Calendar views={{ month: true, week: true, day: false }} />`
        const result = run(source)
        expect(result).not.toBeNull()
        expect(result).toContain('"month"')
        expect(result).toContain('"week"')
        expect(result).not.toContain('"day"')
        expect(result).not.toContain('viewDefinitions')
      })

      it('produces an empty array when all entries are false', () => {
        const source = `<Calendar views={{ month: false, week: false }} />`
        const result = run(source)
        expect(result).not.toBeNull()
        // views={[]} — empty array
        expect(result).toContain('views={[]}')
        expect(result).not.toContain('viewDefinitions')
      })
    })

    describe('object with custom view components', () => {
      it('extracts component entries into viewDefinitions', () => {
        const source = `<Calendar views={{ month: true, week: CustomWeek }} />`
        const result = run(source)
        expect(result).not.toBeNull()
        expect(result).toContain('"month"')
        expect(result).toContain('viewDefinitions')
        expect(result).toContain('week: CustomWeek')
        // week is NOT in the views array (it's a custom component, not a bool)
        expect(result).not.toContain('"week"')
      })

      it('places viewDefinitions immediately after views', () => {
        const source = `<Calendar views={{ month: true, week: CustomWeek }} onNavigate={onNavigate} />`
        const result = run(source)
        expect(result).not.toBeNull()
        const viewsIdx = result!.indexOf('views=')
        const defIdx = result!.indexOf('viewDefinitions=')
        const navIdx = result!.indexOf('onNavigate=')
        expect(viewsIdx).toBeLessThan(defIdx)
        expect(defIdx).toBeLessThan(navIdx)
      })

      it('handles a mix of true, false, and component values', () => {
        const source = [
          `<Calendar views={{`,
          `  month: true,`,
          `  week: CustomWeek,`,
          `  day: true,`,
          `  agenda: false,`,
          `}} />`,
        ].join('\n')
        const result = run(source)
        expect(result).not.toBeNull()
        // views array contains only the true keys
        expect(result).toContain('"month"')
        expect(result).toContain('"day"')
        expect(result).not.toContain('"agenda"')
        // viewDefinitions contains the component entry
        expect(result).toContain('viewDefinitions')
        expect(result).toContain('week: CustomWeek')
      })

      it('only generates viewDefinitions when there are component entries', () => {
        const source = `<Calendar views={{ month: true, week: true }} />`
        const result = run(source)
        expect(result).not.toContain('viewDefinitions')
      })
    })
  })

  describe('CalendarProvider', () => {
    it('transforms views prop on CalendarProvider', () => {
      const source = `<CalendarProvider views={{ month: true }}><Calendar /></CalendarProvider>`
      const result = run(source)
      expect(result).not.toBeNull()
      expect(result).toContain('"month"')
    })
  })

  describe('other props are preserved', () => {
    it('leaves other props untouched', () => {
      const source = `<Calendar localizer={localizer} views={{ month: true }} events={events} />`
      const result = run(source)
      expect(result).not.toBeNull()
      expect(result).toContain('localizer={localizer}')
      expect(result).toContain('events={events}')
    })
  })

  describe('multiple Calendar elements', () => {
    it('transforms every matching element', () => {
      const source = [
        `<>`,
        `  <Calendar views={{ month: true }} />`,
        `  <Calendar views={{ week: CustomWeek }} />`,
        `</>`,
      ].join('\n')
      const result = run(source)
      expect(result).not.toBeNull()
      expect(result).toContain('"month"')
      expect(result).toContain('viewDefinitions')
      expect(result).toContain('CustomWeek')
    })
  })
})
