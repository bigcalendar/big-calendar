import { createContext } from 'react'
import type { CalendarStore } from '@big-calendar/core'

/**
 * Shared calendar state exposed to every descendant of a {@link CalendarProvider}.
 *
 * Kept intentionally minimal (Appendix A.6): it carries only the store, which is
 * the one genuinely cross-cutting value. `messages` and the resolved `components`
 * override map join this value when their first concrete consumers (Toolbar /
 * overridable Event) land — not before.
 */
export interface CalendarContextValue<TEvent = unknown, TResource = unknown> {
  /** The reactive calendar store: state signals + actions. */
  store: CalendarStore<TEvent, TResource>
}

/**
 * Context that carries the calendar store. It is `null` until a
 * {@link CalendarProvider} supplies a value, so consumers can detect — and
 * reject — use outside of a provider.
 */
export const CalendarContext = createContext<CalendarContextValue | null>(null)
