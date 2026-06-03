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
