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
export { Popover } from './Popover'
export type { PopoverProps, PopoverTriggerProps } from './Popover'
export { Tooltip } from './Tooltip'
export type { TooltipProps } from './Tooltip'
export { Dialog } from './Dialog'
export type { DialogProps } from './Dialog'
export { useCalendarDnd } from './dnd/useCalendarDnd'
export type {
  AgendaComponents,
  AgendaDateProps,
  AgendaEmptyProps,
  AgendaEventProps,
  CalendarComponents,
  CustomViewProps,
  MonthComponents,
  MonthDateProps,
  MonthEventProps,
  MonthShowMoreProps,
  MonthWeekdayProps,
  ShowMoreEvent,
  TimeAllDayEventProps,
  TimeComponents,
  TimeDayHeadingProps,
  TimeEventProps,
  TimeLabelProps,
  TimeShowMoreProps,
  ToolbarProps,
} from './components.type'
