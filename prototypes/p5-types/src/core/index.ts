// @big-calendar/core's public surface, as far as part 1 goes.
export * from './values.ts'
export * from './data.ts'
export * from './signals.ts'
export * from './collections.ts'
export * from './features.ts'
export * from './builtin.ts'
export * from './calendar.ts'

import type {
  AgendaFeature,
  DayGridFeature,
  TimeGridFeature,
} from './builtin.ts'
import type { CalendarFeatures } from './features.ts'

/** Month, week, day and agenda (D-62): the tutorial's starting point. */
export declare const standardFeatures: CalendarFeatures<{
  dayGrid: DayGridFeature
  timeGrid: TimeGridFeature
  agenda: AgendaFeature
}>
