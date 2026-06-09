import type { LocalizerContract } from '@big-calendar/localizer'
import type { ReadonlySignal, Signal } from '@preact/signals-core'
import type { Accessors } from '../accessors/accessors.type'
import type { EventId, ResourceId, ViewKey, VisibleRange } from '../types/calendar.type'
import type { NavigateDirection } from '../constants/views.constant'
import type {
  SelectableMode,
  SelectionMode,
  SelectionRange,
  SelectionState,
} from '../selection/selection.type'
import type { CalendarViewModel } from '../views/viewModel.type'
import type { MoveMode } from '../dnd/moveEvent.function'
import type { ResizeEdge } from '../dnd/resizeEvent.function'

/**
 * The store's slot-selection surface: the FSM's live signals (in slot-index
 * space) plus actions the adapter drives. `start`/`click`/`doubleClick` also
 * carry the anchor `date` + `mode` so the store can translate committed indices
 * back to dates for `onSlotClick`/`onSlotDoubleClick`/`onSlotSelect`/
 * `onSlotSelecting`. `range` feeds the live `.bc-selection` highlight overlay.
 */
export interface SelectionApi {
  /** Live FSM state (`idle` / `selecting`), in slot-index space. */
  readonly state: ReadonlySignal<SelectionState>
  /** Live normalized range (slot indices) while selecting, else `null`. */
  readonly range: ReadonlySignal<SelectionRange | null>
  /**
   * The active anchor (the day + index space the live selection runs in), or
   * `null` when idle. Lets the adapter place the highlight overlay in the right
   * column/row. Cleared on commit/cancel. `slotCount` (time mode only) is the
   * number of slot rows per day column, so the store can decode a global
   * `dayIndex*slotCount + slot` index back into a day + slot (cross-day spans).
   */
  readonly anchor: ReadonlySignal<{
    mode: SelectionMode
    date: string
    slotCount?: number | undefined
    resourceId?: ResourceId | undefined
  } | null>
  /**
   * Begin a drag at the anchor slot; `date`+`mode` set the translation context.
   * For `'time'` mode the slot index is **global** (`dayIndex*slotCount + slot`)
   * and `slotCount` must be supplied so the store can decode cross-day spans.
   * `resourceId` (resource grids) scopes the committed selection to a resource.
   */
  start(args: {
    slot: number
    date: string
    mode: SelectionMode
    slotCount?: number | undefined
    resourceId?: ResourceId | undefined
  }): void
  /** Extend the in-progress drag to a new head slot (pointer move / Shift+Arrow). */
  to(args: { slot: number }): void
  /** Commit the in-progress drag (`action: 'select'`). */
  complete(): void
  /** Commit a single-slot click (`action: 'click'`). */
  click(args: {
    slot: number
    date: string
    mode: SelectionMode
    slotCount?: number | undefined
    resourceId?: ResourceId | undefined
  }): void
  /** Commit a single-slot double-click (`action: 'doubleClick'`). */
  doubleClick(args: {
    slot: number
    date: string
    mode: SelectionMode
    slotCount?: number | undefined
    resourceId?: ResourceId | undefined
  }): void
  /** Abort an in-progress drag without committing. */
  cancel(): void
}

/**
 * The store's **event-interaction** surface: behaviour for clicking an existing
 * event, owned by core so every adapter behaves identically. Adapters are dumb
 * translators — they route DOM events to these methods and read the presence
 * flags to decide what to render / wire. Distinct from **slot** selection
 * ({@link SelectionApi}) and from the event-**selection** action
 * ({@link CalendarStore.selectEvent}); see {@link SelectionApi}.
 *
 * Each method fires its configured callback only when defined — core never
 * fabricates a noop. Selection is *not* folded into `click`: grid views compose
 * `selectEvent` + `click`, while the agenda (no selection) calls `click` alone.
 */
export interface EventHandlerApi<TEvent> {
  /**
   * Whether **any** event-interaction callback is configured. The agenda reads
   * it to render its event title as a real `<button>` only when a press will do
   * something — otherwise a plain, non-interactive `<span>`. Resolved at store
   * creation (handlers are config, fixed for the store's lifetime).
   */
  readonly has: boolean
  /** Whether a right-click handler is configured (adapter attaches `contextmenu` only then). */
  readonly hasRightClick: boolean
  /** Whether a middle-click handler is configured (adapter attaches `auxclick` only then). */
  readonly hasMiddleClick: boolean
  /** Primary action: fire `onEventClick` (selection is composed separately via `selectEvent`). */
  click(event: TEvent): void
  /** Secondary action: fire `onEventDoubleClick`. */
  doubleClick(event: TEvent): void
  /** Context-menu action: fire `onEventRightClick` with the native DOM event. */
  rightClick(event: TEvent, domEvent: MouseEvent): void
  /** Tertiary (middle-button) action: fire `onEventMiddleClick` with the native DOM event. */
  middleClick(event: TEvent, domEvent: MouseEvent): void
}

/**
 * The live state of a **keyboard** drag ("grab"): the grabbed event id plus the
 * proposed bounds as the user steps it with the arrow keys, or `null` when no
 * grab is in progress. The view reads it to mark the grabbed event and the
 * adapter reads the bounds to announce each step; the proposed-extent box itself
 * is rendered from {@link CalendarStore.dragPreview} (set in lockstep). Dates are
 * ISO strings.
 */
export interface KeyboardDragState {
  id: EventId
  start: string
  end: string
  allDay: boolean
}

/**
 * An event serialized for a **drag-out** transfer. The DnD layer writes it onto
 * the native drag's `dataTransfer` (as JSON + a `text/plain` title) so a drop
 * target *outside* the calendar can identify the dragged event. Dates are ISO
 * strings; `id` is stringified.
 */
export interface EventTransfer {
  id: string
  title: string
  start: string
  end: string
  allDay: boolean
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
  /**
   * Event-interaction surface (click / double / right / middle). Core-owned
   * behaviour the adapters route DOM events to; see {@link EventHandlerApi}.
   */
  readonly eventHandlers: EventHandlerApi<TEvent>
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
  /**
   * Live drag-preview bounds, or `null` when no drag is in flight. Set by
   * `previewResize` while a resize drag moves over slots and cleared on
   * drop/commit; the time grid renders the proposed extent from it. Purely visual
   * — no callback fires until the drop is committed via `resizeEvent`.
   */
  readonly dragPreview: ReadonlySignal<{ start: string; end: string } | null>
  /**
   * Live keyboard-drag ("grab") state, or `null` when no grab is in progress. Set
   * by {@link CalendarStore.grabEvent} and updated by `grabMove`/`grabResize`;
   * cleared on `grabCommit`/`grabCancel`. The adapter reads it to mark the grabbed
   * event and to announce each step via a live region.
   */
  readonly keyboardDrag: ReadonlySignal<KeyboardDragState | null>

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
  /**
   * Resolved touch long-press duration in ms (`config.longPressThreshold`,
   * default `500`). Adapters read it to time the hold that starts a touch
   * selection; mouse/pen selection is immediate and ignores it.
   */
  readonly longPressThreshold: number
  /**
   * Whether a given event may be dragged (`config.draggableAccessor`, default
   * `() => true`). The DnD layer reads it to decide which events become drag
   * sources, so the predicate stays defined once in core.
   */
  readonly isDraggable: (event: TEvent) => boolean
  /**
   * Whether a given event may be resized (`config.resizableAccessor`, default
   * `() => true`). The DnD layer reads it to decide which events get resize
   * handles, so the predicate stays defined once in core.
   */
  readonly isResizable: (event: TEvent) => boolean

  // --- actions (named-parameter objects, per Appendix A) ---
  /** Move the focus date: PREV/NEXT step by view; TODAY resets to now; DATE jumps. */
  navigate(args: { direction: NavigateDirection; date?: string }): void
  /** Switch the active view. */
  setView(args: { view: ViewKey }): void
  /** Set the focus date explicitly (no direction semantics). */
  setDate(args: { date: string }): void
  /** Select an event by id, or clear with `null`. Fires `onEventSelect`. */
  selectEvent(args: { id: EventId | null }): void
  /**
   * Look up a foreground event by its accessor id (string-compared). Returns
   * `undefined` when none matches. Used by adapters (e.g. the DnD layer) that
   * only hold an event's id from the DOM and need the object back.
   */
  getEvent(args: { id: EventId }): TEvent | undefined
  /**
   * Move (drop) an event to a new position. Looks the event up by id, recomputes
   * its bounds via {@link moveEvent} (`mode` decides snap-to-instant vs whole-day
   * shift; duration preserved), and fires `onEventDrop` with the new ISO bounds.
   * A no-op when the id matches no event or no `onEventDrop` is configured. The
   * store does not mutate `events` — apply the change to your own data.
   */
  moveEvent(args: {
    id: EventId
    target: string
    mode: MoveMode
    resourceId?: ResourceId | undefined
    /** When `true`, force `allDay: true` on the drop result (timed→all-day promotion). */
    promote?: boolean | undefined
  }): void
  /**
   * Update the live move preview ({@link CalendarStore.dragPreview}) to the bounds
   * a move would produce, without firing `onEventDrop`. Called by the DnD layer as
   * a dragged event moves over slots/cells — the time grid renders the proposed
   * extent as a dashed box, the month grid as a highlighted day-cell band. A
   * no-op-to-`null` when the id matches no event.
   */
  previewMove(args: { id: EventId; target: string; mode: MoveMode }): void
  /**
   * Resize an event by dragging one edge. Looks the event up by id, recomputes
   * its bounds via {@link resizeEvent} (`edge` picks which end snaps to the
   * dropped `target`; `mode` decides slot-snap vs whole-day snap; duration clamped
   * to one slot / one day), and fires `onEventResize` with the new ISO bounds. A
   * no-op when the id matches no event or no `onEventResize` is configured. `mode`
   * defaults to `'time'`. The store does not mutate `events`.
   */
  resizeEvent(args: {
    id: EventId
    edge: ResizeEdge
    target: string
    mode?: MoveMode | undefined
    resourceId?: ResourceId | undefined
  }): void
  /**
   * Update the live resize preview ({@link CalendarStore.dragPreview}) to the
   * bounds a resize would produce, without firing `onEventResize`. Called by the
   * DnD layer as the dragged edge moves over slots/cells. `mode` defaults to
   * `'time'`. A no-op-to-`null` when the id matches no event.
   */
  previewResize(args: { id: EventId; edge: ResizeEdge; target: string; mode?: MoveMode | undefined }): void
  /** Clear the live drag preview (drag ended outside a slot, or was cancelled). */
  clearDragPreview(): void
  /**
   * Drop an item dragged from **outside** the calendar onto a slot (`'time'`) or
   * day cell (`'day'`). Recomputes the new event's bounds via
   * {@link placeExternalEvent} (in `'time'` mode `target` is the dropped slot and
   * `durationMinutes`/`start`/`end` drive the length; in `'day'` mode a drop with
   * no `start`/`end` becomes a whole-day event on the dropped day, while a drop
   * with a `start`/`end` template keeps its time-of-day and moves its date to the
   * dropped day) and fires `onDropFromOutside`. Clears the live preview. `mode`
   * defaults to `'time'`. A no-op when no `onDropFromOutside` is configured. The
   * store does not add the event — you do.
   */
  dropExternal(args: {
    target: string
    mode?: MoveMode | undefined
    durationMinutes?: number | undefined
    allDay?: boolean | undefined
    start?: string | undefined
    end?: string | undefined
    resourceId?: ResourceId | undefined
  }): void
  /**
   * Update the live preview ({@link CalendarStore.dragPreview}) to where an
   * outside item would land, without firing `onDropFromOutside`. Called by the DnD
   * layer as the outside drag moves over slots/cells. `mode` defaults to `'time'`.
   * With no `durationMinutes`/`start`/`end` (a native drag, whose payload is
   * unreadable mid-drag) it previews a single slot (`'time'`) or the dropped day
   * (`'day'`).
   */
  previewExternal(args: {
    target: string
    mode?: MoveMode | undefined
    durationMinutes?: number | undefined
    start?: string | undefined
    end?: string | undefined
  }): void
  /**
   * Serialize an event for a **drag-out** transfer: the DnD layer writes this onto
   * the native drag's `dataTransfer` so a plain HTML5 drop target outside the
   * calendar can read it. Returns `null` when the id matches no event.
   */
  getEventTransfer(args: { id: EventId }): EventTransfer | null
  /**
   * Fire `onEventDragStart` for the event whose drag just began (body drags only;
   * resize handles don't report). A no-op when the id matches no event or no
   * `onEventDragStart` is configured.
   */
  eventDragStart(args: { id: EventId }): void

  // --- keyboard drag ("grab"): an accessible, pointer-free move/resize ---
  // A modal grab the adapter drives from key events on a focused event: pick up
  // (grabEvent) → step (grabMove / grabResize) → drop (grabCommit) or abort
  // (grabCancel). Core owns the bounds math + clamping and fires the same
  // `onEventDrop` / `onEventResize` callbacks as a pointer drag, so a keyboard
  // reposition is reported identically. Time-grid events only this slice.
  /**
   * Pick up an event for a keyboard drag. Looks it up by id and seeds the grab
   * from its current bounds (also priming {@link CalendarStore.dragPreview}).
   * Returns `true` when a grab started, `false` when the id matches no event or it
   * has no bounds. No callback fires yet.
   */
  grabEvent(args: { id: EventId }): boolean
  /**
   * Step a grabbed event by whole `days` and/or `minutes`, shifting both ends
   * (duration preserved) and updating the preview. A no-op when nothing is
   * grabbed. Negative values step earlier / to previous days.
   */
  grabMove(args: { days?: number | undefined; minutes?: number | undefined }): void
  /**
   * Resize a grabbed event's **end** edge and update the preview, by `minutes`
   * (time grid, clamped to a one-slot minimum) and/or whole `days` (month, clamped
   * to a one-day minimum). A no-op when nothing is grabbed. Negative values shrink.
   */
  grabResize(args: { minutes?: number | undefined; days?: number | undefined }): void
  /**
   * Drop a grabbed event: fire `onEventDrop` (if it moved) or `onEventResize` (if
   * it only resized) with the proposed bounds, then clear the grab + preview. A
   * no-op when nothing is grabbed or the relevant callback is unconfigured. The
   * store never mutates `events`.
   */
  grabCommit(): void
  /** Abort a keyboard grab without committing; clears the grab + preview. */
  grabCancel(): void
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
