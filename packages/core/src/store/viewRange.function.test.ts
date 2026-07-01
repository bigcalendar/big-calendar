import { beforeAll, describe, expect, it } from 'vitest'
import { Views } from '../constants/views.constant'
import { LOCALIZER_CASES } from '../testing/localizers'
import { viewRange } from './viewRange.function'

// 2026-06-15 is a Monday (a 10:30 wall time exercises the day-flooring path).
const monday = '2026-06-15T10:30:00.000Z'

describe.each(LOCALIZER_CASES)('viewRange [$name]', ({ create }) => {
  // The harness default (en-US) is Sunday-first; en-GB is Monday-first. Running
  // work-week under both proves the weekend-drop is independent of week start.
  let sundayFirst: Awaited<ReturnType<typeof create>>
  let mondayFirst: Awaited<ReturnType<typeof create>>
  beforeAll(async () => {
    sundayFirst = await create()
    mondayFirst = await create({ locale: 'en-GB' })
  })

  it('month → a week-aligned, 35-cell padded grid', () => {
    const r = viewRange({ localizer: mondayFirst, date: monday, view: Views.MONTH })
    expect(r.days).toHaveLength(35)
    expect(r.days[0]).toBe(r.firstVisibleDay)
    expect(r.days.at(-1)).toBe(r.lastVisibleDay)
    // the grid opens on a week boundary for the locale
    expect(mondayFirst.startOf({ value: r.firstVisibleDay, unit: 'week' })).toBe(r.firstVisibleDay)
  })

  it('week → the seven days of the date’s week', () => {
    const r = viewRange({ localizer: mondayFirst, date: monday, view: Views.WEEK })
    expect(r.days).toHaveLength(7)
    expect(r.firstVisibleDay).toBe(mondayFirst.startOf({ value: monday, unit: 'week' }))
    expect(r.firstVisibleDay).toBe(r.days[0])
    expect(r.lastVisibleDay).toBe(r.days.at(-1))
    // Monday-first locale → the week opens on the focus Monday
    expect(mondayFirst.format({ value: r.firstVisibleDay, format: 'weekday' })).toBe('Monday')
  })

  it('work_week → drops the weekend, leaving Mon–Fri (Monday-first locale)', () => {
    const r = viewRange({ localizer: mondayFirst, date: monday, view: Views.WORK_WEEK })
    expect(r.days).toHaveLength(5)
    expect(mondayFirst.format({ value: r.firstVisibleDay, format: 'weekday' })).toBe('Monday')
    expect(mondayFirst.format({ value: r.lastVisibleDay, format: 'weekday' })).toBe('Friday')
  })

  it('work_week → still Mon–Fri under a Sunday-first locale', () => {
    const r = viewRange({ localizer: sundayFirst, date: monday, view: Views.WORK_WEEK })
    expect(r.days).toHaveLength(5)
    expect(sundayFirst.format({ value: r.firstVisibleDay, format: 'weekday' })).toBe('Monday')
    expect(sundayFirst.format({ value: r.lastVisibleDay, format: 'weekday' })).toBe('Friday')
  })

  it('day → just the single floored day', () => {
    const r = viewRange({ localizer: mondayFirst, date: monday, view: Views.DAY })
    const floored = mondayFirst.startOf({ value: monday, unit: 'day' })
    expect(r.days).toEqual([floored])
    expect(r.firstVisibleDay).toBe(floored)
    expect(r.lastVisibleDay).toBe(floored)
  })

  it('agenda → defaults to 30 days from the date', () => {
    const r = viewRange({ localizer: mondayFirst, date: monday, view: Views.AGENDA })
    const start = mondayFirst.startOf({ value: monday, unit: 'day' })
    expect(r.days).toHaveLength(30)
    expect(r.firstVisibleDay).toBe(start)
    expect(r.lastVisibleDay).toBe(mondayFirst.add({ value: start, amount: 29, unit: 'day' }))
  })

  it('agenda → honours a custom length', () => {
    const r = viewRange({ localizer: mondayFirst, date: monday, view: Views.AGENDA, length: 7 })
    const start = mondayFirst.startOf({ value: monday, unit: 'day' })
    expect(r.days).toHaveLength(7)
    expect(r.lastVisibleDay).toBe(mondayFirst.add({ value: start, amount: 6, unit: 'day' }))
  })
})
