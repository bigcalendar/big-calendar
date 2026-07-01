import { wrapAccessor } from '@big-calendar/core'
import { formatEventTime } from '@big-calendar/core/utils'
import { computed } from 'vue'
import type { ComputedRef } from 'vue'
import { useCalendarContext } from '../CalendarProvider'
import { useSignalRef } from '../internal/useSignalRef'

/** A resolved agenda event row (display fields read via accessors + localizer). */
export interface AgendaRowEvent<TEvent> {
  /** Stable key (event id or index fallback). */
  key: string
  /** The original event object. */
  event: TEvent
  /** Resolved title. */
  title: string
  /** Formatted time (or the all-day label). */
  time: string
  /** Whether the event is all-day. */
  allDay: boolean
}

/** A resolved agenda day group. */
export interface AgendaRow<TEvent> {
  /** Day-start string. */
  day: string
  /** Localized date label. */
  label: string
  /** Events touching the day, in time order. */
  events: AgendaRowEvent<TEvent>[]
}

/**
 * Resolve the agenda view model into render-ready rows. Returns `null` when the
 * active view is not the agenda (so `<AgendaView>` can bow out cleanly).
 */
export function useAgendaRows<TEvent>(): ComputedRef<AgendaRow<TEvent>[] | null> {
  const { store, messages } = useCalendarContext<TEvent>()
  const viewModelRef = useSignalRef(store.viewModel)

  return computed(() => {
    const viewModel = viewModelRef.value
    if (viewModel.kind !== 'agenda') return null

    const { localizer, accessors } = store
    const id = wrapAccessor(accessors.id)
    const title = wrapAccessor(accessors.title)
    const start = wrapAccessor(accessors.start)
    const end = wrapAccessor(accessors.end)
    const allDay = wrapAccessor(accessors.allDay)

    return viewModel.agenda.days.map((day) => ({
      day: day.day,
      label: localizer.format({ value: day.day, format: 'agendaDate' }),
      events: day.events.map((event, index) => {
        const isAllDay = allDay(event) ?? false
        return {
          key: String(id(event) ?? index),
          event,
          title: title(event) ?? '',
          time: formatEventTime({
            localizer,
            allDayLabel: messages.allDay,
            start: start(event),
            end: end(event),
            allDay: isAllDay,
          }),
          allDay: isAllDay,
        }
      }),
    }))
  })
}
