import type { LocalizerContract } from '@big-calendar/localizer'
import type { Accessors } from '../accessors/accessors.type'
import type { AgendaDay, AgendaViewModel } from './agenda.type'
import { datedEvents } from './segments.function'

/**
 * Build the agenda view model: walk the visible `days` in order and, for each
 * day that has events, list every event touching it sorted by start. Days with
 * no events are skipped (v1 parity). Pure — derives entirely from its arguments.
 *
 * `days` is the agenda range (e.g. `store.range.value.days` — `length` days from
 * the focus date).
 */
export function agendaViewModel<TEvent, TResource = unknown>(args: {
  localizer: LocalizerContract
  accessors: Accessors<TEvent, TResource>
  days: string[]
  events: TEvent[]
}): AgendaViewModel<TEvent> {
  const { localizer, accessors, days, events } = args

  const sorted = localizer.sortEvents({ events: datedEvents({ events, accessors }) })

  const result: AgendaDay<TEvent>[] = []
  for (const day of days) {
    const dayStart = localizer.startOf({ value: day, unit: 'day' })
    const dayEnd = localizer.add({ value: dayStart, amount: 1, unit: 'day' })

    const dayEvents = sorted
      .filter((item) =>
        localizer.inEventRange({
          event: { start: item.start, end: item.end },
          range: { start: dayStart, end: dayEnd },
        }),
      )
      .map((item) => item.event)

    if (dayEvents.length > 0) result.push({ day: dayStart, events: dayEvents })
  }

  return { days: result }
}
