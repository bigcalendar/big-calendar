import type { LocalizerContract } from '@big-calendar/localizer'
import type { Accessors } from '../accessors/accessors.type'
import type { MonthViewModel, MonthWeek } from './month.type'
import { datedEvents, rowSegments } from './segments.function'

/**
 * Build the month view model: split the padded day grid into weeks, then for
 * each week clamp every overlapping event into day-column segments and stack
 * them into rows. Pure — derives entirely from its arguments.
 *
 * `days` is the padded month grid (e.g. `store.range.value.days`).
 * `weekEventLimit` caps the rows shown per week before events overflow into
 * each week's `extra` (default: no limit).
 */
export function monthViewModel<TEvent, TResource = unknown>(args: {
  localizer: LocalizerContract
  accessors: Accessors<TEvent, TResource>
  days: string[]
  events: TEvent[]
  weekEventLimit?: number | undefined
}): MonthViewModel<TEvent> {
  const { localizer, accessors, days, events, weekEventLimit = Infinity } = args

  const items = datedEvents({ events, accessors })

  const weeks: MonthWeek<TEvent>[] = []
  for (let i = 0; i < days.length; i += 7) {
    const weekDays = days.slice(i, i + 7)
    const { levels, extra } = rowSegments({ localizer, days: weekDays, items, limit: weekEventLimit })
    weeks.push({ days: weekDays, levels, extra })
  }

  return { weeks }
}
