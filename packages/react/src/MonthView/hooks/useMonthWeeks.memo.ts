import { wrapAccessor } from '@big-calendar/core'
import { useMemo } from 'react'
import type { ShowMoreEvent } from '../../components.type'
import { useCalendarContext } from '../../CalendarProvider'
import { useSignalValue } from '../../internal/useSignalValue'

/** A weekday column heading, resolved from the first week of the grid. */
export interface MonthWeekday {
  /** Day-start string of the representative day for the column. */
  day: string
  /** Full weekday name. */
  long: string
  /** Abbreviated weekday name. */
  short: string
}

/** One day cell of the grid, with its resolved number, state flags, and overflow. */
export interface MonthDayCell<TEvent> {
  /** Day-start string. */
  day: string
  /** Localized day-of-month number. */
  label: string
  /** Whether the day is the current date. */
  isToday: boolean
  /** Whether the day belongs to an adjacent month. */
  isOffRange: boolean
  /** Per-day overflow indicator, or `null` when nothing spilled past the limit. */
  extra: { count: number; events: ShowMoreEvent<TEvent>[] } | null
}

/** One placed event segment within a week row (ready for `segmentStyle`). */
export interface MonthSegmentCell<TEvent> {
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
  /**
   * Whether the event's **real start** falls in this week row, so the leading
   * resize handle belongs here (a multi-week event's earlier rows continue from a
   * prior week and show no start handle).
   */
  resizeStart: boolean
  /** Whether the event's **real end** falls in this week row (the trailing handle). */
  resizeEnd: boolean
}

/** One week row: its day cells, placed segments, and the overflow row. */
export interface MonthWeekCell<TEvent> {
  /** Stable React key. */
  key: string
  /** The week's seven day cells (each carrying its own overflow). */
  days: MonthDayCell<TEvent>[]
  /** Events placed into stack levels. */
  segments: MonthSegmentCell<TEvent>[]
  /** Grid row for the per-day "+N more" indicators (just below the visible levels). */
  moreRow: number
}

/** The resolved month grid: weekday headings plus laid-out week rows. */
export interface MonthGrid<TEvent> {
  weekdays: MonthWeekday[]
  weeks: MonthWeekCell<TEvent>[]
}

/**
 * Resolve the month view model into a render-ready grid. Returns `null` when the
 * active view is not the month (so {@link MonthView} can bow out cleanly).
 * `today` / `off-range` are derived here from the store's `getNow` source and the
 * focus date, using the localizer so every adapter agrees.
 */
export default function useMonthWeeks<TEvent>(): MonthGrid<TEvent> | null {
  const { store } = useCalendarContext<TEvent>()
  const viewModel = useSignalValue(store.viewModel)
  const focus = useSignalValue(store.date)
  const { localizer, accessors, getNow } = store

  return useMemo(() => {
    if (viewModel.kind !== 'month') return null

    const now = getNow()
    const id = wrapAccessor(accessors.id)
    const title = wrapAccessor(accessors.title)
    const start = wrapAccessor(accessors.start)
    const end = wrapAccessor(accessors.end)
    const { weeks } = viewModel.month

    const weekdays: MonthWeekday[] = (weeks[0]?.days ?? []).map((day) => ({
      day,
      long: localizer.format({ value: day, format: 'weekday' }),
      short: localizer.format({ value: day, format: 'weekdayShort' }),
    }))

    const resolvedWeeks: MonthWeekCell<TEvent>[] = weeks.map((week, weekIndex) => {
      const days: MonthDayCell<TEvent>[] = week.days.map((day, dayIndex) => {
        // Overflow is week-level in core; attribute it to each day cell by the
        // overflowed segments that span that day's column (1-based).
        const column = dayIndex + 1
        const covering = week.extra.filter(
          (segment) => segment.left <= column && column <= segment.right,
        )
        return {
          day,
          label: localizer.format({ value: day, format: 'dayOfMonth' }),
          isToday: localizer.isSameDate({ a: day, b: now }),
          isOffRange: localizer.neq({ a: day, b: focus, unit: 'month' }),
          extra:
            covering.length > 0
              ? {
                  count: covering.length,
                  events: covering.map((segment, segIndex) => ({
                    key: `${weekIndex}-more-${dayIndex}-${segIndex}-${String(id(segment.event) ?? '')}`,
                    event: segment.event,
                    title: title(segment.event) ?? '',
                  })),
                }
              : null,
        }
      })

      // This week's day bounds, for deciding which resize handles a segment shows:
      // the leading handle belongs to the row holding the event's real start, the
      // trailing handle to the row holding its real end (an event spanning weeks
      // shows neither on its middle rows). `ceil(end) − 1 day` is the last day the
      // event actually covers (matching the segment clamp).
      const weekFirst = week.days[0]
      const weekLast = week.days[week.days.length - 1]
      const segments: MonthSegmentCell<TEvent>[] = week.levels.flatMap((level, rowIndex) =>
        level.map((segment, segIndex) => {
          const evStart = start(segment.event)
          const evEnd = end(segment.event)
          let resizeStart = false
          let resizeEnd = false
          if (evStart != null && evEnd != null && weekFirst != null && weekLast != null) {
            const startDay = localizer.startOf({ value: evStart, unit: 'day' })
            const endDay = localizer.add({
              value: localizer.ceil({ value: evEnd, unit: 'day' }),
              amount: -1,
              unit: 'day',
            })
            resizeStart = localizer.gte({ a: startDay, b: weekFirst, unit: 'day' })
            resizeEnd = localizer.lte({ a: endDay, b: weekLast, unit: 'day' })
          }
          return {
            key: `${weekIndex}-${rowIndex}-${segIndex}-${String(id(segment.event) ?? '')}`,
            event: segment.event,
            title: title(segment.event) ?? '',
            left: segment.left,
            span: segment.span,
            row: rowIndex + 1,
            resizeStart,
            resizeEnd,
          }
        }),
      )

      return { key: String(weekIndex), days, segments, moreRow: week.levels.length + 1 }
    })

    return { weekdays, weeks: resolvedWeeks }
  }, [viewModel, localizer, accessors, getNow, focus])
}
