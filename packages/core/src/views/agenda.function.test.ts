import { beforeAll, describe, expect, it } from 'vitest'
import { DEFAULT_ACCESSORS } from '../accessors/accessors.function'
import type { Accessors } from '../accessors/accessors.type'
import { LOCALIZER_CASES } from '../testing/localizers'
import { agendaViewModel } from './agenda.function'

interface Event {
  id: number
  title: string
  start: string
  end: string
}

const accessors = DEFAULT_ACCESSORS as unknown as Accessors<Event, unknown>

const start = '2026-06-15T00:00:00.000Z'
const event = (id: number, s: string, e: string): Event => ({ id, title: `e${id}`, start: s, end: e })

describe.each(LOCALIZER_CASES)('agendaViewModel [$name]', ({ create }) => {
  let localizer: Awaited<ReturnType<typeof create>>
  // Three consecutive days from `start`, stepped through the localizer (no Date).
  let days: string[]
  beforeAll(async () => {
    localizer = await create()
    days = Array.from({ length: 3 }, (_, i) => localizer.add({ value: start, amount: i, unit: 'day' }))
  })

  it('lists only days with events, each sorted by start', () => {
    const { days: agenda } = agendaViewModel({
      localizer,
      accessors,
      days,
      events: [
        event(2, '2026-06-15T18:00:00.000Z', '2026-06-15T19:00:00.000Z'),
        event(1, '2026-06-15T09:00:00.000Z', '2026-06-15T10:00:00.000Z'),
        event(3, '2026-06-17T08:00:00.000Z', '2026-06-17T09:00:00.000Z'),
      ],
    })
    // June 16 has no events → omitted
    expect(agenda.map((d) => d.day)).toEqual([days[0], days[2]])
    expect(agenda[0]?.events.map((e) => e.id)).toEqual([1, 2])
  })

  it('repeats a multi-day event on every day it spans', () => {
    const { days: agenda } = agendaViewModel({
      localizer,
      accessors,
      days,
      events: [event(1, '2026-06-15T09:00:00.000Z', '2026-06-17T10:00:00.000Z')],
    })
    expect(agenda).toHaveLength(3)
    for (const d of agenda) expect(d.events.map((e) => e.id)).toEqual([1])
  })

  it('returns no days when nothing falls in range', () => {
    const { days: agenda } = agendaViewModel({
      localizer,
      accessors,
      days,
      events: [event(1, '2026-07-01T09:00:00.000Z', '2026-07-01T10:00:00.000Z')],
    })
    expect(agenda).toHaveLength(0)
  })

  it('drops events whose start/end does not resolve', () => {
    const broken = { id: 9, title: 'x' } as unknown as Event
    const { days: agenda } = agendaViewModel({
      localizer,
      accessors,
      days,
      events: [broken, event(1, '2026-06-15T09:00:00.000Z', '2026-06-15T10:00:00.000Z')],
    })
    expect(agenda).toHaveLength(1)
    expect(agenda[0]?.events).toHaveLength(1)
  })
})
