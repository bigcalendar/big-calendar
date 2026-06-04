import { useCalendarContext } from '../CalendarProvider'
import { useSignalValue } from '../internal/useSignalValue'
import { AgendaView } from '../AgendaView'
import { MonthView } from '../MonthView'
import { TimeGridView } from '../TimeGridView'
import { Toolbar } from '../Toolbar'

/**
 * The default calendar tree. A context **consumer**: it reads the active view
 * model from the store and renders the matching view inside `.bc-calendar`, with
 * the {@link Toolbar} as a sibling outside that container. One view renders at a
 * time — the toolbar drives which.
 *
 * `toolbar` (default `true`) toggles the navigation toolbar; set it `false` to
 * omit it (for example when supplying your own toolbar elsewhere in the
 * provider). The toolbar is always a sibling outside `.bc-calendar`.
 *
 * Must render inside a {@link CalendarProvider}, which owns the store; siblings
 * in the same provider share that store. The outer layout container (sizing the
 * toolbar row and the `.bc-calendar` view area) is supplied by the app.
 */
function Calendar<TEvent = unknown, TResource = unknown>({
  toolbar = true,
}: {
  toolbar?: boolean | undefined
}) {
  const { store } = useCalendarContext<TEvent, TResource>()
  const viewModel = useSignalValue(store.viewModel)

  return (
    <>
      {toolbar ? <Toolbar /> : null}
      <div className="bc-calendar">
        {viewModel.kind === 'month' && <MonthView<TEvent> />}
        {viewModel.kind === 'time' && <TimeGridView<TEvent> />}
        {viewModel.kind === 'agenda' && <AgendaView<TEvent> />}
      </div>
    </>
  )
}

export default Calendar
