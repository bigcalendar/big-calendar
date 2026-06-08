import {
  draggable,
  dropTargetForElements,
  monitorForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import {
  dropTargetForExternal,
  monitorForExternal,
} from '@atlaskit/pragmatic-drag-and-drop/external/adapter'
import type { EventId, EventTransfer, MoveMode, ResizeEdge } from '@big-calendar/core'

/**
 * The slice of a calendar store the DnD layer needs. Narrowed (rather than the
 * full `CalendarStore`) so it accepts any `CalendarStore<TEvent, TResource>`
 * without `TResource` variance, and keeps the package's coupling to core minimal.
 */
export interface DndStore<TEvent> {
  /** Resolve an event by its accessor id (the value read from `data-bc-event`). */
  getEvent(args: { id: EventId }): TEvent | undefined
  /** Whether the event may be dragged (`config.draggableAccessor`). */
  isDraggable(event: TEvent): boolean
  /** Whether the event may be resized (`config.resizableAccessor`). */
  isResizable(event: TEvent): boolean
  /** Commit a move drop: core recomputes the bounds and fires `onEventDrop`. */
  moveEvent(args: { id: EventId; target: string; mode: MoveMode }): void
  /** Commit a resize drop: core recomputes the bounds and fires `onEventResize`. */
  resizeEvent(args: { id: EventId; edge: ResizeEdge; target: string }): void
  /** Update the live resize preview as the dragged edge moves over slots. */
  previewResize(args: { id: EventId; edge: ResizeEdge; target: string }): void
  /** Clear the live resize preview (drag left every slot, or ended). */
  clearDragPreview(): void
  /** Commit a drop from outside the calendar: core fires `onDropFromOutside`. */
  dropExternal(args: { target: string; durationMinutes?: number | undefined; allDay?: boolean | undefined }): void
  /** Update the live preview as an outside item moves over slots (single slot if no duration). */
  previewExternal(args: { target: string; durationMinutes?: number | undefined }): void
  /** Serialize an event for a native drag-out transfer, or `null` if unknown. */
  getEventTransfer(args: { id: EventId }): EventTransfer | null
  /** Report that an event drag began (fires `onEventDragStart`). */
  eventDragStart(args: { id: EventId }): void
}

/**
 * The payload shape an outside drag source carries to describe the item being
 * dropped onto the calendar. Both transports use it:
 *
 * - a **Pragmatic** `draggable` palette item sets it as element data under the
 *   {@link EXTERNAL_DATA_KEY} key (fully readable during the drag → true-extent
 *   live preview);
 * - a **native** `draggable="true"` element sets it as a JSON string on the
 *   {@link EXTERNAL_MIME} `dataTransfer` type (readable only on drop → the live
 *   preview falls back to a single landing slot).
 */
export interface ExternalDragPayload {
  /** The item's length in minutes; omitted → a one-slot event. */
  durationMinutes?: number | undefined
  /** Whether the dropped item should become a whole-day event. */
  allDay?: boolean | undefined
}

/**
 * Attribute the React (or any) adapter already stamps on an event element so it
 * becomes a drag source. The value is the event's accessor id.
 */
const EVENT_ATTR = 'data-bc-event'
/**
 * Attribute on a resize handle inside an event element. Its value is the dragged
 * {@link ResizeEdge} (`'start'` / `'end'`); the event id is read from the handle's
 * nearest `[data-bc-event]` ancestor. Present only on the time-grid views today.
 */
const RESIZE_ATTR = 'data-bc-resize'
/**
 * Drop-target attribute carrying the move target, by {@link MoveMode}:
 *
 * - `'day'` reads `data-date` — the day cell's ISO day (month grid + all-day
 *   row), the same attribute the grid uses for slot selection; core shifts the
 *   event by whole days.
 * - `'time'` reads `data-bc-instant` — the time-grid slot's start instant; core
 *   snaps the event's start to it and keeps its duration.
 *
 * In `'time'` mode the all-day cells (which carry only `data-date`) are not drop
 * targets — timed↔all-day promotion is a later slice.
 */
const DROP_ATTR: Record<MoveMode, string> = {
  day: 'data-date',
  time: 'data-bc-instant',
}

/**
 * Element-adapter data key a **Pragmatic** `draggable` palette item sets to mark
 * itself an outside item and carry its {@link ExternalDragPayload}. The value is
 * readable throughout the drag, so the live preview can show the true extent.
 */
export const EXTERNAL_DATA_KEY = 'bcExternal'
/**
 * Native `dataTransfer` media type a plain `draggable="true"` element sets (to a
 * JSON-stringified {@link ExternalDragPayload}) to drop onto the calendar. The
 * value is readable only on drop, so the live preview falls back to one slot.
 * Exported so an app's native palette item can set the matching type.
 */
export const EXTERNAL_MIME = 'application/x-bigcal-external'
/**
 * Native `dataTransfer` media type the calendar writes when an event is dragged
 * **out** (a JSON-stringified {@link EventTransfer}), so a plain HTML5 drop target
 * outside the calendar can identify the event. Exported so an app's native
 * dropzone can read the matching type.
 */
export const EVENT_MIME = 'application/x-bigcal-event'

/** Parse a native external drop's JSON payload, tolerating malformed data. */
function parseExternalPayload(raw: string | null): ExternalDragPayload | null {
  if (raw == null) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    if (parsed == null || typeof parsed !== 'object') return {}
    const { durationMinutes, allDay } = parsed as Record<string, unknown>
    return {
      durationMinutes: typeof durationMinutes === 'number' ? durationMinutes : undefined,
      allDay: allDay === true,
    }
  } catch {
    return null
  }
}

/** Options for {@link bindCalendarDnd}. */
export interface BindCalendarDndOptions<TEvent> {
  /** The calendar root to scan for drag sources / drop targets. */
  root: HTMLElement
  /** The store whose `moveEvent` action receives the committed drop. */
  store: DndStore<TEvent>
  /**
   * Which drop attribute to read and how `store.moveEvent` interprets it. `'day'`
   * (month grid) reads `data-date` for a whole-day shift; `'time'` (week / day /
   * work-week) reads `data-bc-instant` and snaps the event's start to that slot.
   */
  mode: MoveMode
}

/**
 * Wire event drag-to-move **and** edge-resize for one calendar, framework-
 * neutrally, on top of Pragmatic Drag and Drop. Under `root` it binds:
 *
 * - every `[data-bc-event]` element as a **move** drag source (gated by
 *   `store.isDraggable`);
 * - every `[data-bc-resize]` handle as a **resize** drag source (gated by
 *   `store.isResizable`, carrying the dragged edge);
 * - every drop-target cell (by `mode` — `data-date` for `'day'`, `data-bc-instant`
 *   for `'time'`) as a drop target.
 *
 * On drop it calls `store.resizeEvent` (handle drags) or `store.moveEvent` (body
 * drags) — core owns the date-math, so every adapter behaves identically. A
 * `MutationObserver` keeps the bindings in sync as the view re-renders. Resize
 * handles are only rendered in the time grid, so in `'day'` mode none are found.
 *
 * It also wires drag/drop across the calendar boundary:
 *
 * - **drop-from-outside** (time grid only this slice): each slot is also a drop
 *   target for outside items, from either a Pragmatic `draggable` palette item
 *   (carrying {@link ExternalDragPayload} as element data) or a plain native
 *   `draggable="true"` element (carrying it as JSON on the {@link EXTERNAL_MIME}
 *   type). A drop calls `store.dropExternal`;
 * - **drag-out** (every mode): each event also exposes its data on the native
 *   `dataTransfer` (so an external HTML5 dropzone can read it) and reports
 *   `store.eventDragStart` when its drag begins.
 *
 * Returns a cleanup that disconnects the observer, stops both monitors, and
 * releases every per-element binding.
 */
export function bindCalendarDnd<TEvent>({ root, store, mode }: BindCalendarDndOptions<TEvent>): () => void {
  const dropAttr = DROP_ATTR[mode]
  // Drop-from-outside is wired on the time grid only this slice (month is later),
  // so the external adapter is engaged for `'time'` drops. Drag-*out* works in
  // every mode (it's just the event becoming a native drag source).
  const externalEnabled = mode === 'time'
  // Per-element Pragmatic DnD cleanups, so re-scans never double-bind and removed
  // nodes are released.
  const bindings = new Map<Element, () => void>()

  const bindDraggable = (element: HTMLElement): void => {
    if (bindings.has(element)) return
    const id = element.getAttribute(EVENT_ATTR)
    if (!id) return // an event element without a resolvable id is not draggable
    bindings.set(
      element,
      draggable({
        element,
        getInitialData: () => ({ bcEventId: id }),
        // Drag-out: also expose the event on the native `dataTransfer` so a plain
        // HTML5 drop target outside the calendar can read it, and notify the app
        // the drag began (v1's `onDragStart`).
        getInitialDataForExternal: () => {
          const data = store.getEventTransfer({ id })
          if (data == null) return {}
          return { 'text/plain': data.title || data.id, [EVENT_MIME]: JSON.stringify(data) }
        },
        onDragStart: () => store.eventDragStart({ id }),
        canDrag: () => {
          const event = store.getEvent({ id })
          return event != null && store.isDraggable(event)
        },
      }),
    )
  }

  const bindResizeHandle = (element: HTMLElement): void => {
    if (bindings.has(element)) return
    const edge = element.getAttribute(RESIZE_ATTR)
    // The handle lives inside the event element, which carries the id.
    const id = element.closest(`[${EVENT_ATTR}]`)?.getAttribute(EVENT_ATTR)
    if (!edge || !id) return
    bindings.set(
      element,
      draggable({
        element,
        getInitialData: () => ({ bcEventId: id, bcResizeEdge: edge }),
        canDrag: () => {
          const event = store.getEvent({ id })
          return event != null && store.isResizable(event)
        },
      }),
    )
  }

  const bindDropTarget = (element: HTMLElement): void => {
    if (bindings.has(element)) return
    const getData = (): { bcDropTarget: string | null } => ({ bcDropTarget: element.getAttribute(dropAttr) })
    // A slot may carry two registrations (internal move/resize + native outside);
    // compose their cleanups under the one element key so re-scans stay correct.
    const cleanups = [dropTargetForElements({ element, getData })]
    if (externalEnabled) {
      cleanups.push(
        dropTargetForExternal({
          element,
          // Only our outside items — ignore unrelated native drags (files, text).
          canDrop: ({ source }) => source.types.includes(EXTERNAL_MIME),
          getData,
        }),
      )
    }
    bindings.set(element, () => {
      for (const cleanup of cleanups) cleanup()
    })
  }

  const scan = (): void => {
    root.querySelectorAll<HTMLElement>(`[${EVENT_ATTR}]`).forEach(bindDraggable)
    root.querySelectorAll<HTMLElement>(`[${RESIZE_ATTR}]`).forEach(bindResizeHandle)
    root.querySelectorAll<HTMLElement>(`[${dropAttr}]`).forEach(bindDropTarget)
  }
  scan()

  // Release bindings for nodes that left the tree, then bind any that arrived.
  const observer = new MutationObserver(() => {
    for (const [element, release] of bindings) {
      if (!root.contains(element)) {
        release()
        bindings.delete(element)
      }
    }
    scan()
  })
  observer.observe(root, { childList: true, subtree: true })

  const stopMonitor = monitorForElements({
    // Live preview: as a drag crosses into a new slot, recompute the proposed
    // bounds so the view can render the resulting extent. Two in-window sources:
    // a **resize** edge (true extent) and a **Pragmatic** outside item (true
    // extent, payload readable mid-drag). A plain move carries neither, so it's
    // skipped (move preview is a later slice).
    onDropTargetChange({ source, location }) {
      const target = location.current.dropTargets[0]?.data.bcDropTarget
      const external = source.data[EXTERNAL_DATA_KEY]
      if (externalEnabled && external != null && typeof external === 'object') {
        if (typeof target !== 'string') {
          store.clearDragPreview()
          return
        }
        store.previewExternal({ target, durationMinutes: (external as ExternalDragPayload).durationMinutes })
        return
      }
      const edge = source.data.bcResizeEdge
      if (edge !== 'start' && edge !== 'end') return
      const id = source.data.bcEventId
      if (typeof id !== 'string' || typeof target !== 'string') {
        store.clearDragPreview()
        return
      }
      store.previewResize({ id, edge, target })
    },
    onDrop({ source, location }) {
      const target = location.current.dropTargets[0]?.data.bcDropTarget
      // A Pragmatic outside item (palette) creates an event; branch first.
      const external = source.data[EXTERNAL_DATA_KEY]
      if (externalEnabled && external != null && typeof external === 'object') {
        if (typeof target !== 'string') {
          store.clearDragPreview()
          return
        }
        const { durationMinutes, allDay } = external as ExternalDragPayload
        store.dropExternal({ target, durationMinutes, allDay }) // clears the preview itself
        return
      }
      const id = source.data.bcEventId
      // A resize handle carries its edge; the event body does not — branch on it.
      const edge = source.data.bcResizeEdge
      if (typeof id !== 'string' || typeof target !== 'string') {
        // Dropped outside every slot — abandon any in-flight resize preview.
        if (edge === 'start' || edge === 'end') store.clearDragPreview()
        return
      }
      if (edge === 'start' || edge === 'end') {
        store.resizeEvent({ id, edge, target }) // clears the preview itself
        return
      }
      store.moveEvent({ id, target, mode })
    },
  })

  // Native HTML5 drag-from-outside. The element monitor above can't see plain
  // `draggable="true"` sources, so a second monitor on the external adapter
  // handles them. Per the HTML5 spec the payload is in protected mode during the
  // drag (only the media *types* are visible), so the live preview can show only
  // a single landing slot until the drop reveals the duration.
  const stopExternalMonitor = externalEnabled
    ? monitorForExternal({
        canMonitor: ({ source }) => source.types.includes(EXTERNAL_MIME),
        onDropTargetChange({ location }) {
          const target = location.current.dropTargets[0]?.data.bcDropTarget
          if (typeof target !== 'string') {
            store.clearDragPreview()
            return
          }
          // No duration available mid-drag → single-slot preview.
          store.previewExternal({ target })
        },
        onDrop({ source, location }) {
          const target = location.current.dropTargets[0]?.data.bcDropTarget
          if (typeof target !== 'string') {
            store.clearDragPreview()
            return
          }
          const payload = parseExternalPayload(source.getStringData(EXTERNAL_MIME))
          store.dropExternal({
            target,
            durationMinutes: payload?.durationMinutes,
            allDay: payload?.allDay,
          })
        },
      })
    : null

  return () => {
    observer.disconnect()
    stopMonitor()
    stopExternalMonitor?.()
    store.clearDragPreview()
    for (const release of bindings.values()) release()
    bindings.clear()
  }
}
