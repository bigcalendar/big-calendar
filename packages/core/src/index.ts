export const PACKAGE_NAME = '@big-calendar/core'

export { Navigate, Views } from './constants/views.constant'
export type { BuiltinViewKey, NavigateDirection } from './constants/views.constant'

export type { EventId, ResourceId, ViewKey } from './types/calendar.type'

export {
  accessor,
  DEFAULT_ACCESSORS,
  resolveAccessors,
  wrapAccessor,
} from './accessors/accessors.function'
export type { Accessor, AccessorFn, Accessors, WrappedAccessor } from './accessors/accessors.type'

export { createCalendarStore } from './store/createCalendarStore.function'
export { navigateDate } from './store/navigateDate.function'
export type { CalendarStore } from './store/store.type'
export type { CalendarConfig } from './types/config.type'
