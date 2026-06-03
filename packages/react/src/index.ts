export const PACKAGE_NAME = '@big-calendar/react'

export { useSignalValue } from './internal/useSignalValue'
export { useCalendar } from './useCalendar'
export type { CalendarProps } from './useCalendar'
export {
  CalendarProvider,
  CalendarContext,
  useCalendarContext,
  useCalendarStore,
} from './CalendarProvider'
export type { CalendarProviderProps, CalendarContextValue } from './CalendarProvider'
export { Toolbar, DefaultToolbar } from './Toolbar'
export { AgendaView } from './AgendaView'
export type {
  AgendaComponents,
  AgendaDateProps,
  AgendaEmptyProps,
  AgendaEventProps,
  CalendarComponents,
  ToolbarProps,
} from './components.type'
