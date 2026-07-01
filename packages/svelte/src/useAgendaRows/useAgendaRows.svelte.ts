import { wrapAccessor } from '@big-calendar/core'
import { formatEventTime } from '@big-calendar/core/utils'
import { useCalendarContext } from '../CalendarProvider'
import { fromSignal } from '../internal/fromSignal.svelte'

export interface AgendaRowEvent<TEvent> {
  key: string
  event: TEvent
  title: string
  time: string
  allDay: boolean
}

export interface AgendaRow<TEvent> {
  day: string
  label: string
  events: AgendaRowEvent<TEvent>[]
}

export function useAgendaRows<TEvent>(): { readonly current: AgendaRow<TEvent>[] | null } {
  const { store, messages } = useCalendarContext<TEvent>()
  const viewModel = fromSignal(store.viewModel)

  const rows = $derived.by((): AgendaRow<TEvent>[] | null => {
    const vm = viewModel.current
    if (vm.kind !== 'agenda') return null

    const { localizer, accessors } = store
    const id = wrapAccessor(accessors.id)
    const title = wrapAccessor(accessors.title)
    const start = wrapAccessor(accessors.start)
    const end = wrapAccessor(accessors.end)
    const allDay = wrapAccessor(accessors.allDay)

    return vm.agenda.days.map((day) => ({
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

  return { get current() { return rows } }
}
