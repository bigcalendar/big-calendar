import type { LocalizerContract } from '@big-calendar/localizer'
import type { ReadonlySignal, Signal } from '@preact/signals-core'
import type { Accessors } from '../accessors/accessors.type'
import type { EventId, ViewKey, VisibleRange } from '../types/calendar.type'
import type { NavigateDirection } from '../constants/views.constant'
import type {
  SelectableMode,
  SelectionMode,
  SelectionRange,
  SelectionState,
} from '../selection/selection.type'
import type { CalendarViewModel } from '../views/viewModel.type'

/**
 * The store's slot-selection surface: the FSM's live signals (in slot-index
 * space) plus actions the adapter drives. `start`/`click`/`doubleClick` also
 * carry the anchor `date` + `mode` so the store can translate committed indices
 * back to dates for `onSelectSlot`/`onSelecting`. `range` feeds the live
 * `.bc-selection` highlight overlay.
 */
export interface SelectionApi {
  /** Live FSM state (`idle` / `selecting`), in slot-index space. */
  readonly state: ReadonlySignal<SelectionState>
  /** Live normalized range (slot indices) while selecting, else `null`. */
  readonly range: ReadonlySignal<SelectionRange | null>
  /**
   * The active anchor (the day + index space the live selection runs in), or
   * `null` when idle. Lets the adapter place the highlight overlay in the right
   * column/row. Cleared on commit/cancel.
   */
  readonly anchor: ReadonlySignal<{ mode: SelectionMode; date: string } | null>
  /** Begin a drag at the anchor slot; `date`+`mode` set the translation context. */
  start(args: { slot: number; date: string; mode: SelectionMode }): void
  /** Extend the in-progress drag to a new head slot (pointer move / Shift+Arrow). */
  to(args: { slot: number }): void
  /** Commit the in-progress drag (`action: 'select'`). */
  complete(): void
  /** Commit a single-slot click (`action: 'click'`). */
  click(args: { slot: number; date: string; mode: SelectionMode }): void
  /** Commit a single-slot double-click (`action: 'doubleClick'`). */
  doubleClick(args: { slot: number; date: string; mode: SelectionMode }): void
  /** Abort an in-progress drag without committing. */
  cancel(): void
}

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
  /**
   * Slot-selection surface (drag/click/keyboard). Distinct from event selection
   * ({@link CalendarStore.selected}); see {@link SelectionApi}.
   */
  readonly selection: SelectionApi
  /** Foreground events. */
  readonly events: Signal<TEvent[]>
  /** Background events. */
  readonly backgroundEvents: Signal<TEvent[]>
  /** Resource objects (`undefined` when ungrouped). */
  readonly resources: Signal<TResource[] | undefined>

  // --- derived state ---
  /** Visible day-range for the current date + view (recomputes on either change). */
  readonly range: ReadonlySignal<VisibleRange>
  /** Localized toolbar title for the active view + focus date. */
  readonly label: ReadonlySignal<string>
  /**
   * The view model for the active view (month / time-grid / agenda),
   * recomputed from the view, range, events and config. Discriminated by `kind`.
   */
  readonly viewModel: ReadonlySignal<CalendarViewModel<TEvent>>

  // --- resolved config (stable for the store's lifetime) ---
  /** The localizer instance, reused everywhere. */
  readonly localizer: LocalizerContract
  /** Fully-resolved accessor set (defaults merged with overrides). */
  readonly accessors: Accessors<TEvent, TResource>
  /**
   * Resolved "now" source as a datetime string (from `config.getNow`, default
   * the current UTC instant). Adapters use it for today / now-indicator state.
   */
  readonly getNow: () => string
  /**
   * Resolved time-grid slot size in minutes (`config.step`, default 30). Exposed
   * so adapters can rebuild slot metrics — e.g. to place the now-indicator on the
   * same vertical span the model used for event boxes.
   */
  readonly step: number
  /**
   * Resolved slots per labelled group (`config.timeslots`, default 2). Pairs with
   * {@link CalendarStore.step} when an adapter rebuilds slot metrics.
   */
  readonly timeslots: number
  /**
   * Resolved slot-selection mode (`config.selectable`, default `false`). Adapters
   * read it to decide whether to attach selection handlers at all.
   */
  readonly selectable: SelectableMode

  // --- actions (named-parameter objects, per Appendix A) ---
  /** Move the focus date: PREV/NEXT step by view; TODAY resets to now; DATE jumps. */
  navigate(args: { direction: NavigateDirection; date?: string }): void
  /** Switch the active view. */
  setView(args: { view: ViewKey }): void
  /** Set the focus date explicitly (no direction semantics). */
  setDate(args: { date: string }): void
  /** Select an event by id, or clear with `null`. */
  select(args: { id: EventId | null }): void
  /**
   * Drill into a clicked date: resolve the target view (per `drilldownView` /
   * `getDrilldownView`) and either delegate to `onDrillDown` or switch view +
   * focus date. A `null` resolution is a no-op (drilldown disabled).
   */
  drilldown(args: { date: string }): void
  /** Replace the foreground event list. */
  setEvents(args: { events: TEvent[] }): void
  /** Replace the background event list. */
  setBackgroundEvents(args: { events: TEvent[] }): void
  /** Replace the resource list. */
  setResources(args: { resources: TResource[] | undefined }): void
  /** Tear down: dispose any internal subscriptions. Safe to call more than once. */
  destroy(): void
}
