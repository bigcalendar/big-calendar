import jscodeshift from 'jscodeshift'
import { describe, expect, it } from 'vitest'
import transform, { parser } from './wrap-provider'

const j = jscodeshift.withParser(parser)

function run(source: string): string | null {
  const result = transform(
    { source, path: 'test.tsx' },
    { j, jscodeshift: j, stats: () => {}, report: () => {} },
    {}, // codeql[js/superfluous-trailing-arguments] - jscodeshift Transform type declares options: Options as required; {} satisfies the type even though this implementation ignores it
  )
  return (result as string | null | undefined) ?? null
}

describe('wrap-provider', () => {
  it('returns null when no <Calendar> is present', () => {
    const source = `<div>hello</div>`
    expect(run(source)).toBeNull()
  })

  it('wraps a self-closing <Calendar /> with CalendarProvider', () => {
    const source = `<Calendar localizer={l} events={events} />`
    const result = run(source)
    expect(result).not.toBeNull()
    expect(result).toContain('<CalendarProvider')
    expect(result).toContain('</CalendarProvider>')
    expect(result).toContain('<Calendar')
    expect(result).toContain('localizer={l}')
    expect(result).toContain('events={events}')
  })

  it('moves all props except toolbar to CalendarProvider', () => {
    const source = `<Calendar localizer={l} events={events} toolbar={false} />`
    const result = run(source)
    expect(result).not.toBeNull()
    // localizer and events go to CalendarProvider
    expect(result).toMatch(/CalendarProvider[^>]*localizer=\{l\}/)
    expect(result).toMatch(/CalendarProvider[^>]*events=\{events\}/)
    // toolbar stays on Calendar
    expect(result).toMatch(/Calendar[^/]*toolbar=\{false\}/)
    // toolbar is NOT on CalendarProvider
    expect(result).not.toMatch(/CalendarProvider[^>]*toolbar/)
  })

  it('moves all props to CalendarProvider when no toolbar prop', () => {
    const source = `<Calendar localizer={l} events={events} onEventClick={handler} />`
    const result = run(source)
    expect(result).not.toBeNull()
    expect(result).toContain('localizer={l}')
    expect(result).toContain('events={events}')
    expect(result).toContain('onEventClick={handler}')
    // Inner Calendar should be empty (no remaining props besides toolbar)
    expect(result).toContain('<Calendar />')
  })

  describe('import update', () => {
    it('adds CalendarProvider to the @big-calendar/react import', () => {
      const source = [
        `import { Calendar } from '@big-calendar/react'`,
        `function App() { return <Calendar localizer={l} /> }`,
      ].join('\n')
      const result = run(source)
      expect(result).not.toBeNull()
      expect(result).toContain('CalendarProvider')
      expect(result).toMatch(/import.*CalendarProvider.*from '@big-calendar\/react'/)
    })

    it('does not add CalendarProvider twice if already imported', () => {
      const source = [
        `import { Calendar, CalendarProvider } from '@big-calendar/react'`,
        `function App() { return <Calendar localizer={l} /> }`,
      ].join('\n')
      const result = run(source)
      expect(result).not.toBeNull()
      // Only one CalendarProvider specifier in the import
      const matches = result?.match(/CalendarProvider/g) ?? []
      // Two occurrences: one in import, one in JSX
      expect(matches.length).toBeLessThanOrEqual(3)
    })

    it('leaves non @big-calendar/react imports alone', () => {
      const source = [
        `import React from 'react'`,
        `import { Calendar } from '@big-calendar/react'`,
        `function App() { return <Calendar localizer={l} /> }`,
      ].join('\n')
      const result = run(source)
      expect(result).not.toBeNull()
      expect(result).toContain("import React from 'react'")
    })
  })

  describe('idempotency', () => {
    it('does not double-wrap Calendar already inside CalendarProvider', () => {
      const source = [
        `<CalendarProvider localizer={l}>`,
        `  <Calendar />`,
        `</CalendarProvider>`,
      ].join('\n')
      const result = run(source)
      // Already wrapped — should return null (no change)
      expect(result).toBeNull()
    })
  })

  describe('multiple Calendar elements', () => {
    it('wraps every Calendar element in the file', () => {
      const source = [
        `<>`,
        `  <Calendar localizer={l} events={a} />`,
        `  <Calendar localizer={l} events={b} />`,
        `</>`,
      ].join('\n')
      const result = run(source)
      expect(result).not.toBeNull()
      const matches = result?.match(/<CalendarProvider/g) ?? []
      expect(matches).toHaveLength(2)
    })
  })

  describe('preserves non-Calendar elements', () => {
    it('wraps Calendar inside other elements but leaves the outer elements untouched', () => {
      const source = `<div><Calendar localizer={l} /></div>`
      const result = run(source)
      expect(result).not.toBeNull()
      expect(result).toContain('<div>')
      // Calendar inside a plain div is still wrapped (div is not CalendarProvider)
      expect(result).toContain('<CalendarProvider')
    })
  })
})
