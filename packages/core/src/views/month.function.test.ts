import type { LocalizerContract } from '@big-calendar/localizer'
import { describe, expect, it } from 'vitest'
import { DEFAULT_ACCESSORS } from '../accessors/accessors.function'
import type { Accessors } from '../accessors/accessors.type'
import { monthViewModel } from './month.function'

const DAY_MS = 86_400_000
const ms = (v: string): number => new Date(v).getTime()
const startOfDay = (v: string): string => {
  const d = new Date(v)
  d.setUTCHours(0, 0, 0, 0)
  return d.toISOString()
}
const addDays = (v: string, n: number): string => new Date(ms(v) + n * DAY_MS).toISOString()
const ceilDay = (v: string): string => {
  const floored = startOfDay(v)
  return floored === v ? v : addDays(floored, 1)
}
const diffDays = (a: string, b: string): number => Math.round((ms(b) - ms(a)) / DAY_MS)

/**
 * Compact UTC localizer double — only the methods the month model touches.
 * Day-aligned math (the model floors/ceils everything to day starts), cast to
 * the contract. Lives in a test file → out of coverage.
 */
export function makeMonthLocalizer(): LocalizerContract {
  return {
    add: ({ value, amount, unit }: { value: string; amount: number; unit: string }) =>
      unit === 'day' ? addDays(value, amount) : value,
    startOf: ({ value, unit }: { value: string; unit: string }) =>
      unit === 'day' ? startOfDay(value) : value,
    ceil: ({ value, unit }: { value: string; unit: string }) =>
      unit === 'day' ? ceilDay(value) : value,
    diff: ({ a, b, unit }: { a: string; b: string; unit: string }) =>
      unit === 'day' ? diffDays(a, b) : 0,
    min: ({ values }: { values: string[] }) =>
      values.reduce((acc, v) => (ms(v) < ms(acc) ? v : acc)),
    max: ({ values }: { values: string[] }) =>
      values.reduce((acc, v) => (ms(v) > ms(acc) ? v : acc)),
    isSameDate: ({ a, b }: { a: string; b: string }) => startOfDay(a) === startOfDay(b),
    daySpan: ({ start, end }: { start: string; end: string }) =>
      Math.max(1, diffDays(startOfDay(start), ceilDay(end))),
    inEventRange: ({
      event,
      range,
    }: {
      event: { start: string; end: string }
      range: { start: string; end: string }
    }) => ms(event.start) < ms(range.end) && ms(event.end) > ms(range.start),
    sortEvents: ({ events }: { events: { start: string; end: string }[] }) =>
      [...events].sort((a, b) => ms(a.start) - ms(b.start) || ms(b.end) - ms(a.end)),
  } as unknown as LocalizerContract
}

interface Event {
  id: number
  title: string
  start: string
  end: string
}

const localizer = makeMonthLocalizer()
const accessors = DEFAULT_ACCESSORS as unknown as Accessors<Event, unknown>

// June 2026 grid, Monday-first: Jun 1 (Mon) … Jul 5 (Sun) = 35 days.
const monthDays = Array.from({ length: 35 }, (_, i) => addDays('2026-06-01T00:00:00.000Z', i))

const event = (id: number, start: string, end: string): Event => ({
  id,
  title: `e${id}`,
  start,
  end,
})

describe('monthViewModel', () => {
  it('splits the padded grid into weeks of seven', () => {
    const { weeks } = monthViewModel({ localizer, accessors, days: monthDays, events: [] })
    expect(weeks).toHaveLength(5)
    for (const week of weeks) expect(week.days).toHaveLength(7)
    expect(weeks[0]?.days[0]).toBe('2026-06-01T00:00:00.000Z')
  })

  it('places a single-day event in the right column and level', () => {
    const { weeks } = monthViewModel({
      localizer,
      accessors,
      days: monthDays,
      events: [event(1, '2026-06-03T09:00:00.000Z', '2026-06-03T10:00:00.000Z')],
    })
    const seg = weeks[0]?.levels[0]?.[0]
    expect(seg).toMatchObject({ span: 1, left: 3, right: 3 })
    expect(seg?.event.id).toBe(1)
  })

  it('clamps a week-spanning event into one segment per week', () => {
    const { weeks } = monthViewModel({
      localizer,
      accessors,
      days: monthDays,
      events: [event(1, '2026-06-05T08:00:00.000Z', '2026-06-09T17:00:00.000Z')],
    })
    expect(weeks[0]?.levels[0]?.[0]).toMatchObject({ span: 3, left: 5, right: 7 })
    expect(weeks[1]?.levels[0]?.[0]).toMatchObject({ span: 2, left: 1, right: 2 })
    // weeks 3–5 don't touch the event
    expect(weeks[2]?.levels).toHaveLength(0)
  })

  it('shares a level between events that do not overlap', () => {
    const { weeks } = monthViewModel({
      localizer,
      accessors,
      days: monthDays,
      events: [
        event(1, '2026-06-02T09:00:00.000Z', '2026-06-02T10:00:00.000Z'),
        event(2, '2026-06-05T09:00:00.000Z', '2026-06-05T10:00:00.000Z'),
      ],
    })
    expect(weeks[0]?.levels).toHaveLength(1)
    expect(weeks[0]?.levels[0]).toHaveLength(2)
  })

  it('stacks overlapping events into separate levels', () => {
    const { weeks } = monthViewModel({
      localizer,
      accessors,
      days: monthDays,
      events: [
        event(1, '2026-06-03T09:00:00.000Z', '2026-06-03T10:00:00.000Z'),
        event(2, '2026-06-03T11:00:00.000Z', '2026-06-03T12:00:00.000Z'),
      ],
    })
    expect(weeks[0]?.levels).toHaveLength(2)
  })

  it('overflows past the week limit into extra', () => {
    const { weeks } = monthViewModel({
      localizer,
      accessors,
      days: monthDays,
      weekEventLimit: 2,
      events: [
        event(1, '2026-06-03T09:00:00.000Z', '2026-06-03T10:00:00.000Z'),
        event(2, '2026-06-03T11:00:00.000Z', '2026-06-03T12:00:00.000Z'),
        event(3, '2026-06-03T13:00:00.000Z', '2026-06-03T14:00:00.000Z'),
      ],
    })
    expect(weeks[0]?.levels).toHaveLength(2)
    expect(weeks[0]?.extra).toHaveLength(1)
    expect(weeks[0]?.extra[0]?.event.id).toBe(3)
  })

  it('skips events whose start or end does not resolve', () => {
    const broken = { id: 9, title: 'x' } as unknown as Event
    const { weeks } = monthViewModel({
      localizer,
      accessors,
      days: monthDays,
      events: [broken, event(1, '2026-06-02T09:00:00.000Z', '2026-06-02T10:00:00.000Z')],
    })
    const placed = weeks.flatMap((w) => w.levels.flat())
    expect(placed).toHaveLength(1)
    expect(placed[0]?.event.id).toBe(1)
  })

  it('sorts multi-day events ahead of single-day events in a week', () => {
    const { weeks } = monthViewModel({
      localizer,
      accessors,
      days: monthDays,
      events: [
        event(1, '2026-06-02T09:00:00.000Z', '2026-06-02T10:00:00.000Z'), // single
        event(2, '2026-06-01T00:00:00.000Z', '2026-06-04T00:00:00.000Z'), // multi-day
      ],
    })
    // multi-day event is processed first → it takes level 0
    expect(weeks[0]?.levels[0]?.[0]?.event.id).toBe(2)
  })
})
