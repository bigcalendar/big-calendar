import { afterEach, describe, expect, it } from 'vitest'
import { formatDuration } from './durationFormat.function'

interface IntlWithDuration {
  DurationFormat?: unknown
}

const intl = Intl as unknown as IntlWithDuration
const nativeDurationFormat = intl.DurationFormat

afterEach(() => {
  if (nativeDurationFormat === undefined) {
    delete intl.DurationFormat
  } else {
    intl.DurationFormat = nativeDurationFormat
  }
})

describe('formatDuration', () => {
  it('produces a non-empty string for a populated duration', () => {
    const out = formatDuration({ locale: 'en-US', duration: { hours: 2, minutes: 30 } })
    expect(out.length).toBeGreaterThan(0)
  })

  it('accepts an Intl.Locale instance', () => {
    const out = formatDuration({ locale: new Intl.Locale('en-US'), duration: { minutes: 15 } })
    expect(out.length).toBeGreaterThan(0)
  })

  describe('fallback path (no native Intl.DurationFormat)', () => {
    it('composes units when the native API is absent', () => {
      delete intl.DurationFormat
      const out = formatDuration({ locale: 'en-US', duration: { hours: 1, minutes: 5 }, style: 'short' })
      expect(out).toMatch(/1/)
      expect(out).toMatch(/5/)
    })

    it('renders a zero-minute placeholder for an empty duration', () => {
      delete intl.DurationFormat
      const out = formatDuration({ locale: 'en-US', duration: {} })
      expect(out).toMatch(/0/)
    })

    it('skips zero-valued units', () => {
      delete intl.DurationFormat
      const out = formatDuration({ locale: 'en-US', duration: { hours: 0, minutes: 20 } })
      expect(out).toMatch(/20/)
    })
  })

  it('uses the native API when present', () => {
    const calls: unknown[] = []
    intl.DurationFormat = class {
      format(duration: unknown): string {
        calls.push(duration)
        return 'NATIVE'
      }
    }
    expect(formatDuration({ locale: 'en-US', duration: { minutes: 5 } })).toBe('NATIVE')
    expect(calls).toHaveLength(1)
  })
})
