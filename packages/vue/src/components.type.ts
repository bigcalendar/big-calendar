import type { Messages, NavigateDirection, ViewKey } from '@big-calendar/core'
import type { Component } from 'vue'

/**
 * One overflowed event passed to a show-more slot.
 */
export interface ShowMoreEvent<TEvent> {
  key: string
  event: TEvent
  title: string
}

/** Props for a weekday column heading. */
export interface MonthWeekdayProps {
  day: string
  long: string
  short: string
}

/** Props for a day cell's date header. */
export interface MonthDateProps {
  day: string
  label: string
  isToday: boolean
  isOffRange: boolean
  onDrillDown: () => void
}

/** Props for a single month event segment. */
export interface MonthEventProps<TEvent> {
  event: TEvent
  title: string
}

/** Props for a week's "+N more" overflow indicator. */
export interface MonthShowMoreProps<TEvent> {
  count: number
  label: string
  day: string
  events: ReadonlyArray<ShowMoreEvent<TEvent>>
  EventSlot: Component
}

/** Month-view slot overrides. */
export interface MonthComponents {
  weekday?: Component
  dateCell?: Component
  event?: Component
  showMore?: Component
}

/** Props for a day column heading. */
export interface TimeDayHeadingProps {
  day: string
  label: string
  isToday: boolean
  onDrillDown: () => void
}

/** Props for a gutter time label. */
export interface TimeLabelProps {
  time: string
  label: string
}

/** Props for a timed event box. */
export interface TimeEventProps<TEvent> {
  event: TEvent
  title: string
  time: string
}

/** Props for a background event box (time-grid only). */
export interface TimeBackgroundEventProps<TEvent> {
  event: TEvent
  title: string
}

/** Props for an all-day event segment. */
export interface TimeAllDayEventProps<TEvent> {
  event: TEvent
  title: string
}

/** Props for the all-day row's "+N more" overflow indicator. */
export interface TimeShowMoreProps<TEvent> {
  count: number
  label: string
  events: ReadonlyArray<ShowMoreEvent<TEvent>>
  EventSlot: Component
}

/** Time-grid slot overrides. */
export interface TimeComponents {
  dayHeading?: Component
  timeLabel?: Component
  event?: Component
  allDayEvent?: Component
  showMore?: Component
  backgroundEvent?: Component
}

/** Props for an agenda day's date label. */
export interface AgendaDateProps {
  day: string
  label: string
}

/** Props for a single agenda event row. */
export interface AgendaEventProps<TEvent> {
  event: TEvent
  title: string
  time: string
  allDay: boolean
}

/** Props for the agenda empty state. */
export interface AgendaEmptyProps {
  message: string
}

/** Agenda-view slot overrides. */
export interface AgendaComponents {
  date?: Component
  event?: Component
  empty?: Component
}

/** Props passed to the toolbar — the default one or a `components.toolbar` override. */
export interface ToolbarProps {
  /** Localized title for the active view + focus date. */
  label: string
  /** The active view key. */
  view: ViewKey
  /** Views offered by the switcher. */
  views: ViewKey[]
  /** Resolved UI strings. */
  messages: Messages
  /** Move the focus date (PREV / NEXT / TODAY). */
  onNavigate: (direction: NavigateDirection) => void
  /** Switch the active view. */
  onView: (view: ViewKey) => void
}

/**
 * Props passed to a custom view component registered via `components.views`.
 * Cast `model` to the type your `defineView` produces.
 */
export interface CustomViewProps {
  /** The active custom view key. */
  view: ViewKey
  /** The model the core view definition built. */
  model: unknown
}

/**
 * Per-slot component override map. Every visual part of the calendar is
 * replaceable by passing a Vue component for any slot.
 */
export interface CalendarComponents {
  /** Replaces the navigation toolbar. */
  toolbar?: Component
  /**
   * Custom view components keyed by view key. When the active view matches a
   * key, that component renders inside `.bc-calendar` with `{ view, model }` props.
   */
  views?: Record<string, Component>
  month?: MonthComponents
  time?: TimeComponents
  agenda?: AgendaComponents
}
