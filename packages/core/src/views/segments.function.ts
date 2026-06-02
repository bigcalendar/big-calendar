import type { LocalizerContract } from '@big-calendar/localizer'
import { wrapAccessor } from '../accessors/accessors.function'
import type { Accessors } from '../accessors/accessors.type'
import type { EventSegment, SegmentRows } from './segments.type'

/** An event paired with its resolved start/end/allDay, ready for row math. */
export interface DatedEvent<TEvent> {
  event: TEvent
  start: string
  end: string
  allDay: boolean
}

/**
 * Resolve each event's start/end/allDay via its accessors. Events whose start
 * or end can't be resolved to a string are dropped (matching v1's null-checks).
 */
export function datedEvents<TEvent, TResource>(args: {
  events: TEvent[]
  accessors: Accessors<TEvent, TResource>
}): DatedEvent<TEvent>[] {
  const { events, accessors } = args
  const getStart = wrapAccessor(accessors.start)
  const getEnd = wrapAccessor(accessors.end)
  const getAllDay = wrapAccessor(accessors.allDay)

  return events.flatMap((event) => {
    const start = getStart(event)
    const end = getEnd(event)
    if (start == null || end == null) return []
    return [{ event, start, end, allDay: getAllDay(event) ?? false }]
  })
}

/** Two segments overlap if their column spans touch at all. */
export function segsOverlap<TEvent>(
  seg: EventSegment<TEvent>,
  others: EventSegment<TEvent>[],
): boolean {
  return others.some((other) => other.left <= seg.right && other.right >= seg.left)
}

/**
 * Clamp one event to a row of days and express it as day columns. `left`/`right`
 * are 1-based columns (1…`days.length`); `span` is the column count. Mirrors v1's
 * `eventSegments` minus the legacy `segmentOffset` tz hack (the Temporal localizer
 * already works in the target zone).
 */
export function eventSegments<TEvent>(args: {
  event: TEvent
  start: string
  end: string
  days: string[]
  first: string
  last: string
  slots: number
  localizer: LocalizerContract
}): EventSegment<TEvent> {
  const { event, start: eStart, end: eEnd, days, first, last, slots, localizer } = args

  const start = localizer.max({ values: [localizer.startOf({ value: eStart, unit: 'day' }), first] })
  const end = localizer.min({ values: [localizer.ceil({ value: eEnd, unit: 'day' }), last] })

  const padding = days.findIndex((day) => localizer.isSameDate({ a: day, b: start }))
  const span = Math.max(Math.min(localizer.diff({ a: start, b: end, unit: 'day' }), slots), 1)

  return { event, span, left: padding + 1, right: Math.max(padding + span, 1) }
}

/**
 * Stack segments into non-overlapping rows. A segment drops into the first row
 * it doesn't collide with; once `limit` rows are full, the rest spill into
 * `extra`. Each row is sorted left-to-right.
 */
export function stackIntoLevels<TEvent>(
  segments: EventSegment<TEvent>[],
  limit: number,
): SegmentRows<TEvent> {
  const levels: EventSegment<TEvent>[][] = []
  const extra: EventSegment<TEvent>[] = []

  for (const seg of segments) {
    const fit = levels.find((level) => !segsOverlap(seg, level))
    if (fit) {
      fit.push(seg)
    } else if (levels.length >= limit) {
      extra.push(seg)
    } else {
      levels.push([seg])
    }
  }

  for (const level of levels) level.sort((a, b) => a.left - b.left)
  return { levels, extra }
}

/** Multi-day events first, then single-day, each group sorted by the localizer. */
export function sortRowEvents<TEvent>(
  items: DatedEvent<TEvent>[],
  localizer: LocalizerContract,
): DatedEvent<TEvent>[] {
  const multiDay = items.filter((item) => localizer.daySpan({ start: item.start, end: item.end }) > 1)
  const singleDay = items.filter(
    (item) => localizer.daySpan({ start: item.start, end: item.end }) <= 1,
  )
  return [
    ...localizer.sortEvents({ events: multiDay }),
    ...localizer.sortEvents({ events: singleDay }),
  ]
}

/**
 * Segment and stack a set of dated events across one row of days: filter to the
 * events overlapping the row, sort them, clamp each to day columns, and stack
 * into rows capped at `limit`. The building block for both the month grid (one
 * call per week) and the time-grid all-day header (one call for all days).
 */
export function rowSegments<TEvent>(args: {
  localizer: LocalizerContract
  days: string[]
  items: DatedEvent<TEvent>[]
  limit: number
}): SegmentRows<TEvent> {
  const { localizer, days, items, limit } = args
  const first = days[0]
  const lastDay = days[days.length - 1]
  if (!first || !lastDay) return { levels: [], extra: [] }

  const last = localizer.add({ value: lastDay, amount: 1, unit: 'day' })
  const slots = localizer.diff({ a: first, b: last, unit: 'day' })

  const inRow = items.filter((item) =>
    localizer.inEventRange({
      event: { start: item.start, end: item.end },
      range: { start: first, end: last },
    }),
  )
  const segments = sortRowEvents(inRow, localizer).map((item) =>
    eventSegments({
      event: item.event,
      start: item.start,
      end: item.end,
      days,
      first,
      last,
      slots,
      localizer,
    }),
  )

  return stackIntoLevels(segments, limit)
}
