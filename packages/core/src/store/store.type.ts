import type { LocalizerContract } from '@big-calendar/localizer'
import type { Signal } from '@preact/signals-core'
import type { Accessors } from '../accessors/accessors.type'
import type { EventId, ViewKey } from '../types/calendar.type'
import type { NavigateDirection } from '../constants/views.constant'

/**
 * An isolated calendar store: reactive state signals plus the actions that
 * mutate them. Created by {@link createCalendarStore}; there are no global
 * singletons, so multiple calendars on one page stay independent.
 */
export interface CalendarStore<TEvent = unknown, TResource = unknown> {
  // --- reactive state (signals) ---
  /** Current focus date (RFC 3339/9557). */
  readonly date: Signal<string>
  /** Current view. */
  readonly view: Signal<ViewKey>
  /** Currently selected event id, or `null`. */
  readonly selected: Signal<EventId | null>
  /** Foreground events. */
  readonly events: Signal<TEvent[]>
  /** Background events. */
  readonly backgroundEvents: Signal<TEvent[]>
  /** Resource objects (`undefined` when ungrouped). */
  readonly resources: Signal<TResource[] | undefined>

  // --- resolved config (stable for the store's lifetime) ---
  /** The localizer instance, reused everywhere. */
  readonly localizer: LocalizerContract
  /** Fully-resolved accessor set (defaults merged with overrides). */
  readonly accessors: Accessors<TEvent, TResource>

  // --- actions (named-parameter objects, per Appendix A) ---
  /** Move the focus date: PREV/NEXT step by view; TODAY resets to now; DATE jumps. */
  navigate(args: { direction: NavigateDirection; date?: string }): void
  /** Switch the active view. */
  setView(args: { view: ViewKey }): void
  /** Set the focus date explicitly (no direction semantics). */
  setDate(args: { date: string }): void
  /** Select an event by id, or clear with `null`. */
  select(args: { id: EventId | null }): void
  /** Replace the foreground event list. */
  setEvents(args: { events: TEvent[] }): void
  /** Replace the background event list. */
  setBackgroundEvents(args: { events: TEvent[] }): void
  /** Replace the resource list. */
  setResources(args: { resources: TResource[] | undefined }): void
  /** Tear down: dispose any internal subscriptions. Safe to call more than once. */
  destroy(): void
}
