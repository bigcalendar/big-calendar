import type { DateTimeUnit, LocalizerContract } from '@big-calendar/localizer'
import { describe, expect, it } from 'vitest'
import { Views } from '../constants/views.constant'
import { viewRange } from './viewRange.function'

/**
 * Fuller UTC localizer test double — enough of the contract for visible-range
 * math (week/day/month boundaries, range stepping, min/max). `firstDayOfWeek`
 * is configurable so the work-week weekend math can be exercised under both
 * Monday-first and Sunday-first locales. Lives in a test file → out of coverage.
 */
export function makeRangeLocalizer(firstDayOfWeek = 1): LocalizerContract {
  const startOfDay = (v: string): string => {
    const d = new Date(v)
    d.setUTCHours(0, 0, 0, 0)
    return d.toISOString()
  }
  const isoWeekday = (v: string): number => (((new Date(v).getUTCDay() + 6) % 7) + 1)
  const addUnit = (v: string, amount: number, unit: DateTimeUnit): string => {
    const d = new Date(v)
    switch (unit) {
      case 'day':
        d.setUTCDate(d.getUTCDate() + amount)
        break
      case 'week':
        d.setUTCDate(d.getUTCDate() + amount * 7)
        break
      case 'month':
        d.setUTCMonth(d.getUTCMonth() + amount)
        break
      case 'year':
        d.setUTCFullYear(d.getUTCFullYear() + amount)
        break
      case 'hour':
        d.setUTCHours(d.getUTCHours() + amount)
        break
      case 'minute':
        d.setUTCMinutes(d.getUTCMinutes() + amount)
        break
      case 'second':
        d.setUTCSeconds(d.getUTCSeconds() + amount)
        break
      case 'millisecond':
        d.setUTCMilliseconds(d.getUTCMilliseconds() + amount)
        break
    }
    return d.toISOString()
  }
  const startOfWeek = (v: string): string => {
    const s = startOfDay(v)
    const back = (isoWeekday(s) - firstDayOfWeek + 7) % 7
    return addUnit(s, -back, 'day')
  }
  const startOfMonth = (v: string): string => {
    const d = new Date(v)
    d.setUTCDate(1)
    d.setUTCHours(0, 0, 0, 0)
    return d.toISOString()
  }
  const endOfMonth = (v: string): string => addUnit(addUnit(startOfMonth(v), 1, 'month'), -1, 'day')
  const firstVisibleDay = (v: string): string => startOfWeek(startOfMonth(v))
  const lastVisibleDay = (v: string): string => addUnit(startOfWeek(endOfMonth(v)), 6, 'day')
  const range = ({ start, end, unit }: { start: string; end: string; unit?: DateTimeUnit }): string[] => {
    const step = unit ?? 'day'
    const endMs = new Date(end).getTime()
    const out: string[] = []
    let cur = start
    while (new Date(cur).getTime() <= endMs) {
      out.push(cur)
      cur = addUnit(cur, 1, step)
    }
    return out
  }

  return {
    firstDayOfWeek: () => firstDayOfWeek,
    startOfWeek,
    firstVisibleDay,
    lastVisibleDay,
    visibleDays: (v: string) => range({ start: firstVisibleDay(v), end: lastVisibleDay(v), unit: 'day' }),
    startOf: ({ value, unit }: { value: string; unit: DateTimeUnit }) =>
      unit === 'week' ? startOfWeek(value) : unit === 'month' ? startOfMonth(value) : startOfDay(value),
    endOf: ({ value, unit }: { value: string; unit: DateTimeUnit }) =>
      unit === 'week'
        ? new Date(new Date(addUnit(startOfWeek(value), 6, 'day')).setUTCHours(23, 59, 59, 999)).toISOString()
        : value,
    add: ({ value, amount, unit }: { value: string; amount: number; unit: DateTimeUnit }) =>
      addUnit(value, amount, unit),
    range,
    min: ({ values }: { values: string[] }) =>
      values.reduce((a, b) => (new Date(b) < new Date(a) ? b : a)),
    max: ({ values }: { values: string[] }) =>
      values.reduce((a, b) => (new Date(b) > new Date(a) ? b : a)),
  } as unknown as LocalizerContract
}

// 2026-06-15 is a Monday; 2026-06-01 is also a Monday (handy anchors).
const monday = '2026-06-15T10:30:00.000Z'

describe('viewRange', () => {
  it('month → the padded month grid', () => {
    const r = viewRange({ localizer: makeRangeLocalizer(1), date: monday, view: Views.MONTH })
    expect(r.firstVisibleDay).toBe('2026-06-01T00:00:00.000Z')
    expect(r.lastVisibleDay).toBe('2026-07-05T00:00:00.000Z')
    expect(r.days).toHaveLength(35)
    expect(r.days[0]).toBe(r.firstVisibleDay)
    expect(r.days.at(-1)).toBe(r.lastVisibleDay)
  })

  it('week → the seven days of the date’s week (Monday-first)', () => {
    const r = viewRange({ localizer: makeRangeLocalizer(1), date: monday, view: Views.WEEK })
    expect(r.firstVisibleDay).toBe('2026-06-15T00:00:00.000Z')
    expect(r.lastVisibleDay).toBe('2026-06-21T00:00:00.000Z')
    expect(r.days).toHaveLength(7)
  })

  it('work_week → drops the weekend, leaving Mon–Fri (Monday-first locale)', () => {
    const r = viewRange({ localizer: makeRangeLocalizer(1), date: monday, view: Views.WORK_WEEK })
    expect(r.days).toHaveLength(5)
    expect(r.firstVisibleDay).toBe('2026-06-15T00:00:00.000Z')
    expect(r.lastVisibleDay).toBe('2026-06-19T00:00:00.000Z')
  })

  it('work_week → still Mon–Fri under a Sunday-first locale', () => {
    const r = viewRange({ localizer: makeRangeLocalizer(7), date: monday, view: Views.WORK_WEEK })
    expect(r.days).toHaveLength(5)
    expect(r.firstVisibleDay).toBe('2026-06-15T00:00:00.000Z')
    expect(r.lastVisibleDay).toBe('2026-06-19T00:00:00.000Z')
  })

  it('day → just the single floored day', () => {
    const r = viewRange({ localizer: makeRangeLocalizer(1), date: monday, view: Views.DAY })
    expect(r.days).toEqual(['2026-06-15T00:00:00.000Z'])
    expect(r.firstVisibleDay).toBe('2026-06-15T00:00:00.000Z')
    expect(r.lastVisibleDay).toBe('2026-06-15T00:00:00.000Z')
  })

  it('agenda → defaults to 30 days from the date', () => {
    const r = viewRange({ localizer: makeRangeLocalizer(1), date: monday, view: Views.AGENDA })
    expect(r.days).toHaveLength(30)
    expect(r.firstVisibleDay).toBe('2026-06-15T00:00:00.000Z')
    expect(r.lastVisibleDay).toBe('2026-07-14T00:00:00.000Z')
  })

  it('agenda → honours a custom length', () => {
    const r = viewRange({ localizer: makeRangeLocalizer(1), date: monday, view: Views.AGENDA, length: 7 })
    expect(r.days).toHaveLength(7)
    expect(r.lastVisibleDay).toBe('2026-06-21T00:00:00.000Z')
  })
})
