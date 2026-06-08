import type { LocalizerContract } from '@big-calendar/localizer'
import { Views } from '../constants/views.constant'
import type { ViewKey, VisibleRange } from '../types/calendar.type'
import type { ViewRegistrySeams } from '../views/viewRegistry.type'

/** ISO-8601 weekday numbers for the weekend (Saturday, Sunday). */
const WEEKEND = new Set([6, 7])

/**
 * Derive the visible day-range for a date in a given view.
 *
 * Mirrors v1's per-view `range` statics, but string-in/string-out and built
 * purely on the {@link LocalizerContract}:
 *
 * - `month` → the padded month grid (`firstVisibleDay`…`lastVisibleDay`)
 * - `week` / `work_week` → the date's week (work-week drops Sat/Sun)
 * - `day` → that single day
 * - `agenda` → `length` days starting at the date (defaults to 30)
 *
 * Pure: no `Date`, no DOM, all math through the localizer.
 */
export function viewRange(args: {
  localizer: LocalizerContract
  date: string
  view: ViewKey
  /** Agenda page size in days; may be passed through as `undefined` (defaults to 30). */
  length?: number | undefined
  /** Custom view registry; consulted only for a non-built-in `view`. */
  registry?: ViewRegistrySeams | undefined
}): VisibleRange {
  const { localizer, date, view, length = 30, registry } = args

  switch (view) {
    case Views.MONTH: {
      return {
        firstVisibleDay: localizer.firstVisibleDay(date),
        lastVisibleDay: localizer.lastVisibleDay(date),
        days: localizer.visibleDays(date),
      }
    }

    case Views.WEEK:
    case Views.WORK_WEEK: {
      const start = localizer.startOf({ value: date, unit: 'week' })
      const end = localizer.endOf({ value: date, unit: 'week' })
      const week = localizer.range({ start, end, unit: 'day' })
      if (view === Views.WEEK) {
        return { firstVisibleDay: start, lastVisibleDay: localizer.max({ values: week }), days: week }
      }
      // work-week: the week's first day has weekday === firstDayOfWeek(), so each
      // day's ISO weekday is derivable by offset — no per-date lookup needed.
      const fdow = localizer.firstDayOfWeek()
      const days = week.filter((_day, index) => !WEEKEND.has(((fdow - 1 + index) % 7) + 1))
      return {
        firstVisibleDay: localizer.min({ values: days }),
        lastVisibleDay: localizer.max({ values: days }),
        days,
      }
    }

    case Views.DAY: {
      const day = localizer.startOf({ value: date, unit: 'day' })
      return { firstVisibleDay: day, lastVisibleDay: day, days: [day] }
    }

    case Views.AGENDA: {
      const start = localizer.startOf({ value: date, unit: 'day' })
      const last = localizer.add({ value: start, amount: length - 1, unit: 'day' })
      return {
        firstVisibleDay: start,
        lastVisibleDay: last,
        days: localizer.range({ start, end: last, unit: 'day' }),
      }
    }

    default: {
      const definition = registry?.[view]
      if (definition) return definition.range({ localizer, date, length })
      throw new Error(`viewRange: unknown view "${view}". Register it via the \`views\` config.`)
    }
  }
}
