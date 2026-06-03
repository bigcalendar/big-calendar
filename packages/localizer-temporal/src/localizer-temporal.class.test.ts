import { beforeAll, describe, expect, it, vi } from 'vitest'
import { createTemporalLocalizer, type TemporalLocalizer } from './index'

const NY = { locale: 'en-US', timezone: 'America/New_York' } as const
const FRI = '2026-07-03T12:00:00-04:00' // Fri Jul 3 2026, EDT

let loc: TemporalLocalizer
let extended: TemporalLocalizer

beforeAll(async () => {
  // `output: 'offset'` so the DST/math/week assertions below read as NY wall
  // time; the default `utc` (…Z) output is covered in its own block.
  loc = await createTemporalLocalizer({ ...NY, output: 'offset' })
  // Second factory call exercises the loader's cached path.
  extended = await createTemporalLocalizer({ ...NY, extendedZone: true, output: 'offset' })
})

describe('loadTemporal', () => {
  it('prefers a native globalThis.Temporal when present', async () => {
    const { Temporal } = await import('temporal-polyfill')
    const g = globalThis as { Temporal?: unknown }
    g.Temporal = Temporal
    vi.resetModules()
    try {
      const { loadTemporal } = await import('./loadTemporal.function')
      const api = await loadTemporal()
      expect(api).toBe(Temporal)
      // Second call returns the cached namespace.
      expect(await loadTemporal()).toBe(api)
    } finally {
      delete g.Temporal
      vi.resetModules()
    }
  })
})

describe('TemporalLocalizer — parsing & serialization', () => {
  it('round-trips RFC 3339 offset notation in offset mode', () => {
    expect(loc.startOf({ value: FRI, unit: 'day' })).toBe('2026-07-03T00:00:00-04:00')
  })
  it('emits RFC 9557 (bracket suffix) when extendedZone is on', () => {
    expect(extended.startOf({ value: `${FRI}[America/New_York]`, unit: 'day' })).toBe(
      '2026-07-03T00:00:00-04:00[America/New_York]',
    )
  })
  it('accepts a UTC (Z) input and converts to the localizer timezone', () => {
    // 16:00Z == 12:00 EDT in New York
    expect(loc.format({ value: '2026-07-03T16:00:00Z', format: { hour: '2-digit', minute: '2-digit', hour12: false } })).toBe(
      '12:00',
    )
  })
  it('accepts a date-only input as local midnight', () => {
    expect(loc.getMinutesFromMidnight('2026-07-03')).toBe(0)
    expect(loc.startOf({ value: '2026-07-03', unit: 'day' })).toBe('2026-07-03T00:00:00-04:00')
  })
})

describe('TemporalLocalizer — output modes', () => {
  let utc: TemporalLocalizer
  let utcExtended: TemporalLocalizer
  beforeAll(async () => {
    utc = await createTemporalLocalizer(NY) // default output: 'utc'
    utcExtended = await createTemporalLocalizer({ ...NY, extendedZone: true })
  })

  it('serializes the instant as UTC (…Z) by default', () => {
    // 00:00 EDT on Jul 3 is 04:00Z.
    expect(utc.startOf({ value: FRI, unit: 'day' })).toBe('2026-07-03T04:00:00Z')
  })
  it('appends the IANA bracket (…Z[Zone]) when extendedZone is on', () => {
    expect(utcExtended.startOf({ value: FRI, unit: 'day' })).toBe(
      '2026-07-03T04:00:00Z[America/New_York]',
    )
  })
  it('renders local offset when output is offset', () => {
    expect(loc.startOf({ value: FRI, unit: 'day' })).toBe('2026-07-03T00:00:00-04:00')
  })
  it('reads offset, Z, and Z[Zone] inputs to the same instant', () => {
    const fromOffset = utc.startOf({ value: '2026-07-03T12:00:00-04:00', unit: 'hour' })
    const fromZ = utc.startOf({ value: '2026-07-03T16:00:00Z', unit: 'hour' })
    const fromBracket = utc.startOf({ value: '2026-07-03T16:00:00Z[America/New_York]', unit: 'hour' })
    expect(fromOffset).toBe('2026-07-03T16:00:00Z')
    expect(fromZ).toBe('2026-07-03T16:00:00Z')
    expect(fromBracket).toBe('2026-07-03T16:00:00Z')
  })
})

describe('TemporalLocalizer — DST awareness', () => {
  it('reports the correct standard/daylight offsets', () => {
    expect(loc.getTimezoneOffset('2026-01-15T12:00:00-05:00')).toBe(300) // EST
    expect(loc.getTimezoneOffset('2026-07-15T12:00:00-04:00')).toBe(240) // EDT
  })
  it('measures the DST shift between winter and summer', () => {
    expect(loc.getDstOffset({ start: '2026-01-15T12:00:00-05:00', end: '2026-07-15T12:00:00-04:00' })).toBe(60)
  })
  it('keeps startOf year on the correct (winter) offset', () => {
    expect(loc.startOf({ value: FRI, unit: 'year' })).toBe('2026-01-01T00:00:00-05:00')
  })
})

describe('TemporalLocalizer — math', () => {
  it('adds calendar and clock units', () => {
    expect(loc.add({ value: FRI, amount: 1, unit: 'day' })).toBe('2026-07-04T12:00:00-04:00')
    expect(loc.add({ value: FRI, amount: 1, unit: 'month' })).toBe('2026-08-03T12:00:00-04:00')
    expect(loc.add({ value: FRI, amount: 2, unit: 'hour' })).toBe('2026-07-03T14:00:00-04:00')
  })
  it('floors with startOf across units', () => {
    expect(loc.startOf({ value: FRI, unit: 'month' })).toBe('2026-07-01T00:00:00-04:00')
    expect(loc.startOf({ value: FRI, unit: 'hour' })).toBe('2026-07-03T12:00:00-04:00')
    expect(loc.startOf({ value: '2026-07-03T12:34:56-04:00', unit: 'minute' })).toBe('2026-07-03T12:34:00-04:00')
  })
  it('caps with endOf', () => {
    expect(loc.endOf({ value: FRI, unit: 'day' })).toBe('2026-07-03T23:59:59.999-04:00')
    expect(loc.endOf({ value: FRI, unit: 'month' })).toBe('2026-07-31T23:59:59.999-04:00')
  })
  it('diffs across units', () => {
    expect(loc.diff({ a: '2026-07-10T12:00:00-04:00', b: FRI, unit: 'day' })).toBe(7)
    expect(loc.diff({ a: '2026-10-03T12:00:00-04:00', b: FRI, unit: 'month' })).toBe(3)
  })
})

describe('TemporalLocalizer — week, slots & events', () => {
  it('derives Sunday week start for en-US', () => {
    expect(loc.firstDayOfWeek()).toBe(7)
    expect(loc.startOfWeek(FRI)).toBe('2026-06-28T00:00:00-04:00')
  })
  it('builds a 35-day visible month grid', () => {
    const days = loc.visibleDays(FRI)
    expect(days).toHaveLength(35)
    expect(days[0]).toBe('2026-06-28T00:00:00-04:00')
    expect(days[days.length - 1]).toBe('2026-08-01T00:00:00-04:00')
  })
  it('reads minute fields and resolves slot dates', () => {
    expect(loc.minutes('2026-07-03T12:45:00-04:00')).toBe(45)
    expect(loc.getMinutesFromMidnight('2026-07-03T10:30:00-04:00')).toBe(630)
    expect(loc.getSlotDate({ date: '2026-07-03T00:00:00-04:00', minutesFromMidnight: 630 })).toBe(
      '2026-07-03T10:30:00-04:00',
    )
  })
  it('compares and detects same-day', () => {
    expect(loc.lt({ a: FRI, b: '2026-07-04T12:00:00-04:00' })).toBe(true)
    expect(loc.isSameDate({ a: '2026-07-03T01:00:00-04:00', b: '2026-07-03T23:00:00-04:00' })).toBe(true)
  })
  it('sorts events by start, then all-day, then duration', () => {
    const events = [
      { id: 'e1', start: '2026-07-03T09:00:00-04:00', end: '2026-07-03T10:00:00-04:00' },
      { id: 'e2', start: '2026-07-03T09:00:00-04:00', end: '2026-07-03T12:00:00-04:00' },
      { id: 'e3', start: '2026-07-03T08:00:00-04:00', end: '2026-07-04T08:00:00-04:00', allDay: true },
    ]
    expect(loc.sortEvents({ events }).map((e) => e.id)).toEqual(['e3', 'e2', 'e1'])
  })
})
