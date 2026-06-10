import type { LocalizerContract } from '@big-calendar/localizer'
import { Views } from '../constants/views.constant'
import type { ViewKey, VisibleRange } from '../types/calendar.type'
import type { ViewRegistrySeams } from '../views/viewRegistry.type'

/** Arguments for {@link viewLabel}. */
export interface ViewLabelArgs {
  localizer: LocalizerContract
  /** The active view. */
  view: ViewKey
  /** The focus date (used by single-period titles: month / day). */
  date: string
  /** The visible range (used by spanning titles: week / work_week / agenda). */
  range: VisibleRange
  /** Custom view registry; consulted only for a non-built-in `view`. */
  registry?: ViewRegistrySeams | undefined
}

/** "Jun 1 – 7"-style label for a date span (both ends inclusive). */
function spanLabel(localizer: LocalizerContract, start: string, end: string): string {
  return localizer.formatDateRange({ start, end, format: 'monthDay' })
}

/**
 * The localized toolbar title for the current view and focus date. Computed in
 * core (it already owns the localizer + date + range) so every framework adapter
 * renders an identical, correctly-localized label.
 *
 * - month → "June 2026" (focus month)
 * - day → "Monday, June 1" (focus day)
 * - week / work_week / agenda → the visible span ("Jun 1 – Jun 7")
 */
export function viewLabel({ localizer, view, date, range, registry }: ViewLabelArgs): string {
  switch (view) {
    case Views.MONTH:
      return localizer.format({ value: date, format: 'monthHeader' })
    case Views.DAY:
      return localizer.format({ value: date, format: 'dayHeader' })
    case Views.WEEK:
    case Views.WORK_WEEK:
    case Views.AGENDA:
      return spanLabel(localizer, range.firstVisibleDay, range.lastVisibleDay)
    default: {
      const definition = registry?.[view]
      if (definition) return definition.label({ localizer, date, range })
      throw new Error(`viewLabel: unknown view "${view}". Register it via the \`viewDefinitions\` config.`)
    }
  }
}
