import { beforeAll, describe, expect, it } from 'vitest'
import { DEFAULT_ACCESSORS } from '../accessors/accessors.function'
import type { Accessors } from '../accessors/accessors.type'
import { LOCALIZER_CASES } from '../testing/localizers'
import { timeGridViewModel } from './timeGrid.function'

interface Event {
  id: number
  title: string
  start: string
  end: string
  allDay?: boolean
}

const accessors = DEFAULT_ACCESSORS as unknown as Accessors<Event, unknown>

const day = '2026-06-15T00:00:00.000Z'
const at = (h: number): string => `2026-06-15T${String(h).padStart(2, '0')}:00:00.000Z`

const event = (id: number, start: string, end: string, allDay = false): Event => ({
  id,
  title: `e${id}`,
  start,
  end,
  allDay,
})

describe.each(LOCALIZER_CASES)('timeGridViewModel [$name]', ({ create }) => {
  let localizer: Awaited<ReturnType<typeof create>>
  let weekDays: string[]
  beforeAll(async () => {
    localizer = await create()
    // Seven consecutive days from `day`, stepped through the localizer (no Date).
    weekDays = Array.from({ length: 7 }, (_, i) => localizer.add({ value: day, amount: i, unit: 'day' }))
  })

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
    // min/max are rebuilt from midnight via getSlotDate — derive their serialization.
    expect(model.columns[0]?.min).toBe(localizer.getSlotDate({ date: day, minutesFromMidnight: 8 * 60 }))
    expect(model.columns[0]?.max).toBe(localizer.getSlotDate({ date: day, minutesFromMidnight: 18 * 60 }))
  })

  it('tags the plain grid with resourceId=null and resources=null', () => {
    const model = timeGridViewModel({ localizer, accessors, days: [day], events: [event(1, at(9), at(10))] })
    expect(model.resources).toBeNull()
    expect(model.columns[0]?.resourceId).toBeNull()
  })

  describe('with resources', () => {
    interface ResEvent extends Event {
      resourceId?: number | number[]
    }
    interface Resource {
      id: number
      title: string
    }
    const resAccessors = DEFAULT_ACCESSORS as unknown as Accessors<ResEvent, Resource>
    const resources: Resource[] = [
      { id: 10, title: 'Board room' },
      { id: 20, title: 'Training room' },
    ]
    const resEvent = (id: number, resourceId: number | number[], start: string, end: string): ResEvent => ({
      id,
      title: `e${id}`,
      start,
      end,
      resourceId,
    })

    it('splits the grid into one group per resource, each with its own column', () => {
      const model = timeGridViewModel({
        localizer,
        accessors: resAccessors,
        days: [day],
        events: [resEvent(1, 10, at(9), at(10)), resEvent(2, 20, at(11), at(12))],
        resources,
      })
      expect(model.resources).toHaveLength(2)
      expect(model.columns).toHaveLength(0) // grid lives in the groups now
      const [board, training] = model.resources!
      expect(board?.resourceId).toBe(10)
      expect(board?.resourceTitle).toBe('Board room')
      expect(board?.columns).toHaveLength(1)
      expect(board?.columns[0]?.resourceId).toBe(10)
      expect(board?.columns[0]?.events.map((e) => e.event.id)).toEqual([1])
      expect(training?.columns[0]?.events.map((e) => e.event.id)).toEqual([2])
    })

    it('drops events whose resource matches none of the supplied resources', () => {
      const model = timeGridViewModel({
        localizer,
        accessors: resAccessors,
        days: [day],
        events: [resEvent(1, 10, at(9), at(10)), resEvent(99, 999, at(9), at(10))],
        resources,
      })
      const all = model.resources!.flatMap((g) => g.columns.flatMap((c) => c.events.map((e) => e.event.id)))
      expect(all).toEqual([1])
    })

    it('shows an event listing several resources under each of them', () => {
      const model = timeGridViewModel({
        localizer,
        accessors: resAccessors,
        days: [day],
        events: [resEvent(1, [10, 20], at(9), at(10))],
        resources,
      })
      expect(model.resources![0]?.columns[0]?.events.map((e) => e.event.id)).toEqual([1])
      expect(model.resources![1]?.columns[0]?.events.map((e) => e.event.id)).toEqual([1])
    })

    it('routes a resource all-day event to that resource lane only', () => {
      const allDayEvent: ResEvent = {
        id: 5,
        title: 'e5',
        start: day,
        end: localizer.add({ value: day, amount: 1, unit: 'day' }),
        allDay: true,
        resourceId: 10,
      }
      const model = timeGridViewModel({
        localizer,
        accessors: resAccessors,
        days: [day],
        events: [allDayEvent],
        resources,
      })
      expect(model.resources![0]?.allDay.levels.flat().map((s) => s.event.id)).toEqual([5])
      expect(model.resources![1]?.allDay.levels.flat()).toHaveLength(0)
      // the all-day event stays out of the time columns
      expect(model.resources![0]?.columns[0]?.events).toHaveLength(0)
    })

    it('treats an empty resources array as the plain grid', () => {
      const model = timeGridViewModel({
        localizer,
        accessors: resAccessors,
        days: [day],
        events: [resEvent(1, 10, at(9), at(10))],
        resources: [],
      })
      expect(model.resources).toBeNull()
      expect(model.columns).toHaveLength(1)
    })

    it('resource-major: produces resources groups and null dayGroups', () => {
      const model = timeGridViewModel({
        localizer,
        accessors: resAccessors,
        days: [day],
        events: [],
        resources,
        resourceLayout: 'resource',
      })
      expect(model.resources).toHaveLength(2)
      expect(model.dayGroups).toBeNull()
    })

    describe('with resourceLayout:"day"', () => {
      let twodays: [string, string]
      beforeAll(() => {
        twodays = [day, localizer.add({ value: day, amount: 1, unit: 'day' })]
      })

      it('produces dayGroups (one per day) and null resources', () => {
      const model = timeGridViewModel({
        localizer,
        accessors: resAccessors,
        days: twodays,
        events: [],
        resources,
        resourceLayout: 'day',
      })
      expect(model.resources).toBeNull()
      expect(model.dayGroups).toHaveLength(2)
    })

    it('each day group has one cell per resource in resource-list order', () => {
      const model = timeGridViewModel({
        localizer,
        accessors: resAccessors,
        days: twodays,
        events: [],
        resources,
        resourceLayout: 'day',
      })
      const group = model.dayGroups![0]!
      expect(group.date).toBe(twodays[0])
      expect(group.cells).toHaveLength(2)
      expect(group.cells[0]!.resourceId).toBe(10)
      expect(group.cells[0]!.resourceTitle).toBe('Board room')
      expect(group.cells[1]!.resourceId).toBe(20)
      expect(group.cells[1]!.resourceTitle).toBe('Training room')
    })

    it('routes events to the correct (day, resource) cell', () => {
      const day2 = twodays[1]!
      const model = timeGridViewModel({
        localizer,
        accessors: resAccessors,
        days: twodays,
        events: [
          resEvent(1, 10, at(9), at(10)),        // resource 10 on day 0
          resEvent(2, 20, at(11), at(12)),        // resource 20 on day 0
          resEvent(3, 10,
            localizer.getSlotDate({ date: day2, minutesFromMidnight: 9 * 60 }),
            localizer.getSlotDate({ date: day2, minutesFromMidnight: 10 * 60 }),
          ),  // resource 10 on day 1
        ],
        resources,
        resourceLayout: 'day',
      })
      const day0 = model.dayGroups![0]!
      const day1 = model.dayGroups![1]!
      expect(day0.cells[0]!.column.events.map((e) => e.event.id)).toEqual([1])
      expect(day0.cells[1]!.column.events.map((e) => e.event.id)).toEqual([2])
      expect(day1.cells[0]!.column.events.map((e) => e.event.id)).toEqual([3])
      expect(day1.cells[1]!.column.events).toHaveLength(0)
    })

    it('scopes all-day segments to the single day of each cell', () => {
      const allDayEvent: ResEvent = {
        id: 5,
        title: 'e5',
        start: day,
        end: localizer.add({ value: day, amount: 2, unit: 'day' }),
        allDay: true,
        resourceId: 10,
      }
      const model = timeGridViewModel({
        localizer,
        accessors: resAccessors,
        days: twodays,
        events: [allDayEvent],
        resources,
        resourceLayout: 'day',
      })
      // The multi-day all-day event appears in the resource-10 cell on BOTH days.
      expect(model.dayGroups![0]!.cells[0]!.allDay.levels.flat()).toHaveLength(1)
      expect(model.dayGroups![1]!.cells[0]!.allDay.levels.flat()).toHaveLength(1)
      // Resource 20 has no all-day events.
      expect(model.dayGroups![0]!.cells[1]!.allDay.levels.flat()).toHaveLength(0)
      // Time column is empty (all-day path).
      expect(model.dayGroups![0]!.cells[0]!.column.events).toHaveLength(0)
    })
    })
  })
})
