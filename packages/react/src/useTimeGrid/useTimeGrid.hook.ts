import { createSlotMetrics, wrapAccessor } from '@big-calendar/core'
import type { ResourceId } from '@big-calendar/core'
import { formatEventTime } from '@big-calendar/core/utils'
import { useMemo } from 'react'
import type { ShowMoreEvent } from '../components.type'
import { useCalendarContext } from '../CalendarProvider'
import { useSignalValue } from '../internal/useSignalValue'

/** A day column heading, with its resolved label and today state. */
export interface TimeDayHeading {
  /** Day-start string. */
  day: string
  /** Localized day heading label. */
  label: string
  /** Whether the day is the current date. */
  isToday: boolean
}

/** One labelled time in the left gutter (one per slot group). */
export interface TimeGutterLabel {
  /** Stable React key. */
  key: string
  /** The slot-boundary datetime the label marks. */
  time: string
  /** Localized time label. */
  label: string
}

/** A timed event placed in a day column (geometry ready for `eventBoxStyle`). */
export interface TimePositionedEvent<TEvent> {
  /** Stable React key. */
  key: string
  /** The original event object. */
  event: TEvent
  /** Resolved title. */
  title: string
  /** Formatted "start – end" time. */
  time: string
  /** Distance from the column top, fraction `0..1`. */
  top: number
  /** Box height, fraction `0..1`. */
  height: number
  /** Inline-start offset, fraction `0..1`. */
  left: number
  /** Box width, fraction `0..1`. */
  width: number
  /** Integer paint order. */
  zIndex: number
}

/** A background event segment placed in a day column. */
export interface TimeBackgroundEvent<TEvent> {
  /** Stable React key. */
  key: string
  /** The original event object. */
  event: TEvent
  /** Resolved title. */
  title: string
  /** Distance from the column top, fraction `0..1`. */
  top: number
  /** Box height, fraction `0..1`. */
  height: number
  /** Inline-start offset, fraction `0..1`. */
  left: number
  /** Box width, fraction `0..1`. */
  width: number
  /** True when the original event's start date is on this column's date. */
  isStart: boolean
  /** True when the original event's end date is on this column's date. */
  isEnd: boolean
}

/** One day's time column: its events, background events, and now-line position. */
export interface TimeColumn<TEvent> {
  /** Stable React key. */
  key: string
  /** Day-start string. */
  day: string
  /** Owning resource id (resource grids), or `null` in a plain grid. */
  resourceId: ResourceId | null
  /** Column window start instant (for positioning overlays like the drag preview). */
  min: string
  /** Column window end instant. */
  max: string
  /** Whether the day is the current date. */
  isToday: boolean
  /** Foreground timed events, packed by the day-layout algorithm. */
  events: TimePositionedEvent<TEvent>[]
  /** Background events, full-width behind the foreground. */
  backgroundEvents: TimeBackgroundEvent<TEvent>[]
  /** Fraction `0..1` down the column for the now line, or `null` when not today / out of window. */
  nowTop: number | null
  /** Start instant of each slot row (one per `slotCount`), for drag-to-move drop targets. */
  slots: string[]
}

/** One all-day event segment across the header row. */
export interface TimeAllDaySegment<TEvent> {
  /** Stable React key. */
  key: string
  /** The original event object. */
  event: TEvent
  /** Resolved title. */
  title: string
  /** 1-based start column. */
  left: number
  /** Column span. */
  span: number
  /** 1-based stack level. */
  row: number
}

/** The all-day header row: placed segments plus any overflow. */
export interface TimeAllDayRow<TEvent> {
  /** Events placed into stack levels. */
  segments: TimeAllDaySegment<TEvent>[]
  /** Overflow indicator, or `null` when nothing spilled past the limit. */
  extra: { count: number; events: ShowMoreEvent<TEvent>[] } | null
}

/**
 * One resource's slice of the time grid: its display title, its own day columns,
 * and its own all-day lane. Present only when the calendar has resources.
 */
export interface TimeResourceGroup<TEvent> {
  /** Stable React key. */
  key: string
  resourceId: ResourceId
  /** Resolved resource display title (for the resource header). */
  resourceTitle: string
  columns: TimeColumn<TEvent>[]
  allDay: TimeAllDayRow<TEvent>
}

/**
 * One (day × resource) cell in the day-major layout: a resolved time column for
 * this resource on this day, plus its single-day all-day row.
 */
export interface TimeDayResourceCell<TEvent> {
  /** Stable React key. */
  key: string
  resourceId: ResourceId
  resourceTitle: string
  column: TimeColumn<TEvent>
  /** All-day events for this resource scoped to this single day. */
  allDay: TimeAllDayRow<TEvent>
}

/**
 * One day's slice in the day-major layout: the resolved day heading and an
 * ordered list of per-resource cells.
 */
export interface TimeDayGroup<TEvent> {
  /** Stable React key. */
  key: string
  /** Day-start string. */
  date: string
  /** Localized day heading label. */
  label: string
  /** Whether the day is the current date. */
  isToday: boolean
  /** One cell per resource, in resource-list order. */
  cells: TimeDayResourceCell<TEvent>[]
}

/** The resolved time grid: headings, gutter labels, all-day row, and day columns. */
export interface TimeGrid<TEvent> {
  headings: TimeDayHeading[]
  gutter: TimeGutterLabel[]
  /** Body height in slot rows (for `--bc-slot-count`). */
  slotCount: number
  allDay: TimeAllDayRow<TEvent>
  columns: TimeColumn<TEvent>[]
  /**
   * Resource-major groups (`resourceLayout:'resource'`) — one per resource with
   * all visible days. `null` otherwise. The flat `columns`/`allDay` are empty
   * when this is set.
   */
  resources: TimeResourceGroup<TEvent>[] | null
  /**
   * Day-major groups (`resourceLayout:'day'`) — one per visible day with all
   * resources as cells. `null` otherwise. The flat `columns`/`allDay` are empty
   * when this is set.
   */
  dayGroups: TimeDayGroup<TEvent>[] | null
}

/**
 * Resolve the time-grid view model into a render-ready grid. Returns `null` when
 * the active view is not a time grid (so {@link TimeGridView} can bow out
 * cleanly). The gutter labels and slot count come from the first column's slot
 * metrics; the now-line is rebuilt from the same metrics on the today column so
 * it lands on the exact vertical span the model used for event boxes.
 *
 * With resources the grid splits per resource: `resources` holds the groups (each
 * a copy of the column/all-day resolution, scoped to one resource) and the flat
 * `columns`/`allDay` are empty.
 */
export function useTimeGrid<TEvent>(): TimeGrid<TEvent> | null {
  const { store, messages } = useCalendarContext<TEvent>()
  const viewModel = useSignalValue(store.viewModel)
  const { localizer, accessors, getNow, step, timeslots } = store

  return useMemo(() => {
    if (viewModel.kind !== 'time') return null

    const now = getNow()
    const id = wrapAccessor(accessors.id)
    const title = wrapAccessor(accessors.title)
    const start = wrapAccessor(accessors.start)
    const { days, columns, allDay, resources, dayGroups } = viewModel.timeGrid

    const headings: TimeDayHeading[] = days.map((day) => ({
      day,
      label: localizer.format({ value: day, format: 'dayColumnHeader' }),
      isToday: localizer.isSameDate({ a: day, b: now }),
    }))

    // Gutter labels + slot count come from the first available column's metrics
    // (every column shares the same window shape). With resources the columns live
    // in the groups, so fall back to the first resource/day group column.
    const firstColumn =
      columns[0] ?? resources?.[0]?.columns[0] ?? dayGroups?.[0]?.cells[0]?.column
    const gutter: TimeGutterLabel[] = []
    let slotCount = 0
    if (firstColumn) {
      const metrics = createSlotMetrics({ localizer, min: firstColumn.min, max: firstColumn.max, step, timeslots })
      slotCount = metrics.numSlots
      for (let group = 0; group * timeslots < metrics.numSlots; group++) {
        const time = metrics.slots[group * timeslots] ?? ''
        gutter.push({
          key: String(group),
          time,
          label: localizer.format({ value: time, format: 'timeGutter' }),
        })
      }
    }

    // Resolve one core column into a render-ready column. `keyBase` makes keys
    // unique across resource groups (which repeat the same day list).
    const resolveColumn = (column: (typeof columns)[number], keyBase: string): TimeColumn<TEvent> => {
      const isToday = localizer.isSameDate({ a: column.date, b: now })

      const events: TimePositionedEvent<TEvent>[] = column.events.map((placed, eventIndex) => ({
        key: `${keyBase}-${eventIndex}-${String(id(placed.event) ?? '')}`,
        event: placed.event,
        title: title(placed.event) ?? '',
        time: formatEventTime({
          localizer,
          allDayLabel: messages.allDay,
          start: start(placed.event),
          end: null,
          allDay: false,
          format: 'time',
        }),
        top: placed.top,
        height: placed.height,
        left: placed.left,
        width: placed.width,
        zIndex: placed.zIndex,
      }))

      const backgroundEvents: TimeBackgroundEvent<TEvent>[] = column.backgroundEvents.map((placed, bgIndex) => ({
        key: `${keyBase}-bg-${bgIndex}-${String(id(placed.event) ?? '')}`,
        event: placed.event,
        title: title(placed.event) ?? '',
        top: placed.top,
        height: placed.height,
        left: placed.left,
        width: placed.width,
        isStart: placed.isStart,
        isEnd: placed.isEnd,
      }))

      // One metrics build per column: its slot-start instants (drop targets) and,
      // for today, the now-line position. `slots` has numSlots+1 entries (the last
      // is the window end); drop the tail so it matches the slotCount hit cells.
      const metrics = createSlotMetrics({ localizer, min: column.min, max: column.max, step, timeslots })
      const slots = metrics.slots.slice(0, metrics.numSlots)

      let nowTop: number | null = null
      if (isToday) {
        const top = metrics.getCurrentTimePosition(now)
        if (top >= 0 && top <= 1) nowTop = top
      }

      return {
        key: keyBase,
        day: column.date,
        resourceId: column.resourceId,
        min: column.min,
        max: column.max,
        isToday,
        events,
        backgroundEvents,
        nowTop,
        slots,
      }
    }

    // Resolve a core all-day row (levels + overflow) into render-ready segments.
    const resolveAllDay = (rows: typeof allDay, keyBase: string): TimeAllDayRow<TEvent> => {
      const segments: TimeAllDaySegment<TEvent>[] = rows.levels.flatMap((level, rowIndex) =>
        level.map((segment, segIndex) => ({
          key: `${keyBase}-${rowIndex}-${segIndex}-${String(id(segment.event) ?? '')}`,
          event: segment.event,
          title: title(segment.event) ?? '',
          left: segment.left,
          span: segment.span,
          row: rowIndex + 1,
        })),
      )
      const extra =
        rows.extra.length > 0
          ? {
              count: rows.extra.length,
              events: rows.extra.map((segment, extraIndex) => ({
                key: `${keyBase}-extra-${extraIndex}-${String(id(segment.event) ?? '')}`,
                event: segment.event,
                title: title(segment.event) ?? '',
              })),
            }
          : null
      return { segments, extra }
    }

    // Resource-major grid: one render group per resource.
    if (resources !== null) {
      const groups: TimeResourceGroup<TEvent>[] = resources.map((group) => {
        const base = `r${String(group.resourceId)}`
        return {
          key: base,
          resourceId: group.resourceId,
          resourceTitle: group.resourceTitle,
          columns: group.columns.map((column, colIndex) => resolveColumn(column, `${base}-${colIndex}`)),
          allDay: resolveAllDay(group.allDay, base),
        }
      })
      return {
        headings,
        gutter,
        slotCount,
        allDay: { segments: [], extra: null },
        columns: [],
        resources: groups,
        dayGroups: null,
      }
    }

    // Day-major grid: one group per visible day, each with per-resource cells.
    if (dayGroups !== null) {
      const resolvedDayGroups: TimeDayGroup<TEvent>[] = dayGroups.map((group, dayIndex) => ({
        key: `d${dayIndex}`,
        date: group.date,
        label: localizer.format({ value: group.date, format: 'dayColumnHeader' }),
        isToday: localizer.isSameDate({ a: group.date, b: now }),
        cells: group.cells.map((cell, cellIndex) => {
          const base = `d${dayIndex}-r${String(cell.resourceId)}-${cellIndex}`
          return {
            key: base,
            resourceId: cell.resourceId,
            resourceTitle: cell.resourceTitle,
            column: resolveColumn(cell.column, base),
            allDay: resolveAllDay(cell.allDay, base),
          }
        }),
      }))
      return {
        headings,
        gutter,
        slotCount,
        allDay: { segments: [], extra: null },
        columns: [],
        resources: null,
        dayGroups: resolvedDayGroups,
      }
    }

    // Plain grid.
    const resolvedColumns = columns.map((column, colIndex) => resolveColumn(column, String(colIndex)))
    return {
      headings,
      gutter,
      slotCount,
      allDay: resolveAllDay(allDay, 'a'),
      columns: resolvedColumns,
      resources: null,
      dayGroups: null,
    }
  }, [viewModel, localizer, accessors, getNow, step, timeslots, messages])
}
