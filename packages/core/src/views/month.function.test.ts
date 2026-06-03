import { beforeAll, describe, expect, it } from 'vitest'
import { DEFAULT_ACCESSORS } from '../accessors/accessors.function'
import type { Accessors } from '../accessors/accessors.type'
import { LOCALIZER_CASES } from '../testing/localizers'
import { monthViewModel } from './month.function'

interface Event {
  id: number
  title: string
  start: string
  end: string
}

const accessors = DEFAULT_ACCESSORS as unknown as Accessors<Event, unknown>

const gridStart = '2026-06-01T00:00:00.000Z'

const event = (id: number, start: string, end: string): Event => ({
  id,
  title: `e${id}`,
  start,
  end,
})

describe.each(LOCALIZER_CASES)('monthViewModel [$name]', ({ create }) => {
  let localizer: Awaited<ReturnType<typeof create>>
  // June 2026 grid, Monday-first: Jun 1 (Mon) … Jul 5 (Sun) = 35 days, stepped
  // through the localizer (no Date). The model only groups/places the days it is
  // handed, so the fixture pins the column geometry regardless of locale.
  let monthDays: string[]
  beforeAll(async () => {
    localizer = await create()
    monthDays = Array.from({ length: 35 }, (_, i) =>
      localizer.add({ value: gridStart, amount: i, unit: 'day' }),
    )
  })

  it('splits the padded grid into weeks of seven', () => {
    const { weeks } = monthViewModel({ localizer, accessors, days: monthDays, events: [] })
    expect(weeks).toHaveLength(5)
    for (const week of weeks) expect(week.days).toHaveLength(7)
    expect(weeks[0]?.days[0]).toBe(monthDays[0])
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
