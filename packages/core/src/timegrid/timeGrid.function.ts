import type { LocalizerContract } from '@big-calendar/localizer'
import { wrapAccessor } from '../accessors/accessors.function'
import type { Accessors } from '../accessors/accessors.type'
import { resolveDayLayoutAlgorithm } from '../layout/dayLayout.function'
import type { DayLayoutAlgorithm, DayLayoutAlgorithmKey, DayLayoutEvent } from '../layout/layout.type'
import type { ResourceId } from '../types/calendar.type'
import { datedEvents, rowSegments } from '../views/segments.function'
import type { DatedEvent } from '../views/segments.function'
import type { SegmentRows } from '../views/segments.type'
import { createSlotMetrics } from './slotMetrics.function'
import type {
  PositionedBgEvent,
  PositionedEvent,
  ResourceLayoutMode,
  TimeGridColumn,
  TimeGridDayGroup,
  TimeGridResourceGroup,
  TimeGridViewModel,
} from './timeGrid.type'

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

/** Shared per-column build inputs (everything constant across columns). */
interface ColumnContext {
  localizer: LocalizerContract
  dayStartMin: number
  dayEndMin: number
  step: number
  timeslots: number
  algorithm: DayLayoutAlgorithm
  minimumStartDifference: number
}

/**
 * Lay out one day's column: position the timed items by the slot metrics, pack
 * them with the chosen algorithm, and place the background events full-width
 * behind. `resourceId` tags the column for the resource grid (`null` otherwise).
 */
function buildColumn<TEvent>(
  ctx: ColumnContext,
  date: string,
  resourceId: ResourceId | null,
  timedItems: DatedEvent<TEvent>[],
  bgItems: DatedEvent<TEvent>[],
): TimeGridColumn<TEvent> {
  const { localizer, dayStartMin, dayEndMin, step, timeslots, algorithm, minimumStartDifference } = ctx
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

  // Background events are packed by the same overlap algorithm as foreground
  // events so multiple overlapping bg events display side-by-side.
  const bgDayEvents = bgItems.filter((item) =>
    localizer.inEventRange({
      event: { start: item.start, end: item.end },
      range: { start: min, end: max },
    }),
  )

  const bgLayoutEvents: DayLayoutEvent[] = bgDayEvents.map((item, index) => {
    const range = metrics.getRange({ start: item.start, end: item.end })
    return { id: index, start: range.start, end: range.end, top: range.top, height: range.height }
  })

  const bgBoxes = algorithm({ events: bgLayoutEvents, minimumStartDifference })

  const background: PositionedBgEvent<TEvent>[] = []
  for (const box of bgBoxes) {
    const item = bgDayEvents[box.id as number]
    if (!item) continue
    background.push({
      event: item.event,
      top: box.top,
      height: box.height,
      left: box.left,
      width: box.width,
      zIndex: box.zIndex,
      isStart: localizer.isSameDate({ a: item.start, b: date }),
      isEnd: localizer.isSameDate({ a: item.end, b: date }),
    })
  }

  return { date, resourceId, min, max, events, backgroundEvents: background }
}

/**
 * Build the time-grid view model for the day / week / work-week views: an
 * all-day header row plus one time column per visible day, with timed events
 * positioned by the slot metrics and packed by the chosen day-layout algorithm.
 *
 * When `resources` is supplied the grid splits per resource. `resourceLayout`
 * controls the grouping order:
 * - `'resource'` (default): one group per resource, each containing all visible
 *   days — returned in `resources`; `dayGroups` is `null`.
 * - `'day'`: one group per visible day, each containing per-resource cells with
 *   a single-day column and day-scoped all-day segments — returned in
 *   `dayGroups`; `resources` is `null`.
 *
 * Events whose resource matches none of the supplied resources are dropped; an
 * event listing several resources appears under each. The flat `columns`/`allDay`
 * are always empty when resources are present.
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
  resources?: TResource[] | undefined
  resourceLayout?: ResourceLayoutMode | undefined
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
    resources,
    resourceLayout = 'resource',
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
  const ctx: ColumnContext = {
    localizer,
    dayStartMin,
    dayEndMin,
    step,
    timeslots,
    algorithm,
    minimumStartDifference,
  }

  const items = datedEvents({ events, accessors })
  const bgItems = datedEvents({ events: backgroundEvents, accessors })

  const allDayItems: DatedEvent<TEvent>[] = []
  const timedItems: DatedEvent<TEvent>[] = []
  for (const item of items) {
    if (isAllDay(item, localizer, showMultiDayTimes)) allDayItems.push(item)
    else timedItems.push(item)
  }

  // Resource grid: split every bucket per resource and build groups.
  if (resources && resources.length > 0) {
    const getResourceId = wrapAccessor(accessors.resourceId)
    const getResourceTitle = wrapAccessor(accessors.resourceTitle)
    const getResourceType = wrapAccessor(accessors.resourceType)
    const getEventResource = wrapAccessor(accessors.resource)

    const resourceIdsOf = (event: TEvent): ResourceId[] => {
      const raw = getEventResource(event)
      return raw == null ? [] : Array.isArray(raw) ? raw : [raw]
    }
    const belongsTo = (item: DatedEvent<TEvent>, id: ResourceId): boolean =>
      resourceIdsOf(item.event).includes(id)

    const emptyAllDay: SegmentRows<TEvent> = { levels: [], extra: [] }

    if (resourceLayout === 'day') {
      // Day-major: one group per visible day, each containing one cell per resource.
      const dayGroups: TimeGridDayGroup<TEvent>[] = days.map((date) => {
        const cells = []
        for (const resource of resources) {
          const resourceId = getResourceId(resource)
          if (resourceId == null) continue
          const resourceTitle = getResourceTitle(resource) ?? ''
          const resourceType = getResourceType(resource) ?? null
          const timedHere = timedItems.filter((item) => belongsTo(item, resourceId))
          const bgHere = bgItems.filter((item) => belongsTo(item, resourceId))
          const allDayHere = allDayItems.filter((item) => belongsTo(item, resourceId))
          cells.push({
            resourceId,
            resourceTitle,
            resourceType,
            column: buildColumn(ctx, date, resourceId, timedHere, bgHere),
            // Single-day scope: segments always have left:1, span:1.
            allDay: rowSegments({ localizer, days: [date], items: allDayHere, limit: allDayMaxRows }),
          })
        }
        return { date, cells }
      })
      return { days, columns: [], allDay: emptyAllDay, resources: null, dayGroups }
    }

    // Resource-major (default): one group per resource, each spanning all visible days.
    const groups: TimeGridResourceGroup<TEvent>[] = []
    for (const resource of resources) {
      const resourceId = getResourceId(resource)
      // A resource without an id can hold no events and can't be a drop target; skip it.
      if (resourceId == null) continue
      const resourceTitle = getResourceTitle(resource) ?? ''
      const resourceType = getResourceType(resource) ?? null
      const timedHere = timedItems.filter((item) => belongsTo(item, resourceId))
      const bgHere = bgItems.filter((item) => belongsTo(item, resourceId))
      const allDayHere = allDayItems.filter((item) => belongsTo(item, resourceId))
      groups.push({
        resourceId,
        resourceTitle,
        resourceType,
        columns: days.map((date) => buildColumn(ctx, date, resourceId, timedHere, bgHere)),
        allDay: rowSegments({ localizer, days, items: allDayHere, limit: allDayMaxRows }),
      })
    }

    return { days, columns: [], allDay: emptyAllDay, resources: groups, dayGroups: null }
  }

  // Plain grid (no resources): one column per day, one shared all-day row.
  const allDay = rowSegments({ localizer, days, items: allDayItems, limit: allDayMaxRows })
  const columns = days.map((date) => buildColumn(ctx, date, null, timedItems, bgItems))

  return { days, columns, allDay, resources: null, dayGroups: null }
}
