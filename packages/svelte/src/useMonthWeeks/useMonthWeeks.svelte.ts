import { wrapAccessor } from '@big-calendar/core'
import { useCalendarContext } from '../CalendarProvider'
import { fromSignal } from '../internal/fromSignal.svelte'

/** A weekday column heading, resolved from the first week of the grid. */
export interface MonthWeekday {
  day: string
  long: string
  short: string
}

/** One day cell of the grid, with its resolved label, state flags, and overflow. */
export interface MonthDayCell<TEvent> {
  day: string
  label: string
  isToday: boolean
  isOffRange: boolean
  extra: { count: number; events: { key: string; event: TEvent; title: string }[] } | null
}

/** One placed event segment within a week row. */
export interface MonthSegmentCell<TEvent> {
  key: string
  event: TEvent
  title: string
  left: number
  span: number
  row: number
  resizeStart: boolean
  resizeEnd: boolean
}

/** One week row: its day cells, placed segments, and the overflow row. */
export interface MonthWeekCell<TEvent> {
  key: string
  days: MonthDayCell<TEvent>[]
  segments: MonthSegmentCell<TEvent>[]
  moreRow: number
}

/** The resolved month grid: weekday headings plus laid-out week rows. */
export interface MonthGrid<TEvent> {
  weekdays: MonthWeekday[]
  weeks: MonthWeekCell<TEvent>[]
}

/**
 * Resolve the month view model into a render-ready grid. Returns `null` when the
 * active view is not the month.
 */
export function useMonthWeeks<TEvent>(): { readonly current: MonthGrid<TEvent> | null } {
  const { store } = useCalendarContext<TEvent>()
  const viewModel = fromSignal(store.viewModel)
  const focus = fromSignal(store.date)

  const grid = $derived.by((): MonthGrid<TEvent> | null => {
    const vm = viewModel.current
    const focusVal = focus.current
    if (vm.kind !== 'month') return null

    const { localizer, accessors, getNow } = store
    const now = getNow()
    const id = wrapAccessor(accessors.id)
    const title = wrapAccessor(accessors.title)
    const start = wrapAccessor(accessors.start)
    const end = wrapAccessor(accessors.end)
    const { weeks } = vm.month

    const weekdays: MonthWeekday[] = (weeks[0]?.days ?? []).map((day) => ({
      day,
      long: localizer.format({ value: day, format: 'weekday' }),
      short: localizer.format({ value: day, format: 'weekdayShort' }),
    }))

    const resolvedWeeks: MonthWeekCell<TEvent>[] = weeks.map((week, weekIndex) => {
      const days: MonthDayCell<TEvent>[] = week.days.map((day, dayIndex) => {
        const column = dayIndex + 1
        const covering = week.extra.filter(
          (segment) => segment.left <= column && column <= segment.right,
        )
        return {
          day,
          label: localizer.format({ value: day, format: 'dayOfMonth' }),
          isToday: localizer.isSameDate({ a: day, b: now }),
          isOffRange: localizer.neq({ a: day, b: focusVal, unit: 'month' }),
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
  })

  return { get current() { return grid } }
}
