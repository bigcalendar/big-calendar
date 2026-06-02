import { describe, expect, it } from 'vitest'
import { DEFAULT_ACCESSORS } from '../accessors/accessors.function'
import type { Accessors } from '../accessors/accessors.type'
import { makeTimeLocalizer } from './slotMetrics.function.test'
import { timeGridViewModel } from './timeGrid.function'

interface Event {
  id: number
  title: string
  start: string
  end: string
  allDay?: boolean
}

const localizer = makeTimeLocalizer()
const accessors = DEFAULT_ACCESSORS as unknown as Accessors<Event, unknown>

const DAY_MS = 86_400_000
const day = '2026-06-15T00:00:00.000Z'
const at = (h: number): string => `2026-06-15T${String(h).padStart(2, '0')}:00:00.000Z`
const weekDays = Array.from({ length: 7 }, (_, i) => new Date(Date.parse(day) + i * DAY_MS).toISOString())

const event = (id: number, start: string, end: string, allDay = false): Event => ({
  id,
  title: `e${id}`,
  start,
  end,
  allDay,
})

describe('timeGridViewModel', () => {
  it('positions a timed event in its day column', () => {
    const model = timeGridViewModel({
      localizer,
      accessors,
      days: [day],
      events: [event(1, at(9), at(10))],
    })
    expect(model.columns).toHaveLength(1)
    const placed = model.columns[0]?.events[0]
    expect(placed?.event.id).toBe(1)
    expect(placed?.top).toBeCloseTo(0.375)
    expect(placed?.height).toBeCloseTo(1 / 24)
    expect(placed?.width).toBe(1) // lone event → full column
    expect(model.allDay.levels).toHaveLength(0)
  })

  it('routes an all-day event to the header row, not a column', () => {
    const model = timeGridViewModel({
      localizer,
      accessors,
      days: [day],
      events: [event(1, day, '2026-06-16T00:00:00.000Z', true)],
    })
    expect(model.columns[0]?.events).toHaveLength(0)
    expect(model.allDay.levels[0]?.[0]?.event.id).toBe(1)
  })

  it('routes a multi-day timed event to the header unless showMultiDayTimes', () => {
    const multiDay = event(1, at(9), '2026-06-17T10:00:00.000Z')
    const header = timeGridViewModel({ localizer, accessors, days: weekDays, events: [multiDay] })
    expect(header.allDay.levels[0]?.[0]?.event.id).toBe(1)
    expect(header.columns.every((c) => c.events.length === 0)).toBe(true)

    const timed = timeGridViewModel({
      localizer,
      accessors,
      days: weekDays,
      events: [multiDay],
      showMultiDayTimes: true,
    })
    expect(timed.allDay.levels).toHaveLength(0)
    expect(timed.columns.some((c) => c.events.length > 0)).toBe(true)
  })

  it('packs two overlapping timed events side by side via the overlap algorithm', () => {
    const model = timeGridViewModel({
      localizer,
      accessors,
      days: [day],
      events: [event(1, at(9), at(11)), event(2, at(10), at(12))],
    })
    const placed = model.columns[0]?.events ?? []
    expect(placed).toHaveLength(2)
    const lefts = placed.map((p) => p.left)
    expect(new Set(lefts).size).toBe(2) // they don't share a left edge
  })

  it('honours a custom day-layout algorithm key', () => {
    const model = timeGridViewModel({
      localizer,
      accessors,
      days: [day],
      events: [event(1, at(9), at(11)), event(2, at(10), at(12))],
      dayLayoutAlgorithm: 'no-overlap',
    })
    const placed = model.columns[0]?.events ?? []
    expect(placed).toHaveLength(2)
    for (const p of placed) expect(p.width).toBeCloseTo(0.5) // two even columns
  })

  it('builds one column per visible day for the week view', () => {
    const model = timeGridViewModel({
      localizer,
      accessors,
      days: weekDays,
      events: [event(1, at(9), at(10))],
    })
    expect(model.columns).toHaveLength(7)
    // the event lands only in the first day's column
    expect(model.columns[0]?.events).toHaveLength(1)
    expect(model.columns.slice(1).every((c) => c.events.length === 0)).toBe(true)
  })

  it('positions background events full-width behind the foreground', () => {
    const model = timeGridViewModel({
      localizer,
      accessors,
      days: [day],
      events: [event(1, at(9), at(10))],
      backgroundEvents: [event(2, at(8), at(18))],
    })
    const bg = model.columns[0]?.backgroundEvents ?? []
    expect(bg).toHaveLength(1)
    expect(bg[0]?.event.id).toBe(2)
    expect(bg[0]?.left).toBe(0)
    expect(bg[0]?.width).toBe(1)
    // foreground is unaffected
    expect(model.columns[0]?.events[0]?.event.id).toBe(1)
  })

  it('defaults background events to an empty list', () => {
    const model = timeGridViewModel({ localizer, accessors, days: [day], events: [event(1, at(9), at(10))] })
    expect(model.columns[0]?.backgroundEvents).toEqual([])
  })

  it('respects a custom window via dayStartMin/dayEndMin', () => {
    const model = timeGridViewModel({
      localizer,
      accessors,
      days: [day],
      events: [event(1, at(9), at(10))],
      dayStartMin: 8 * 60,
      dayEndMin: 18 * 60,
    })
    // 9am in an 8am–6pm (600-min) window: top = 60/600
    expect(model.columns[0]?.events[0]?.top).toBeCloseTo(0.1)
    expect(model.columns[0]?.min).toBe(at(8))
    expect(model.columns[0]?.max).toBe(at(18))
  })
})
