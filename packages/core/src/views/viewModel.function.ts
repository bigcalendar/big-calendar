import type { LocalizerContract } from '@big-calendar/localizer'
import type { Accessors } from '../accessors/accessors.type'
import { Views } from '../constants/views.constant'
import { timeGridViewModel } from '../timegrid/timeGrid.function'
import type { ViewKey } from '../types/calendar.type'
import { agendaViewModel } from './agenda.function'
import { monthViewModel } from './month.function'
import type { CalendarViewModel, ViewModelOptions } from './viewModel.type'
import type { ViewRegistry } from './viewRegistry.type'

/**
 * Build the view model for the active view from the visible day list, events and
 * options. Pure — it just dispatches to the right per-view builder and tags the
 * result with its `kind`/`view`. The store wraps this in a computed signal. A
 * non-built-in `view` is built by its registered {@link ViewDefinition} and
 * tagged `kind: 'custom'`.
 */
export function buildViewModel<TEvent, TResource = unknown>(args: {
  localizer: LocalizerContract
  accessors: Accessors<TEvent, TResource>
  view: ViewKey
  days: string[]
  events: TEvent[]
  backgroundEvents?: TEvent[] | undefined
  /** Focus date; forwarded to a custom view's builder (built-ins ignore it). */
  date?: string | undefined
  /** Resource objects; forwarded to a custom view's builder. */
  resources?: TResource[] | undefined
  options?: ViewModelOptions
  /** Custom view registry; consulted only for a non-built-in `view`. */
  registry?: ViewRegistry<TEvent, TResource> | undefined
}): CalendarViewModel<TEvent> {
  const { localizer, accessors, view, days, events, backgroundEvents, date, resources, options = {}, registry } = args

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
          backgroundEvents,
          resources,
          resourceLayout: options.resourceLayout,
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

    default: {
      const definition = registry?.[view]
      if (definition) {
        return {
          kind: 'custom',
          view,
          model: definition.buildModel({
            localizer,
            accessors,
            view,
            date: date ?? days[0] ?? '',
            days,
            events,
            backgroundEvents,
            resources,
            options,
          }),
        }
      }
      throw new Error(`buildViewModel: unknown view "${view}". Register it via the \`viewDefinitions\` config.`)
    }
  }
}
