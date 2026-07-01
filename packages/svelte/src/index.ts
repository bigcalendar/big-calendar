export const PACKAGE_NAME = '@big-calendar/svelte'

export { fromSignal } from './internal/fromSignal.svelte'

export { useCalendarStore } from './useCalendarStore'
export type { CalendarProps } from './useCalendarStore'

export { CalendarProvider, useCalendarContext } from './CalendarProvider'
export type { CalendarContextValue } from './CalendarProvider'

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
  TimeBackgroundEventProps,
  TimeComponents,
  TimeDayHeadingProps,
  TimeEventProps,
  TimeLabelProps,
  TimeShowMoreProps,
  ToolbarProps,
} from './components.type'

export { useAgendaRows } from './useAgendaRows'
export type { AgendaRow, AgendaRowEvent } from './useAgendaRows'

export { useMonthWeeks } from './useMonthWeeks'
export type {
  MonthDayCell,
  MonthGrid,
  MonthSegmentCell,
  MonthWeekCell,
  MonthWeekday,
} from './useMonthWeeks'

export { useTimeGrid } from './useTimeGrid'
export type {
  TimeDayGroup,
  TimeDayHeading,
  TimeDayResourceCell,
  TimeGrid,
  TimeGutterLabel,
  TimeAllDayExtra,
  TimeAllDayRow,
  TimeAllDaySegment,
  TimeBackgroundEvent,
  TimeColumn,
  TimePositionedEvent,
  TimeResourceGroup,
} from './useTimeGrid'

export { useAgendaView } from './useAgendaView'
export type { AgendaRowProps, UseAgendaViewReturn } from './useAgendaView'

export { useMonthView } from './useMonthView'
export type {
  MonthDaySlotProps,
  MonthSegmentButtonProps,
  MonthShowMoreCellProps,
  MonthViewComponents,
  UseMonthViewReturn,
} from './useMonthView'

export { useTimeGridHeader } from './useTimeGridHeader'
export type {
  TimeGridAllDaySegmentProps,
  TimeGridAllDaySlotProps,
  TimeGridHeaderComponents,
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
export type { UseTimeGridViewReturn } from './useTimeGridView'

export { default as EventButton } from './EventButton/EventButton.svelte'
export { default as AgendaEventButton } from './AgendaEventButton/AgendaEventButton.svelte'

export { default as Calendar } from './Calendar/Calendar.svelte'
export { default as Toolbar } from './Toolbar/Toolbar.svelte'
export { default as DefaultToolbar } from './DefaultToolbar/DefaultToolbar.svelte'
export { useToolbarProps } from './useToolbarProps'
export { useCalendarDnd } from './useCalendarDnd'

export { default as Popover } from './Popover/Popover.svelte'
export { default as Tooltip } from './Tooltip/Tooltip.svelte'
export { default as Dialog } from './Dialog/Dialog.svelte'

export { default as AgendaView } from './AgendaView/AgendaView.svelte'
export { default as MonthView } from './MonthView/MonthView.svelte'
export { default as TimeGridView } from './TimeGridView/TimeGridView.svelte'

export { default as DefaultAgendaDate } from './DefaultAgendaDate/DefaultAgendaDate.svelte'
export { default as DefaultAgendaEmpty } from './DefaultAgendaEmpty/DefaultAgendaEmpty.svelte'
export { default as DefaultAgendaEvent } from './DefaultAgendaEvent/DefaultAgendaEvent.svelte'
export { default as DefaultMonthDate } from './DefaultMonthDate/DefaultMonthDate.svelte'
export { default as DefaultMonthEvent } from './DefaultMonthEvent/DefaultMonthEvent.svelte'
export { default as DefaultMonthShowMore } from './DefaultMonthShowMore/DefaultMonthShowMore.svelte'
export { default as DefaultMonthWeekday } from './DefaultMonthWeekday/DefaultMonthWeekday.svelte'
export { default as DefaultBackgroundEvent } from './DefaultBackgroundEvent/DefaultBackgroundEvent.svelte'
export { default as DefaultTimeAllDayEvent } from './DefaultTimeAllDayEvent/DefaultTimeAllDayEvent.svelte'
export { default as DefaultTimeDayHeading } from './DefaultTimeDayHeading/DefaultTimeDayHeading.svelte'
export { default as DefaultTimeEvent } from './DefaultTimeEvent/DefaultTimeEvent.svelte'
export { default as DefaultTimeLabel } from './DefaultTimeLabel/DefaultTimeLabel.svelte'
export { default as DefaultTimeShowMore } from './DefaultTimeShowMore/DefaultTimeShowMore.svelte'
