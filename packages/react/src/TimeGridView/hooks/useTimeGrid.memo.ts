import { createSlotMetrics, wrapAccessor } from '@big-calendar/core'
import { useMemo } from 'react'
import type { ShowMoreEvent } from '../../components.type'
import { useCalendarContext } from '../../CalendarProvider'
import { formatEventTime } from '../../internal/formatEventTime.function'
import { useSignalValue } from '../../internal/useSignalValue'

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

/** A background event filling its day column behind the foreground. */
export interface TimeBackgroundEvent<TEvent> {
  /** Stable React key. */
  key: string
  /** The original event object. */
  event: TEvent
  /** Distance from the column top, fraction `0..1`. */
  top: number
  /** Box height, fraction `0..1`. */
  height: number
}

/** One day's time column: its events, background events, and now-line position. */
export interface TimeColumn<TEvent> {
  /** Stable React key. */
  key: string
  /** Day-start string. */
  day: string
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

/** The resolved time grid: headings, gutter labels, all-day row, and day columns. */
export interface TimeGrid<TEvent> {
  headings: TimeDayHeading[]
  gutter: TimeGutterLabel[]
  /** Body height in slot rows (for `--bc-slot-count`). */
  slotCount: number
  allDay: TimeAllDayRow<TEvent>
  columns: TimeColumn<TEvent>[]
}

/**
 * Resolve the time-grid view model into a render-ready grid. Returns `null` when
 * the active view is not a time grid (so {@link TimeGridView} can bow out
 * cleanly). The gutter labels and slot count come from the first column's slot
 * metrics; the now-line is rebuilt from the same metrics on the today column so
 * it lands on the exact vertical span the model used for event boxes.
 */
export default function useTimeGrid<TEvent>(): TimeGrid<TEvent> | null {
  const { store, messages } = useCalendarContext<TEvent>()
  const viewModel = useSignalValue(store.viewModel)
  const { localizer, accessors, getNow, step, timeslots } = store

  return useMemo(() => {
    if (viewModel.kind !== 'time') return null

    const now = getNow()
    const id = wrapAccessor(accessors.id)
    const title = wrapAccessor(accessors.title)
    const start = wrapAccessor(accessors.start)
    const end = wrapAccessor(accessors.end)
    const { days, columns, allDay } = viewModel.timeGrid

    const headings: TimeDayHeading[] = days.map((day) => ({
      day,
      label: localizer.format({ value: day, format: 'dayHeader' }),
      isToday: localizer.isSameDate({ a: day, b: now }),
    }))

    // Gutter labels + slot count come from the first column's metrics (every
    // column shares the same window shape, so the times-of-day are identical).
    const gutter: TimeGutterLabel[] = []
    let slotCount = 0
    const first = columns[0]
    if (first) {
      const metrics = createSlotMetrics({ localizer, min: first.min, max: first.max, step, timeslots })
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

    const resolvedColumns: TimeColumn<TEvent>[] = columns.map((column, colIndex) => {
      const isToday = localizer.isSameDate({ a: column.date, b: now })

      const events: TimePositionedEvent<TEvent>[] = column.events.map((placed, eventIndex) => ({
        key: `${colIndex}-${eventIndex}-${String(id(placed.event) ?? '')}`,
        event: placed.event,
        title: title(placed.event) ?? '',
        time: formatEventTime({
          localizer,
          allDayLabel: messages.allDay,
          start: start(placed.event),
          end: end(placed.event),
          allDay: false,
          format: 'time',
        }),
        top: placed.top,
        height: placed.height,
        left: placed.left,
        width: placed.width,
        zIndex: placed.zIndex,
      }))

      const backgroundEvents: TimeBackgroundEvent<TEvent>[] = column.backgroundEvents.map(
        (placed, bgIndex) => ({
          key: `${colIndex}-bg-${bgIndex}-${String(id(placed.event) ?? '')}`,
          event: placed.event,
          top: placed.top,
          height: placed.height,
        }),
      )

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

      return { key: String(colIndex), day: column.date, isToday, events, backgroundEvents, nowTop, slots }
    })

    const segments: TimeAllDaySegment<TEvent>[] = allDay.levels.flatMap((level, rowIndex) =>
      level.map((segment, segIndex) => ({
        key: `${rowIndex}-${segIndex}-${String(id(segment.event) ?? '')}`,
        event: segment.event,
        title: title(segment.event) ?? '',
        left: segment.left,
        span: segment.span,
        row: rowIndex + 1,
      })),
    )
    const extra =
      allDay.extra.length > 0
        ? {
            count: allDay.extra.length,
            events: allDay.extra.map((segment, extraIndex) => ({
              key: `extra-${extraIndex}-${String(id(segment.event) ?? '')}`,
              event: segment.event,
              title: title(segment.event) ?? '',
            })),
          }
        : null

    return {
      headings,
      gutter,
      slotCount,
      allDay: { segments, extra },
      columns: resolvedColumns,
    }
  }, [viewModel, localizer, accessors, getNow, step, timeslots, messages])
}
