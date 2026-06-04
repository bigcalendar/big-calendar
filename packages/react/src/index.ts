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
export { Calendar } from './Calendar'
export { Toolbar, DefaultToolbar } from './Toolbar'
export { MonthView } from './MonthView'
export { TimeGridView } from './TimeGridView'
export { AgendaView } from './AgendaView'
export type {
  AgendaComponents,
  AgendaDateProps,
  AgendaEmptyProps,
  AgendaEventProps,
  CalendarComponents,
  MonthComponents,
  MonthDateProps,
  MonthEventProps,
  MonthShowMoreProps,
  MonthWeekdayProps,
  TimeAllDayEventProps,
  TimeComponents,
  TimeDayHeadingProps,
  TimeEventProps,
  TimeLabelProps,
  TimeShowMoreProps,
  ToolbarProps,
} from './components.type'
