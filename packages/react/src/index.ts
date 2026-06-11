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
export { useEventRoving } from './useEventRoving'
export { useKeyboardDnd } from './useKeyboardDnd'
export { useRovingSelection } from './useRovingSelection'
export type { Direction } from './useRovingSelection'
export { useSlotSelection } from './useSlotSelection'
export { useMonthWeeks } from './useMonthWeeks'
export type { MonthDayCell, MonthGrid, MonthSegmentCell, MonthWeekCell, MonthWeekday } from './useMonthWeeks'
export { useAgendaRows } from './useAgendaRows'
export type { AgendaRow, AgendaRowEvent } from './useAgendaRows'
export { useTimeGrid } from './useTimeGrid'
export type {
  TimeAllDayRow,
  TimeAllDaySegment,
  TimeBackgroundEvent,
  TimeColumn,
  TimeDayGroup,
  TimeDayHeading,
  TimeDayResourceCell,
  TimeGrid,
  TimeGutterLabel,
  TimePositionedEvent,
  TimeResourceGroup,
} from './useTimeGrid'
export { useToolbarProps } from './useToolbarProps'
export { useFloatingAnchor } from './useFloatingAnchor'
export { formatEventTime } from '@big-calendar/core/utils'
export type { FormatEventTimeArgs } from '@big-calendar/core/utils'
export { positionFloating } from '@big-calendar/core/utils'
export type { FloatingPlacement, FloatingPosition, PositionFloatingOptions } from '@big-calendar/core/utils'
export type { CSSVars, EventBoxGeometry, SegmentGeometry, SelectionGeometry } from './geometryStyles'
export {
  agendaRowsStyle,
  dayCountStyle,
  eventBoxStyle,
  monthGridStyle,
  nowIndicatorStyle,
  segmentStyle,
  selectionStyle,
  slotCountStyle,
  slotGroupStyle,
} from './geometryStyles'
export { default as EventButton } from './EventButton'
export type { EventButtonProps } from './EventButton'
export { default as AgendaEventButton } from './AgendaEventButton'
export { default as DefaultAgendaDate } from './DefaultAgendaDate'
export { default as DefaultAgendaEmpty } from './DefaultAgendaEmpty'
export { default as DefaultAgendaEvent } from './DefaultAgendaEvent'
export { default as DefaultMonthDate } from './DefaultMonthDate'
export { default as DefaultMonthEvent } from './DefaultMonthEvent'
export { default as DefaultMonthShowMore } from './DefaultMonthShowMore'
export { default as DefaultMonthWeekday } from './DefaultMonthWeekday'
export { default as DefaultTimeAllDayEvent } from './DefaultTimeAllDayEvent'
export { default as DefaultTimeDayHeading } from './DefaultTimeDayHeading'
export { default as DefaultTimeEvent } from './DefaultTimeEvent'
export { default as DefaultTimeLabel } from './DefaultTimeLabel'
export { default as DefaultTimeShowMore } from './DefaultTimeShowMore'
export { Popover } from './Popover'
export type { PopoverProps, PopoverTriggerProps } from './Popover'
export { Tooltip } from './Tooltip'
export type { TooltipProps } from './Tooltip'
export { Dialog } from './Dialog'
export type { DialogProps } from './Dialog'
export { useCalendarDnd } from './dnd'
export { useAgendaView } from './useAgendaView'
export type {
  AgendaRowProps,
  AgendaViewComponents,
  UseAgendaViewReturn,
} from './useAgendaView'
export { useMonthView } from './useMonthView'
export type {
  MonthDaySlotProps,
  MonthGridProps,
  MonthRootProps,
  MonthSegmentButtonProps,
  MonthShowMoreCellProps,
  MonthViewComponents,
  UseMonthViewReturn,
} from './useMonthView'
export { useTimeGridHeader } from './useTimeGridHeader'
export type {
  TimeGridAllDayRowProps,
  TimeGridAllDaySegmentProps,
  TimeGridAllDaySlotProps,
  TimeGridHeaderComponents,
  TimeGridResourceAllDayRowProps,
  TimeGridResourceAllDaySlotProps,
  TimeGridStackedSegmentProps,
  UseTimeGridHeaderReturn,
} from './useTimeGridHeader'
export { useTimeGridBody } from './useTimeGridBody'
export type {
  TimeGridBgEventProps,
  TimeGridBodyComponents,
  TimeGridBodyRootProps,
  TimeGridEventButtonProps,
  TimeGridResourceBodyRootProps,
  TimeGridResourceSlotProps,
  TimeGridSlotProps,
  UseTimeGridBodyReturn,
} from './useTimeGridBody'
export { useTimeGridView } from './useTimeGridView'
export type {
  TimeGridRootProps,
  UseTimeGridViewReturn,
} from './useTimeGridView'
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
