import type { DayLayoutAlgorithm, DayLayoutAlgorithmKey } from '../layout/layout.type'
import type { ViewKey } from '../types/calendar.type'
import type { AgendaViewModel } from './agenda.type'
import type { MonthViewModel } from './month.type'
import type { TimeGridViewModel } from '../timegrid/timeGrid.type'

/**
 * Tuning passed through to the per-view builders. All optional; each view uses
 * only the options that apply to it. Window bounds are minutes-from-midnight
 * (`dayStartMin`/`dayEndMin`), already resolved from the config's `min`/`max`.
 */
export interface ViewModelOptions {
  step?: number | undefined
  timeslots?: number | undefined
  dayStartMin?: number | undefined
  dayEndMin?: number | undefined
  dayLayoutAlgorithm?: DayLayoutAlgorithmKey | DayLayoutAlgorithm | undefined
  allDayMaxRows?: number | undefined
  showMultiDayTimes?: boolean | undefined
  weekEventLimit?: number | undefined
}

/**
 * The view model for the active view, discriminated by `kind`:
 * - `month` → a {@link MonthViewModel}
 * - `time` → a {@link TimeGridViewModel} (day / week / work_week)
 * - `agenda` → an {@link AgendaViewModel}
 * - `custom` → a registered view's model (its shape is `unknown` here; the
 *   matching view-component re-asserts it from the definition it registered)
 *
 * `view` carries the exact {@link ViewKey} so consumers can distinguish week
 * from work_week from day within the `time` kind — and which custom view it is
 * within the `custom` kind.
 */
export type CalendarViewModel<TEvent> =
  | { kind: 'month'; view: ViewKey; month: MonthViewModel<TEvent> }
  | { kind: 'time'; view: ViewKey; timeGrid: TimeGridViewModel<TEvent> }
  | { kind: 'agenda'; view: ViewKey; agenda: AgendaViewModel<TEvent> }
  | { kind: 'custom'; view: ViewKey; model: unknown }
