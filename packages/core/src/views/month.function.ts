import type { LocalizerContract } from '@big-calendar/localizer'
import { wrapAccessor } from '../accessors/accessors.function'
import type { Accessors } from '../accessors/accessors.type'
import type { MonthSegment, MonthViewModel, MonthWeek } from './month.type'

/** An event paired with its resolved start/end/allDay, ready for week math. */
interface DatedEvent<TEvent> {
  event: TEvent
  start: string
  end: string
  allDay: boolean
}

/** Two segments overlap if their column spans touch at all. */
function segsOverlap<TEvent>(seg: MonthSegment<TEvent>, others: MonthSegment<TEvent>[]): boolean {
  return others.some((other) => other.left <= seg.right && other.right >= seg.left)
}

/**
 * Clamp one event to a single week and express it as day columns.
 * `left`/`right` are 1-based columns (1–7); `span` is the column count.
 * Mirrors v1's `eventSegments` (minus the legacy `segmentOffset` tz hack —
 * the Temporal localizer already works in the target zone).
 */
function eventSegments<TEvent>(args: {
  event: TEvent
  start: string
  end: string
  weekDays: string[]
  first: string
  last: string
  slots: number
  localizer: LocalizerContract
}): MonthSegment<TEvent> {
  const { event, start: eStart, end: eEnd, weekDays, first, last, slots, localizer } = args

  const start = localizer.max({ values: [localizer.startOf({ value: eStart, unit: 'day' }), first] })
  const end = localizer.min({ values: [localizer.ceil({ value: eEnd, unit: 'day' }), last] })

  const padding = weekDays.findIndex((day) => localizer.isSameDate({ a: day, b: start }))
  const span = Math.max(Math.min(localizer.diff({ a: start, b: end, unit: 'day' }), slots), 1)

  return { event, span, left: padding + 1, right: Math.max(padding + span, 1) }
}

/**
 * Stack segments into non-overlapping rows (levels). A segment drops into the
 * first row it doesn't collide with; once `limit` rows are full, the rest spill
 * into `extra` (the "+N more" overflow). Each row is sorted left-to-right.
 */
function stackIntoLevels<TEvent>(
  segments: MonthSegment<TEvent>[],
  limit: number,
): { levels: MonthSegment<TEvent>[][]; extra: MonthSegment<TEvent>[] } {
  const levels: MonthSegment<TEvent>[][] = []
  const extra: MonthSegment<TEvent>[] = []

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
function sortWeekEvents<TEvent>(
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
 * Build the month view model: split the padded day grid into weeks, then for
 * each week clamp every overlapping event into day-column segments and stack
 * them into rows. Pure — derives entirely from its arguments.
 *
 * `days` is the padded month grid (e.g. `store.range.value.days`).
 * `weekEventLimit` caps the rows shown per week before events overflow into
 * each week's `extra` (default: no limit).
 */
export function monthViewModel<TEvent, TResource = unknown>(args: {
  localizer: LocalizerContract
  accessors: Accessors<TEvent, TResource>
  days: string[]
  events: TEvent[]
  weekEventLimit?: number | undefined
}): MonthViewModel<TEvent> {
  const { localizer, accessors, days, events, weekEventLimit = Infinity } = args

  const getStart = wrapAccessor(accessors.start)
  const getEnd = wrapAccessor(accessors.end)
  const getAllDay = wrapAccessor(accessors.allDay)

  const dated: DatedEvent<TEvent>[] = events.flatMap((event) => {
    const start = getStart(event)
    const end = getEnd(event)
    if (start == null || end == null) return []
    return [{ event, start, end, allDay: getAllDay(event) ?? false }]
  })

  const weeks: MonthWeek<TEvent>[] = []
  for (let i = 0; i < days.length; i += 7) {
    const weekDays = days.slice(i, i + 7)
    const first = weekDays[0]
    const lastDay = weekDays[weekDays.length - 1]
    if (!first || !lastDay) continue

    const last = localizer.add({ value: lastDay, amount: 1, unit: 'day' })
    const slots = localizer.diff({ a: first, b: last, unit: 'day' })

    const inWeek = dated.filter((item) =>
      localizer.inEventRange({
        event: { start: item.start, end: item.end },
        range: { start: first, end: last },
      }),
    )
    const segments = sortWeekEvents(inWeek, localizer).map((item) =>
      eventSegments({
        event: item.event,
        start: item.start,
        end: item.end,
        weekDays,
        first,
        last,
        slots,
        localizer,
      }),
    )

    const { levels, extra } = stackIntoLevels(segments, weekEventLimit)
    weeks.push({ days: weekDays, levels, extra })
  }

  return { weeks }
}
