export const PACKAGE_NAME = '@big-calendar/vue'

export { useSignalRef } from './internal/useSignalRef'

export { useCalendarStore } from './useCalendarStore'
export type { CalendarProps } from './useCalendarStore'

export { CalendarProvider, CalendarKey, useCalendarContext } from './CalendarProvider'
export type {
  CalendarProviderProps,
  CalendarComponents,
  CalendarContextValue,
} from './CalendarProvider'

export type {
  AgendaComponents,
  AgendaDateProps,
  AgendaEmptyProps,
  AgendaEventProps,
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
export type { AgendaHeadingCellProps, AgendaRowProps, UseAgendaViewReturn } from './useAgendaView'

export { useMonthView } from './useMonthView'
export type {
  MonthAnnouncerProps,
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
  TimeGridAllDayLabelProps,
  TimeGridAllDayRowProps,
  TimeGridAllDaySegmentProps,
  TimeGridAllDaySlotsProps,
  TimeGridAllDaySegmentsProps,
  TimeGridAllDaySlotProps,
  TimeGridHeaderComponents,
  TimeGridResourceAllDayRowProps,
  TimeGridResourceAllDaySlotProps,
  TimeGridResourceHeaderLabelProps,
  TimeGridStackedSegmentProps,
  TimeGridTimeHeadProps,
  TimeGridTimeHeaderGutterProps,
  TimeGridTimeHeaderProps,
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
  TimeGridAnnouncerProps,
  TimeGridRootProps,
  UseTimeGridViewReturn,
} from './useTimeGridView'

export { default as EventButton } from './EventButton/EventButton.vue'
export { default as AgendaEventButton } from './AgendaEventButton/AgendaEventButton.vue'

export { default as Calendar } from './Calendar/Calendar.vue'
export { default as Toolbar } from './Toolbar/Toolbar.vue'
export { default as DefaultToolbar } from './DefaultToolbar/DefaultToolbar.vue'
export { useToolbarProps } from './useToolbarProps/useToolbarProps'
export { useCalendarDnd } from './useCalendarDnd'

export { default as Popover } from './Popover/Popover.vue'
export { default as Tooltip } from './Tooltip/Tooltip.vue'
export { default as Dialog } from './Dialog/Dialog.vue'

export { default as AgendaView } from './AgendaView/AgendaView.vue'
export { default as MonthView } from './MonthView/MonthView.vue'
export { default as TimeGridView } from './TimeGridView/TimeGridView.vue'

export { default as DefaultAgendaDate } from './DefaultAgendaDate/DefaultAgendaDate.vue'
export { default as DefaultAgendaEmpty } from './DefaultAgendaEmpty/DefaultAgendaEmpty.vue'
export { default as DefaultAgendaEvent } from './DefaultAgendaEvent/DefaultAgendaEvent.vue'
export { default as DefaultMonthDate } from './DefaultMonthDate/DefaultMonthDate.vue'
export { default as DefaultMonthEvent } from './DefaultMonthEvent/DefaultMonthEvent.vue'
export { default as DefaultMonthShowMore } from './DefaultMonthShowMore/DefaultMonthShowMore.vue'
export { default as DefaultMonthWeekday } from './DefaultMonthWeekday/DefaultMonthWeekday.vue'
export { default as DefaultBackgroundEvent } from './DefaultBackgroundEvent/DefaultBackgroundEvent.vue'
export { default as DefaultTimeAllDayEvent } from './DefaultTimeAllDayEvent/DefaultTimeAllDayEvent.vue'
export { default as DefaultTimeDayHeading } from './DefaultTimeDayHeading/DefaultTimeDayHeading.vue'
export { default as DefaultTimeEvent } from './DefaultTimeEvent/DefaultTimeEvent.vue'
export { default as DefaultTimeLabel } from './DefaultTimeLabel/DefaultTimeLabel.vue'
export { default as DefaultTimeShowMore } from './DefaultTimeShowMore/DefaultTimeShowMore.vue'
