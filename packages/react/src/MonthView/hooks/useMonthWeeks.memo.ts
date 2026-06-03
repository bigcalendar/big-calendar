import { wrapAccessor } from '@big-calendar/core'
import { useMemo } from 'react'
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

/** One day cell of the grid, with its resolved number and state flags. */
export interface MonthDayCell {
  /** Day-start string. */
  day: string
  /** Localized day-of-month number. */
  label: string
  /** Whether the day is the current date. */
  isToday: boolean
  /** Whether the day belongs to an adjacent month. */
  isOffRange: boolean
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
}

/** One week row: its day cells, placed segments, and any overflow. */
export interface MonthWeekCell<TEvent> {
  /** Stable React key. */
  key: string
  /** The week's seven day cells. */
  days: MonthDayCell[]
  /** Events placed into stack levels. */
  segments: MonthSegmentCell<TEvent>[]
  /** Overflow indicator, or `null` when nothing spilled past the limit. */
  extra: { count: number; day: string } | null
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
    const { weeks } = viewModel.month

    const weekdays: MonthWeekday[] = (weeks[0]?.days ?? []).map((day) => ({
      day,
      long: localizer.format({ value: day, format: 'weekday' }),
      short: localizer.format({ value: day, format: 'weekdayShort' }),
    }))

    const resolvedWeeks: MonthWeekCell<TEvent>[] = weeks.map((week, weekIndex) => {
      const days: MonthDayCell[] = week.days.map((day) => ({
        day,
        label: localizer.format({ value: day, format: 'dayOfMonth' }),
        isToday: localizer.isSameDate({ a: day, b: now }),
        isOffRange: localizer.neq({ a: day, b: focus, unit: 'month' }),
      }))

      const segments: MonthSegmentCell<TEvent>[] = week.levels.flatMap((level, rowIndex) =>
        level.map((segment, segIndex) => ({
          key: `${weekIndex}-${rowIndex}-${segIndex}-${String(id(segment.event) ?? '')}`,
          event: segment.event,
          title: title(segment.event) ?? '',
          left: segment.left,
          span: segment.span,
          row: rowIndex + 1,
        })),
      )

      const extra =
        week.extra.length > 0 ? { count: week.extra.length, day: week.days[0] ?? '' } : null

      return { key: String(weekIndex), days, segments, extra }
    })

    return { weekdays, weeks: resolvedWeeks }
  }, [viewModel, localizer, accessors, getNow, focus])
}
