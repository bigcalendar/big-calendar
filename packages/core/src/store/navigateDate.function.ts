import type { DateTimeUnit, LocalizerContract } from '@big-calendar/localizer'
import { Navigate, Views, type NavigateDirection } from '../constants/views.constant'
import type { ViewKey } from '../types/calendar.type'
import type { ViewRegistrySeams } from '../views/viewRegistry.type'

/**
 * How far one PREV/NEXT step moves, per built-in view. Returns `undefined` for a
 * non-built-in view (the caller then defers to the registry definition).
 */
function stepFor(args: { view: ViewKey; length: number }): { unit: DateTimeUnit; amount: number } | undefined {
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
    default:
      return undefined
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
  /** Custom view registry; consulted only for a non-built-in `view`'s step. */
  registry?: ViewRegistrySeams | undefined
}): string {
  const { localizer, date, direction, view, getNow, target, length = 30, registry } = args

  switch (direction) {
    case Navigate.TODAY:
      return getNow()
    case Navigate.DATE:
      return target ?? date
    case Navigate.PREVIOUS:
    case Navigate.NEXT: {
      const sign = direction === Navigate.NEXT ? 1 : -1
      const step = stepFor({ view, length })
      if (step) return localizer.add({ value: date, amount: sign * step.amount, unit: step.unit })
      // Custom view: defer the step to its registered definition.
      const definition = registry?.[view]
      if (definition) return definition.navigate({ localizer, date, direction, length })
      throw new Error(`navigateDate: unknown view "${view}". Register it via the \`views\` config.`)
    }
  }
}
