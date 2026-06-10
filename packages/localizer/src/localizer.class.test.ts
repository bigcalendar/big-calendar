import { describe, expect, it, vi } from 'vitest'
import { Localizer } from './localizer.class'
import * as weekInfo from './ponyfills/weekInfo.function'
import type { DateParts, DateTimeUnit, FixedUnit, TimeParts } from './types/localizer.type'

// Spy on getWeekInfo while keeping its real behavior by default, so the
// firstDayOfWeek fallback can be forced in one isolated test (below) without
// affecting the locale-driven assertions elsewhere in this file.
vi.mock('./ponyfills/weekInfo.function', async (importOriginal) => {
  const actual = await importOriginal<typeof weekInfo>()
  return { ...actual, getWeekInfo: vi.fn(actual.getWeekInfo) }
})

/**
 * Minimal UTC-only concrete localizer used to exercise the base class in
 * isolation from any date library. All math is exact (no DST), which keeps the
 * base-logic assertions deterministic. The real Temporal/Luxon localizers are
 * tested in their own packages.
 */
const MS: Record<Exclude<DateTimeUnit, 'year' | 'month'>, number> = {
  millisecond: 1,
  second: 1000,
  minute: 60_000,
  hour: 3_600_000,
  day: 86_400_000,
  week: 604_800_000,
}

class TestLocalizer extends Localizer<Date> {
  protected parse(value: string): Date {
    return new Date(value)
  }
  protected serialize(dt: Date): string {
    return dt.toISOString()
  }
  protected toEpochMs(dt: Date): number {
    return dt.getTime()
  }
  protected getParts(dt: Date): DateParts {
    return {
      year: dt.getUTCFullYear(),
      month: dt.getUTCMonth() + 1,
      day: dt.getUTCDate(),
      hour: dt.getUTCHours(),
      minute: dt.getUTCMinutes(),
      second: dt.getUTCSeconds(),
      millisecond: dt.getUTCMilliseconds(),
      weekday: ((dt.getUTCDay() + 6) % 7) + 1,
    }
  }
  protected addUnits(dt: Date, amount: number, unit: DateTimeUnit): Date {
    const next = new Date(dt.getTime())
    switch (unit) {
      case 'year':
        next.setUTCFullYear(next.getUTCFullYear() + amount)
        break
      case 'month':
        next.setUTCMonth(next.getUTCMonth() + amount)
        break
      case 'week':
        next.setUTCDate(next.getUTCDate() + amount * 7)
        break
      case 'day':
        next.setUTCDate(next.getUTCDate() + amount)
        break
      default:
        next.setTime(next.getTime() + amount * MS[unit])
    }
    return next
  }
  protected startOfUnit(dt: Date, unit: FixedUnit): Date {
    const next = new Date(dt.getTime())
    switch (unit) {
      case 'year':
        next.setUTCMonth(0, 1)
        next.setUTCHours(0, 0, 0, 0)
        break
      case 'month':
        next.setUTCDate(1)
        next.setUTCHours(0, 0, 0, 0)
        break
      case 'day':
        next.setUTCHours(0, 0, 0, 0)
        break
      case 'hour':
        next.setUTCMinutes(0, 0, 0)
        break
      case 'minute':
        next.setUTCSeconds(0, 0)
        break
      case 'second':
        next.setUTCMilliseconds(0)
        break
    }
    return next
  }
  protected endOfUnit(dt: Date, unit: FixedUnit): Date {
    return new Date(this.addUnits(this.startOfUnit(dt, unit), 1, unit).getTime() - 1)
  }
  protected diffUnits(a: Date, b: Date, unit: DateTimeUnit): number {
    if (unit === 'year' || unit === 'month') {
      const aE = a.getTime()
      const bE = b.getTime()
      if (aE === bE) {
        return 0
      }
      const sign = aE > bE ? 1 : -1
      let count = 0
      let cursor = b
      let guard = 0
      while (guard < 100_000) {
        const next = this.addUnits(cursor, sign, unit)
        if (sign > 0 ? next.getTime() > aE : next.getTime() < aE) {
          break
        }
        cursor = next
        count += sign
        guard += 1
      }
      return count
    }
    return Math.trunc((a.getTime() - b.getTime()) / MS[unit])
  }
  protected withTime(dt: Date, time: TimeParts): Date {
    const next = this.startOfUnit(dt, 'day')
    next.setUTCHours(time.hour, time.minute, time.second ?? 0, time.millisecond ?? 0)
    return next
  }
  protected offsetMinutes(): number {
    return 0
  }
}

const base = { locale: 'en-US', timeZone: 'UTC' } as const
const loc = new TestLocalizer(base)
const WED = '2026-06-03T12:00:00.000Z' // Wednesday

describe('Localizer base — construction', () => {
  it('applies explicit options', () => {
    expect(loc.locale.toString()).toBe('en-US')
    expect(loc.timeZone).toBe('UTC') // explicit option wins
    expect(loc.extendedZone).toBe(false)
    expect(loc.output).toBe('utc')
  })

  it('resolves locale and timeZone from the host when omitted', () => {
    const d = new TestLocalizer()
    expect(d.locale).toBeInstanceOf(Intl.Locale)
    expect(typeof d.timeZone).toBe('string')
    expect(d.timeZone.length).toBeGreaterThan(0)
  })

  it('accepts an Intl.Locale instance directly', () => {
    const d = new TestLocalizer({ locale: new Intl.Locale('fr-FR') })
    expect(d.locale.toString()).toBe('fr-FR')
  })

  it('honors extendedZone and firstDayOfWeek overrides', () => {
    const d = new TestLocalizer({ ...base, extendedZone: true, output: 'offset', firstDayOfWeek: 1 })
    expect(d.extendedZone).toBe(true)
    expect(d.output).toBe('offset')
    expect(d.firstDayOfWeek()).toBe(1)
  })
})

describe('Localizer base — formatting', () => {
  it('formats via a named role', () => {
    expect(loc.format({ value: WED, format: 'date' })).toBe('6/3/2026')
  })
  it('formats via explicit Intl options', () => {
    expect(loc.format({ value: WED, format: { hour: '2-digit', minute: '2-digit', hour12: false } })).toBe('12:00')
  })
})

describe('Localizer base — comparison', () => {
  const a = '2026-06-03T09:00:00.000Z'
  const b = '2026-06-03T17:00:00.000Z'
  it('orders instants', () => {
    expect(loc.lt({ a, b })).toBe(true)
    expect(loc.lte({ a, b: a })).toBe(true)
    expect(loc.gt({ a: b, b: a })).toBe(true)
    expect(loc.gte({ a, b: a })).toBe(true)
    expect(loc.eq({ a, b: a })).toBe(true)
    expect(loc.neq({ a, b })).toBe(true)
  })
  it('compares at a unit granularity', () => {
    expect(loc.eq({ a, b, unit: 'day' })).toBe(true)
    expect(loc.lt({ a, b, unit: 'day' })).toBe(false)
  })
  it('inRange is inclusive', () => {
    expect(loc.inRange({ value: a, min: a, max: b })).toBe(true)
    expect(loc.inRange({ value: '2026-06-04T00:00:00.000Z', min: a, max: b })).toBe(false)
    expect(loc.inRange({ value: b, min: a, max: b, unit: 'day' })).toBe(true)
  })
})

describe('Localizer base — math', () => {
  it('adds units including week', () => {
    expect(loc.add({ value: WED, amount: 1, unit: 'day' })).toBe('2026-06-04T12:00:00.000Z')
    expect(loc.add({ value: WED, amount: 1, unit: 'week' })).toBe('2026-06-10T12:00:00.000Z')
    expect(loc.add({ value: WED, amount: 2, unit: 'hour' })).toBe('2026-06-03T14:00:00.000Z')
    expect(loc.add({ value: WED, amount: -1, unit: 'month' })).toBe('2026-05-03T12:00:00.000Z')
  })
  it('floors with startOf', () => {
    expect(loc.startOf({ value: WED, unit: 'day' })).toBe('2026-06-03T00:00:00.000Z')
    expect(loc.startOf({ value: WED, unit: 'month' })).toBe('2026-06-01T00:00:00.000Z')
    expect(loc.startOf({ value: WED, unit: 'year' })).toBe('2026-01-01T00:00:00.000Z')
  })
  it('caps with endOf including week', () => {
    expect(loc.endOf({ value: WED, unit: 'day' })).toBe('2026-06-03T23:59:59.999Z')
    expect(loc.endOf({ value: WED, unit: 'month' })).toBe('2026-06-30T23:59:59.999Z')
    // week containing Wed Jun 3 (Sun-first) ends Sat Jun 6
    expect(loc.endOf({ value: WED, unit: 'week' })).toBe('2026-06-06T23:59:59.999Z')
  })
  it('ceils to the next boundary, leaving exact boundaries untouched', () => {
    expect(loc.ceil({ value: WED, unit: 'day' })).toBe('2026-06-04T00:00:00.000Z')
    expect(loc.ceil({ value: '2026-06-03T00:00:00.000Z', unit: 'day' })).toBe('2026-06-03T00:00:00.000Z')
  })
  it('diffs across units', () => {
    expect(loc.diff({ a: '2026-06-10T12:00:00.000Z', b: WED, unit: 'day' })).toBe(7)
    expect(loc.diff({ a: '2026-06-17T12:00:00.000Z', b: WED, unit: 'week' })).toBe(2)
    expect(loc.diff({ a: '2026-09-03T12:00:00.000Z', b: WED, unit: 'month' })).toBe(3)
    expect(loc.diff({ a: '2029-06-03T12:00:00.000Z', b: WED, unit: 'year' })).toBe(3)
  })
  it('builds inclusive ranges', () => {
    expect(loc.range({ start: '2026-06-01T00:00:00.000Z', end: '2026-06-03T00:00:00.000Z' })).toEqual([
      '2026-06-01T00:00:00.000Z',
      '2026-06-02T00:00:00.000Z',
      '2026-06-03T00:00:00.000Z',
    ])
    expect(loc.range({ start: '2026-06-01T00:00:00.000Z', end: '2026-06-15T00:00:00.000Z', unit: 'week' })).toHaveLength(3)
  })
  it('finds min and max', () => {
    const values = ['2026-06-03T00:00:00.000Z', '2026-06-01T00:00:00.000Z', '2026-06-09T00:00:00.000Z']
    expect(loc.min({ values })).toBe('2026-06-01T00:00:00.000Z')
    expect(loc.max({ values })).toBe('2026-06-09T00:00:00.000Z')
  })
  it('throws on empty min/max', () => {
    expect(() => loc.min({ values: [] })).toThrow(RangeError)
    expect(() => loc.max({ values: [] })).toThrow(RangeError)
  })
})

describe('Localizer base — week and visible range', () => {
  it('derives Sunday week start for en-US', () => {
    expect(loc.firstDayOfWeek()).toBe(7)
    expect(loc.startOfWeek(WED)).toBe('2026-05-31T00:00:00.000Z')
  })
  it('respects a Monday-first override', () => {
    const mon = new TestLocalizer({ ...base, firstDayOfWeek: 1 })
    expect(mon.startOfWeek(WED)).toBe('2026-06-01T00:00:00.000Z')
  })
  it('falls back to Monday (1) when neither an override nor locale weekInfo yields a firstDay', () => {
    // Force the otherwise-unreachable last-resort branch: weekInfo with no firstDay.
    vi.mocked(weekInfo.getWeekInfo).mockReturnValueOnce({
      firstDay: undefined as unknown as number,
      weekend: [6, 7],
      minimalDays: 1,
    })
    const fallback = new TestLocalizer(base)
    expect(fallback.firstDayOfWeek()).toBe(1)
  })
  it('computes the visible month grid', () => {
    expect(loc.firstVisibleDay(WED)).toBe('2026-05-31T00:00:00.000Z')
    expect(loc.lastVisibleDay(WED)).toBe('2026-07-04T00:00:00.000Z')
    const days = loc.visibleDays(WED)
    expect(days).toHaveLength(35)
    expect(days[0]).toBe('2026-05-31T00:00:00.000Z')
    expect(days[days.length - 1]).toBe('2026-07-04T00:00:00.000Z')
  })
})

describe('Localizer base — slot and minute math', () => {
  it('reads the minute field', () => {
    expect(loc.minutes('2026-06-03T09:45:00.000Z')).toBe(45)
  })
  it('computes minutes from midnight', () => {
    expect(loc.getMinutesFromMidnight('2026-06-03T10:30:00.000Z')).toBe(630)
  })
  it('computes total minutes across a span', () => {
    expect(loc.getTotalMin({ start: '2026-06-03T10:00:00.000Z', end: '2026-06-03T11:30:00.000Z' })).toBe(90)
  })
  it('resolves a slot date from minutes', () => {
    expect(loc.getSlotDate({ date: '2026-06-03T00:00:00.000Z', minutesFromMidnight: 630 })).toBe('2026-06-03T10:30:00.000Z')
    expect(loc.getSlotDate({ date: '2026-06-03T00:00:00.000Z', minutesFromMidnight: 1500 })).toBe('2026-06-04T01:00:00.000Z')
  })
  it('measures day span', () => {
    expect(loc.daySpan({ start: '2026-06-01T00:00:00.000Z', end: '2026-06-04T00:00:00.000Z' })).toBe(3)
  })
})

describe('Localizer base — timeZone and DST', () => {
  it('reports UTC offset as zero', () => {
    expect(loc.getTimezoneOffset(WED)).toBeCloseTo(0)
    expect(loc.getDstOffset({ start: WED, end: '2026-12-03T12:00:00.000Z' })).toBe(0)
  })
})

describe('Localizer base — event-range helpers', () => {
  it('matches same calendar day', () => {
    expect(loc.isSameDate({ a: '2026-06-03T01:00:00.000Z', b: '2026-06-03T23:00:00.000Z' })).toBe(true)
    expect(loc.isSameDate({ a: '2026-06-03T01:00:00.000Z', b: '2026-06-04T01:00:00.000Z' })).toBe(false)
  })
  it('detects date-only (all-day) spans', () => {
    expect(loc.startAndEndAreDateOnly({ start: '2026-06-03T00:00:00.000Z', end: '2026-06-04T00:00:00.000Z' })).toBe(true)
    expect(loc.startAndEndAreDateOnly({ start: '2026-06-03T09:00:00.000Z', end: '2026-06-04T00:00:00.000Z' })).toBe(false)
  })
  it('flags events continuing before/after a range', () => {
    expect(loc.continuesPrior({ eventStart: '2026-06-01T00:00:00.000Z', rangeStart: '2026-06-03T00:00:00.000Z' })).toBe(true)
    expect(loc.continuesAfter({ eventEnd: '2026-06-09T00:00:00.000Z', rangeEnd: '2026-06-06T00:00:00.000Z' })).toBe(true)
  })
  it('tests overlap with inEventRange', () => {
    const range = { start: '2026-06-03T00:00:00.000Z', end: '2026-06-04T00:00:00.000Z' }
    expect(loc.inEventRange({ event: { start: '2026-06-03T09:00:00.000Z', end: '2026-06-03T10:00:00.000Z' }, range })).toBe(true)
    expect(loc.inEventRange({ event: { start: '2026-06-04T09:00:00.000Z', end: '2026-06-04T10:00:00.000Z' }, range })).toBe(false)
    // zero-length event inside the range
    expect(loc.inEventRange({ event: { start: '2026-06-03T12:00:00.000Z', end: '2026-06-03T12:00:00.000Z' }, range })).toBe(true)
    // zero-length event outside the range
    expect(loc.inEventRange({ event: { start: '2026-06-04T12:00:00.000Z', end: '2026-06-04T12:00:00.000Z' }, range })).toBe(false)
  })
  it('sorts by start, then all-day, then duration', () => {
    const events = [
      { id: 'e1', start: '2026-06-03T09:00:00.000Z', end: '2026-06-03T10:00:00.000Z' },
      { id: 'e2', start: '2026-06-03T09:00:00.000Z', end: '2026-06-03T12:00:00.000Z' },
      { id: 'e3', start: '2026-06-03T08:00:00.000Z', end: '2026-06-04T08:00:00.000Z', allDay: true },
      { id: 'e4', start: '2026-06-03T09:00:00.000Z', end: '2026-06-04T09:00:00.000Z', allDay: true },
    ]
    expect(loc.sortEvents({ events }).map((e) => e.id)).toEqual(['e3', 'e4', 'e2', 'e1'])
  })
})
