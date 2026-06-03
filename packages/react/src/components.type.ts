import type { Messages, NavigateDirection, ViewKey } from '@big-calendar/core'
import type { ComponentType } from 'react'

/**
 * The per-slot component override map (§7). Every visual part of the calendar is
 * replaceable: pass a component — or a plain render function, which is the same
 * thing in React — for any slot. Grows as the view components land (event,
 * `month.*`, `timeGrid.*`, `agenda.*`); a more specific slot wins over a shared
 * one at the render site.
 *
 * Becomes generic over the event/resource types once event-shaped slots land
 * (so a custom event renderer is typed against the app's event).
 */
export interface CalendarComponents {
  /** Replaces the navigation toolbar. */
  toolbar?: ComponentType<ToolbarProps>
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
