import { createContext } from 'react'
import type { CalendarStore, Messages } from '@big-calendar/core'
import type { CalendarComponents } from '../components.type'

/**
 * Shared calendar state exposed to every descendant of a {@link CalendarProvider}:
 * the reactive store, the (partial) component override map, and the resolved UI
 * strings. These three are genuinely cross-cutting — many components read them —
 * so they live in context (Appendix A.6). Slot defaults are resolved at each
 * render site (a slot falls back to its built-in default locally), which keeps
 * the provider from importing every default component.
 */
export interface CalendarContextValue<TEvent = unknown, TResource = unknown> {
  /** The reactive calendar store: state signals + actions. */
  store: CalendarStore<TEvent, TResource>
  /** Component overrides as supplied to the provider (empty when none). */
  components: CalendarComponents<TEvent>
  /** Fully-resolved UI strings (defaults merged with any overrides). */
  messages: Messages
  /**
   * Event primary action (click / Enter / Space). Stable identity (always
   * defined; a noop when the app passes none). Receives the full event.
   */
  onEventClick: (event: TEvent) => void
  /**
   * Event secondary action (double-click / F2). Stable identity (always defined;
   * a noop when the app passes none). Receives the full event.
   */
  onEventDoubleClick: (event: TEvent) => void
  /**
   * Ids of the visually-hidden instruction elements the provider renders, so
   * slot cells and event buttons can point `aria-describedby` at the same shared
   * text. `selection` describes the slot-grid keyboard model; `event` the event
   * buttons. (See {@link Messages.selectionInstructions} / `eventInstructions`.)
   */
  descriptionIds: { selection: string; event: string }
}

/**
 * Context that carries the calendar store. It is `null` until a
 * {@link CalendarProvider} supplies a value, so consumers can detect — and
 * reject — use outside of a provider.
 */
export const CalendarContext = createContext<CalendarContextValue | null>(null)
