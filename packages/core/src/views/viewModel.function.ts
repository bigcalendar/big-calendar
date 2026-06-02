import type { LocalizerContract } from '@big-calendar/localizer'
import type { Accessors } from '../accessors/accessors.type'
import { Views } from '../constants/views.constant'
import { timeGridViewModel } from '../timegrid/timeGrid.function'
import type { ViewKey } from '../types/calendar.type'
import { agendaViewModel } from './agenda.function'
import { monthViewModel } from './month.function'
import type { CalendarViewModel, ViewModelOptions } from './viewModel.type'

/**
 * Build the view model for the active view from the visible day list, events and
 * options. Pure — it just dispatches to the right per-view builder and tags the
 * result with its `kind`/`view`. The store wraps this in a computed signal.
 */
export function buildViewModel<TEvent, TResource = unknown>(args: {
  localizer: LocalizerContract
  accessors: Accessors<TEvent, TResource>
  view: ViewKey
  days: string[]
  events: TEvent[]
  options?: ViewModelOptions
}): CalendarViewModel<TEvent> {
  const { localizer, accessors, view, days, events, options = {} } = args

  switch (view) {
    case Views.MONTH:
      return {
        kind: 'month',
        view,
        month: monthViewModel({ localizer, accessors, days, events, weekEventLimit: options.weekEventLimit }),
      }
    case Views.WEEK:
    case Views.WORK_WEEK:
    case Views.DAY:
      return {
        kind: 'time',
        view,
        timeGrid: timeGridViewModel({
          localizer,
          accessors,
          days,
          events,
          dayStartMin: options.dayStartMin,
          dayEndMin: options.dayEndMin,
          step: options.step,
          timeslots: options.timeslots,
          dayLayoutAlgorithm: options.dayLayoutAlgorithm,
          allDayMaxRows: options.allDayMaxRows,
          showMultiDayTimes: options.showMultiDayTimes,
        }),
      }
    case Views.AGENDA:
      return { kind: 'agenda', view, agenda: agendaViewModel({ localizer, accessors, days, events }) }
  }
}
