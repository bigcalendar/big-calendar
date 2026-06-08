import type { LocalizerContract } from '@big-calendar/localizer'
import type { Accessor, Accessors } from '../accessors/accessors.type'
import type { DayLayoutAlgorithm, DayLayoutAlgorithmKey } from '../layout/layout.type'
import type { SelectableMode, SlotSelectionDates } from '../selection/selection.type'
import type { GetDrilldownView } from '../store/drilldown.function'
import type { ViewRegistry } from '../views/viewRegistry.type'
import type { EventId, ViewKey, VisibleRange } from './calendar.type'

/**
 * Configuration accepted by {@link createCalendarStore}. Only the localizer is
 * required; everything else has a sensible default applied during normalization.
 *
 * Optional fields are typed `?: T | undefined` so framework adapters can pass
 * through possibly-undefined props directly under `exactOptionalPropertyTypes`.
 *
 * Prop-getter callbacks remain an adapter concern and are not part of this
 * (framework-agnostic) config.
 */
export interface CalendarConfig<TEvent = unknown, TResource = unknown> {
  /** Required. All date math flows through this localizer; core never touches `Date`. */
  localizer: LocalizerContract
  /** Foreground events. */
  events?: TEvent[] | undefined
  /** Background events (rendered behind foreground events; not selectable). */
  backgroundEvents?: TEvent[] | undefined
  /** Resource objects for resource-grouped views. */
  resources?: TResource[] | undefined
  /** Initial view. Defaults to `month`. */
  view?: ViewKey | undefined
  /**
   * Custom view registry (the §9 escape hatch). Maps a non-built-in view key to
   * a {@link ViewDefinition} of pure, core-run functions (range / navigate /
   * label / buildModel) so every adapter renders it identically. Keys that
   * collide with a built-in (`month`/`week`/`work_week`/`day`/`agenda`) are
   * ignored — the built-in wins.
   */
  views?: ViewRegistry<TEvent, TResource> | undefined
  /** Initial focus date (RFC 3339/9557). Defaults to `getNow()`. */
  date?: string | undefined
  /** Accessor overrides merged over the v1-parity defaults. */
  accessors?: Partial<Accessors<TEvent, TResource>> | undefined
  /** Source of "now" as a datetime string. Defaults to the current UTC instant. */
  getNow?: (() => string) | undefined
  /** Number of days the agenda view spans per page. Defaults to 30. */
  length?: number | undefined

  // --- time-grid controls (day / week / work_week) ---
  /** Slot size in minutes. Defaults to 30. */
  step?: number | undefined
  /** Slots per labelled group. Defaults to 2. */
  timeslots?: number | undefined
  /**
   * Start of the visible time window as a datetime string; only its
   * time-of-day is used. Defaults to midnight (start of day).
   */
  min?: string | undefined
  /**
   * End of the visible time window as a datetime string; only its time-of-day
   * is used. A midnight (`00:00`) time means end-of-day. Defaults to end of day.
   */
  max?: string | undefined
  /** Day-layout algorithm for overlapping timed events: a built-in key or a custom fn. Defaults to `overlap`. */
  dayLayoutAlgorithm?: DayLayoutAlgorithmKey | DayLayoutAlgorithm | undefined
  /** Max rows in the all-day header before events overflow. Defaults to unlimited. */
  allDayMaxRows?: number | undefined
  /** Max event rows per week in the month grid before events overflow into "+N more". Defaults to unlimited. */
  weekEventLimit?: number | undefined
  /** Render multi-day events in the time columns rather than the all-day header. Defaults to false. */
  showMultiDayTimes?: boolean | undefined
  /** Show every all-day event (ignore `allDayMaxRows`). Defaults to false. */
  showAllEvents?: boolean | undefined
  /** Whether slot selection is enabled (`true`/`false`/`'ignoreEvents'`). Defaults to false. */
  selectable?: SelectableMode | undefined
  /**
   * Touch long-press duration (ms) a finger must be held before a slot selection
   * begins on touch input; a shorter press is a tap, and movement before it
   * elapses is treated as a scroll. Mouse/pen are unaffected. Defaults to 500.
   */
  longPressThreshold?: number | undefined
  /**
   * View a drilldown lands on by default. Defaults to `day`; pass `null` to
   * disable drilldown. Ignored when `getDrilldownView` is supplied.
   */
  drilldownView?: ViewKey | null | undefined
  /** Per-call drilldown resolver; overrides `drilldownView` when supplied. */
  getDrilldownView?: GetDrilldownView | undefined
  /** Fired after the focus date changes via `navigate`. */
  onNavigate?: ((args: { date: string; view: ViewKey }) => void) | undefined
  /** Fired after the view changes via `setView`. */
  onView?: ((args: { view: ViewKey }) => void) | undefined

  // --- event interaction (what a click on an existing event does) ---
  // Separate, focused concern from slot selection below. Core owns the behaviour
  // (selection side-effect + firing the configured callback); adapters are dumb
  // translators that route DOM events to `store.eventHandlers`. Each callback is
  // optional and invoked only when defined — core never fabricates a noop.
  /**
   * Event primary action: fired on click / Enter / Space, after the event is
   * selected (by its accessor id). Receives the full event.
   */
  onEventClick?: ((event: TEvent) => void) | undefined
  /**
   * Event secondary action: fired on double-click / F2. Receives the full event.
   * (There is no keyboard double-click; F2 is the WCAG 2.1.1 parity key.)
   */
  onEventDoubleClick?: ((event: TEvent) => void) | undefined
  /**
   * Event context-menu action: fired on right-click (and the keyboard Menu key /
   * Shift+F10, and touch long-press). Receives the event **and** the native DOM
   * `MouseEvent` — read `clientX`/`clientY` to position a custom menu and call
   * `preventDefault()` to replace the native one. Omit it to leave the browser's
   * native context menu untouched (the adapter wires no `contextmenu` listener).
   */
  onEventRightClick?: ((event: TEvent, domEvent: MouseEvent) => void) | undefined
  /**
   * Event tertiary action: fired on a middle-button ("scroll wheel") click.
   * Receives the event **and** the native DOM `MouseEvent`. Pointer-only — there
   * is no keyboard equivalent. Omit it and the adapter wires no `auxclick` listener.
   */
  onEventMiddleClick?: ((event: TEvent, domEvent: MouseEvent) => void) | undefined
  /** Fired after the selected event changes via `selectEvent`. */
  onEventSelect?: ((args: { id: EventId | null }) => void) | undefined

  // --- event drag-and-drop (move / resize) ---
  // The behaviour (date-math + firing the callback) is core-owned so every
  // adapter computes an identical move; the optional `@big-calendar/dnd` package
  // is the framework-neutral pointer layer that decodes a DOM drop into a target
  // slot/day and calls `store.moveEvent`. The callback fires only when defined.
  /**
   * Whether a given event may be dragged. A string reads a boolean field; a
   * function derives it. Omitted → every event is draggable. Read by the DnD
   * layer to decide which events to make drag sources.
   */
  draggableAccessor?: Accessor<TEvent, boolean> | undefined
  /**
   * Fired when an event is dropped at a new position. Receives the **original**
   * event plus its **proposed** new bounds as ISO date strings (`allDay` flags a
   * whole-day span); core preserves the original duration.
   *
   * This is a *report*, not a mutation: the calendar is controlled and never
   * changes `events` itself. Because accessors are read-only, core can't write
   * the new values back into your event shape — you do, by updating the `events`
   * you pass in. The original `event` is included so a revert is trivial.
   *
   * The move is usually persisted asynchronously and may fail, so the typical
   * pattern is **optimistic update + rollback**: apply the proposed bounds to your
   * state, `await` your save, and on failure restore the previous `events`. The
   * handler may be `async`; the calendar does **not** await it — you own the
   * persist/rollback lifecycle entirely.
   */
  onEventDrop?:
    | ((args: { event: TEvent; start: string; end: string; allDay: boolean }) => void)
    | undefined
  /**
   * Whether a given event may be resized. A string reads a boolean field; a
   * function derives it. Omitted → every event is resizable. Read by the DnD
   * layer to decide which events get resize handles.
   */
  resizableAccessor?: Accessor<TEvent, boolean> | undefined
  /**
   * Fired when an event is resized by dragging one of its edges. Receives the
   * **original** event plus its **proposed** new bounds as ISO date strings; the
   * un-dragged edge is unchanged and the duration is clamped to at least one slot.
   *
   * Like {@link onEventDrop} this is a *report*, not a mutation — the calendar is
   * controlled and never changes `events` itself. Apply the bounds to your own
   * state (optimistic update + rollback on a failed save); the original `event`
   * is included so a revert is trivial. The handler may be `async`; the calendar
   * does **not** await it.
   */
  onEventResize?:
    | ((args: { event: TEvent; start: string; end: string; allDay: boolean }) => void)
    | undefined

  // --- drag/drop across the calendar boundary (5d) ---
  // The drag source is *outside* the calendar (a palette / unscheduled-list item),
  // so the calendar has no event for it yet — a drop here means **create**, not
  // edit. The optional `@big-calendar/dnd` package listens on Pragmatic's element
  // *and* external adapters, so the outside item may be either a Pragmatic
  // `draggable` (full payload during the drag → true-extent live preview) or a
  // plain native `draggable="true"` element (payload only readable on drop → the
  // live preview falls back to a single landing slot). Time-grid only this slice.
  /**
   * Fired when an item dragged from **outside** the calendar is dropped on a
   * time-grid slot. Receives the **proposed** new event bounds as ISO date
   * strings — `start` is the dropped slot, `end` is `start + duration` (the
   * dragged item's `durationMinutes` payload, or one slot when absent). Like
   * {@link onEventDrop} this is a *report*: the calendar never creates the event
   * itself — you add it to your own `events`. Fires only when defined.
   */
  onDropFromOutside?:
    | ((args: { start: string; end: string; allDay: boolean }) => void)
    | undefined
  /**
   * Fired when the user begins dragging an existing event (the body, not a resize
   * handle). Receives the event being dragged. Mirrors v1's `onDragStart`; pair it
   * with a native or Pragmatic drop target of your own to drag events **out** of
   * the calendar (e.g. an "unschedule" bin). The event element also exposes its
   * data to native external drop targets, so a plain HTML5 dropzone can read it.
   */
  onEventDragStart?: ((args: { event: TEvent }) => void) | undefined

  // --- slot selection (picking empty time/days to create an event) ---
  // Distinct from event interaction above. Mirrors the event callbacks' shape:
  // a per-gesture callback rather than one callback + an `action` discriminator.
  /**
   * Fired on every slot-selection range change (drag move / keyboard extend),
   * with the candidate range as ISO date strings (`allDay` flags a whole-day /
   * cross-day span). Return `false` to **veto** the change. The store translates
   * the FSM's slot indices to dates before calling.
   */
  onSlotSelecting?:
    | ((args: { start: string; end: string; allDay: boolean }) => boolean | void)
    | undefined
  /**
   * Fired when a single slot/day is clicked. Receives ISO date strings; see
   * {@link SlotSelectionDates} for the `end` convention.
   */
  onSlotClick?: ((selection: SlotSelectionDates) => void) | undefined
  /**
   * Fired when a single slot/day is double-clicked. Receives ISO date strings.
   */
  onSlotDoubleClick?: ((selection: SlotSelectionDates) => void) | undefined
  /**
   * Fired when a multi-slot range is committed (a pointer drag, or a keyboard
   * Shift+Arrow range). Receives ISO date strings; see {@link SlotSelectionDates}.
   */
  onSlotSelect?: ((selection: SlotSelectionDates) => void) | undefined
  /** Fired when the visible range changes (date or view change), not on init. */
  onRangeChange?: ((args: { range: VisibleRange; view: ViewKey }) => void) | undefined
  /**
   * Fired when a drilldown is requested. When provided, the store delegates
   * entirely to this callback (it will not change view/date itself).
   */
  onDrillDown?: ((args: { date: string; view: ViewKey }) => void) | undefined
}
