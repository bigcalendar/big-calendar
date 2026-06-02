export const PACKAGE_NAME = '@big-calendar/core'

export { BUILTIN_VIEWS, Navigate, Views } from './constants/views.constant'
export type { BuiltinViewKey, NavigateDirection } from './constants/views.constant'

export type { EventId, ResourceId, ViewKey, VisibleRange } from './types/calendar.type'

export {
  accessor,
  DEFAULT_ACCESSORS,
  resolveAccessors,
  wrapAccessor,
} from './accessors/accessors.function'
export type { Accessor, AccessorFn, Accessors, WrappedAccessor } from './accessors/accessors.type'

export { createCalendarStore } from './store/createCalendarStore.function'
export { resolveDrilldownView } from './store/drilldown.function'
export type { GetDrilldownView } from './store/drilldown.function'
export { navigateDate } from './store/navigateDate.function'
export { viewRange } from './store/viewRange.function'
export type { CalendarStore } from './store/store.type'
export type { CalendarConfig } from './types/config.type'
