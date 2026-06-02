import type { DateTimeUnit, LocalizerContract } from '@big-calendar/localizer'
import { Navigate, Views, type NavigateDirection } from '../constants/views.constant'
import type { ViewKey } from '../types/calendar.type'

/** How far one PREV/NEXT step moves, per view. */
function stepFor(args: { view: ViewKey; length: number }): { unit: DateTimeUnit; amount: number } {
  const { view, length } = args
  switch (view) {
    case Views.MONTH:
      return { unit: 'month', amount: 1 }
    case Views.WEEK:
    case Views.WORK_WEEK:
      return { unit: 'week', amount: 1 }
    case Views.DAY:
      return { unit: 'day', amount: 1 }
    case Views.AGENDA:
      return { unit: 'day', amount: length }
  }
}

/**
 * Compute the next focus date for a navigation.
 *
 * - `TODAY` → `getNow()`
 * - `DATE` → the explicit `target` (or the current date when none is given)
 * - `PREV`/`NEXT` → step the current date by one view-sized period
 *   (month/week/day; agenda steps by `length` days)
 *
 * Pure: all date math goes through the localizer. Drilldown and visible-range
 * derivation are layered on in a later task; this only moves the focus date.
 */
export function navigateDate(args: {
  localizer: LocalizerContract
  date: string
  direction: NavigateDirection
  view: ViewKey
  getNow: () => string
  /** Explicit target for the `DATE` direction; may be passed through as `undefined`. */
  target?: string | undefined
  /** Agenda page size in days; may be passed through as `undefined` (defaults to 30). */
  length?: number | undefined
}): string {
  const { localizer, date, direction, view, getNow, target, length = 30 } = args

  switch (direction) {
    case Navigate.TODAY:
      return getNow()
    case Navigate.DATE:
      return target ?? date
    case Navigate.PREVIOUS:
    case Navigate.NEXT: {
      const sign = direction === Navigate.NEXT ? 1 : -1
      const { unit, amount } = stepFor({ view, length })
      return localizer.add({ value: date, amount: sign * amount, unit })
    }
  }
}
