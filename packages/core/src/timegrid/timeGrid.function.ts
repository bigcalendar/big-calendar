import type { LocalizerContract } from '@big-calendar/localizer'
import type { Accessors } from '../accessors/accessors.type'
import { resolveDayLayoutAlgorithm } from '../layout/dayLayout.function'
import type { DayLayoutAlgorithm, DayLayoutAlgorithmKey, DayLayoutEvent } from '../layout/layout.type'
import { datedEvents, rowSegments } from '../views/segments.function'
import type { DatedEvent } from '../views/segments.function'
import { createSlotMetrics } from './slotMetrics.function'
import type { PositionedEvent, TimeGridColumn, TimeGridViewModel } from './timeGrid.type'

/**
 * Decide whether an event belongs in the all-day header rather than a time
 * column: explicitly all-day, date-only, or (unless `showMultiDayTimes`) a
 * multi-day event. Mirrors v1's `TimeGrid` split.
 */
function isAllDay<TEvent>(
  item: DatedEvent<TEvent>,
  localizer: LocalizerContract,
  showMultiDayTimes: boolean,
): boolean {
  return (
    item.allDay ||
    localizer.startAndEndAreDateOnly({ start: item.start, end: item.end }) ||
    (!showMultiDayTimes && !localizer.isSameDate({ a: item.start, b: item.end }))
  )
}

/**
 * Build the time-grid view model for the day / week / work-week views: an
 * all-day header row plus one time column per visible day, with timed events
 * positioned by the slot metrics and packed by the chosen day-layout algorithm.
 *
 * Pure. `days` is the visible day list (1, 5 or 7 day-starts). The window each
 * day spans is `[dayStartMin, dayEndMin]` minutes from midnight (default the
 * full 0–1440). `dayLayoutAlgorithm` is a built-in key or a custom function.
 */
export function timeGridViewModel<TEvent, TResource = unknown>(args: {
  localizer: LocalizerContract
  accessors: Accessors<TEvent, TResource>
  days: string[]
  events: TEvent[]
  backgroundEvents?: TEvent[] | undefined
  dayStartMin?: number | undefined
  dayEndMin?: number | undefined
  step?: number | undefined
  timeslots?: number | undefined
  dayLayoutAlgorithm?: DayLayoutAlgorithmKey | DayLayoutAlgorithm | undefined
  allDayMaxRows?: number | undefined
  showMultiDayTimes?: boolean | undefined
}): TimeGridViewModel<TEvent> {
  const {
    localizer,
    accessors,
    days,
    events,
    backgroundEvents = [],
    dayStartMin = 0,
    dayEndMin = 1440,
    step = 30,
    timeslots = 2,
    dayLayoutAlgorithm = 'overlap',
    allDayMaxRows = Infinity,
    showMultiDayTimes = false,
  } = args

  const algorithm = resolveDayLayoutAlgorithm(dayLayoutAlgorithm)
  const minimumStartDifference = Math.ceil((step * timeslots) / 2)
  const items = datedEvents({ events, accessors })
  const bgItems = datedEvents({ events: backgroundEvents, accessors })

  const allDayItems: DatedEvent<TEvent>[] = []
  const timedItems: DatedEvent<TEvent>[] = []
  for (const item of items) {
    if (isAllDay(item, localizer, showMultiDayTimes)) allDayItems.push(item)
    else timedItems.push(item)
  }

  const allDay = rowSegments({ localizer, days, items: allDayItems, limit: allDayMaxRows })

  const columns: TimeGridColumn<TEvent>[] = days.map((date) => {
    const min = localizer.getSlotDate({ date, minutesFromMidnight: dayStartMin })
    const max = localizer.getSlotDate({ date, minutesFromMidnight: dayEndMin })
    const metrics = createSlotMetrics({ localizer, min, max, step, timeslots })

    const dayEvents = timedItems.filter((item) =>
      localizer.inEventRange({
        event: { start: item.start, end: item.end },
        range: { start: min, end: max },
      }),
    )

    const layoutEvents: DayLayoutEvent[] = dayEvents.map((item, index) => {
      const range = metrics.getRange({ start: item.start, end: item.end })
      return { id: index, start: range.start, end: range.end, top: range.top, height: range.height }
    })

    const boxes = algorithm({ events: layoutEvents, minimumStartDifference })

    const events: PositionedEvent<TEvent>[] = []
    for (const box of boxes) {
      const item = dayEvents[box.id as number]
      if (!item) continue
      events.push({
        event: item.event,
        top: box.top,
        height: box.height,
        left: box.left,
        width: box.width,
        zIndex: box.zIndex,
      })
    }

    // Background events sit full-width behind the foreground (no overlap packing).
    const background: PositionedEvent<TEvent>[] = bgItems
      .filter((item) =>
        localizer.inEventRange({
          event: { start: item.start, end: item.end },
          range: { start: min, end: max },
        }),
      )
      .map((item) => {
        const range = metrics.getRange({ start: item.start, end: item.end })
        return { event: item.event, top: range.top, height: range.height, left: 0, width: 1, zIndex: 0 }
      })

    return { date, min, max, events, backgroundEvents: background }
  })

  return { days, columns, allDay }
}
