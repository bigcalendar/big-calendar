import type { CalendarStore, Messages } from '@big-calendar/core'
import type { CalendarComponents } from '../components.type'

export type { CalendarComponents }

/**
 * Shared calendar state provided by `<CalendarProvider>` and consumed by every
 * descendant that calls {@link useCalendarContext}. Mirrors the React adapter's
 * `CalendarContextValue` (§10-3).
 *
 * - `store` — the reactive store; read signal values via {@link fromSignal}.
 * - `components` — optional per-slot component overrides (§10-5).
 * - `messages` — resolved UI strings (defaults merged with any overrides).
 * - `descriptionIds` — ids of the visually-hidden instruction elements that
 *   slot cells and event buttons reference via `aria-describedby`.
 */
export interface CalendarContextValue<TEvent = unknown, TResource = unknown> {
  store: CalendarStore<TEvent, TResource>
  components: CalendarComponents
  messages: Messages
  descriptionIds: { selection: string; event: string }
}

/** Svelte context key — must be a unique symbol to avoid collisions. */
export const CALENDAR_CONTEXT_KEY = Symbol('CalendarContext')
