import type { Messages, NavigateDirection, ViewKey } from '@big-calendar/core'
import type { ComponentType } from 'react'

/**
 * The per-slot component override map (§7). Every visual part of the calendar is
 * replaceable: pass a component — or a plain render function, which is the same
 * thing in React — for any slot. A more specific (per-view) slot wins over a
 * shared one at the render site. Generic over the event type so event-shaped
 * slots are typed against the app's event.
 */
export interface CalendarComponents<TEvent = unknown> {
  /** Replaces the navigation toolbar. */
  toolbar?: ComponentType<ToolbarProps>
  /** Month-view slot overrides. */
  month?: MonthComponents<TEvent>
  /** Agenda-view slot overrides. */
  agenda?: AgendaComponents<TEvent>
}

/** Props passed to the toolbar — the default one or a `components.toolbar` override. */
export interface ToolbarProps {
  /** Localized title for the active view + focus date (from `store.label`). */
  label: string
  /** The active view. */
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

/** Month-view slot overrides. */
export interface MonthComponents<TEvent> {
  /** A column heading in the weekday row. */
  weekday?: ComponentType<MonthWeekdayProps>
  /** A single day cell's date header (the number, today / off-range state). */
  dateCell?: ComponentType<MonthDateProps>
  /** One event segment within a week row. */
  event?: ComponentType<MonthEventProps<TEvent>>
  /** The "+N more" overflow indicator for a week. */
  showMore?: ComponentType<MonthShowMoreProps>
}

/** Props for a weekday column heading. */
export interface MonthWeekdayProps {
  /** Day-start string of the representative day for this column. */
  day: string
  /** Full weekday name (e.g. "Monday"). */
  long: string
  /** Abbreviated weekday name (e.g. "Mon"). */
  short: string
}

/** Props for a day cell's date header. */
export interface MonthDateProps {
  /** Day-start string (RFC 3339/9557). */
  day: string
  /** Localized day-of-month number. */
  label: string
  /** Whether the day is the current date. */
  isToday: boolean
  /** Whether the day belongs to an adjacent month. */
  isOffRange: boolean
  /** Drill into this day (resolves the drilldown view). */
  onDrillDown: () => void
}

/** Props for a single month event segment. */
export interface MonthEventProps<TEvent> {
  /** The original event object. */
  event: TEvent
  /** Resolved event title. */
  title: string
}

/** Props for a week's "+N more" overflow indicator. */
export interface MonthShowMoreProps {
  /** How many events overflowed the week's row limit. */
  count: number
  /** Localized overflow label (e.g. "+2 more"). */
  label: string
  /** Day-start string of the week's first day (overflow anchor). */
  day: string
}

/** Agenda-view slot overrides. */
export interface AgendaComponents<TEvent> {
  /** The date label for a day group. */
  date?: ComponentType<AgendaDateProps>
  /** A single event row. */
  event?: ComponentType<AgendaEventProps<TEvent>>
  /** The empty state (no events in range). */
  empty?: ComponentType<AgendaEmptyProps>
}

/** Props for an agenda day's date label. */
export interface AgendaDateProps {
  /** Day-start string (RFC 3339/9557). */
  day: string
  /** Localized date label. */
  label: string
}

/** Props for a single agenda event row. */
export interface AgendaEventProps<TEvent> {
  /** The original event object. */
  event: TEvent
  /** Resolved event title. */
  title: string
  /** Formatted time (or the all-day label). */
  time: string
  /** Whether the event is all-day. */
  allDay: boolean
}

/** Props for the agenda empty state. */
export interface AgendaEmptyProps {
  /** Localized "no events in range" message. */
  message: string
}
