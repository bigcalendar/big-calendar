import {
  draggable,
  dropTargetForElements,
  monitorForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import type { EventId, EventTransfer, MoveMode, ResizeEdge, ResourceId } from '@big-calendar/core'

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
  moveEvent(args: { id: EventId; target: string; mode: MoveMode; resourceId?: ResourceId | undefined }): void
  /** Update the live move preview as a dragged event moves over slots/cells. */
  previewMove(args: { id: EventId; target: string; mode: MoveMode }): void
  /** Commit a resize drop: core recomputes the bounds and fires `onEventResize`. */
  resizeEvent(args: {
    id: EventId
    edge: ResizeEdge
    target: string
    mode: MoveMode
    resourceId?: ResourceId | undefined
  }): void
  /** Update the live resize preview as the dragged edge moves over slots/cells. */
  previewResize(args: { id: EventId; edge: ResizeEdge; target: string; mode: MoveMode }): void
  /** Clear the live resize preview (drag left every slot, or ended). */
  clearDragPreview(): void
  /** Commit a drop from outside the calendar: core fires `onDropFromOutside`. */
  dropExternal(args: {
    target: string
    mode: MoveMode
    durationMinutes?: number | undefined
    allDay?: boolean | undefined
    start?: string | undefined
    end?: string | undefined
    resourceId?: ResourceId | undefined
  }): void
  /** Update the live preview as an outside item moves over slots/cells (single slot/day if no payload). */
  previewExternal(args: {
    target: string
    mode: MoveMode
    durationMinutes?: number | undefined
    start?: string | undefined
    end?: string | undefined
  }): void
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
  /** The item's length in minutes; omitted → a one-slot event (time-grid drop). */
  durationMinutes?: number | undefined
  /** Whether the dropped item should become a whole-day event. */
  allDay?: boolean | undefined
  /**
   * The dragged item's own **template** bounds, when it already has a time-of-day
   * (e.g. an unscheduled task). A `'day'` (month) drop keeps their time-of-day and
   * moves their date to the dropped day; a `'time'` drop falls back to their span
   * when no `durationMinutes` is given.
   */
  start?: string | undefined
  end?: string | undefined
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
 * Attribute on a resource column (or any ancestor of a drop target) carrying the
 * column's resource id. Read from the dropped cell's nearest `[data-bc-resource]`
 * ancestor and reported back as the **landing** `resourceId` on a move / resize /
 * external drop, so a resource grid can reassign the event to that resource.
 * Absent in a resource-less grid.
 */
const RESOURCE_ATTR = 'data-bc-resource'
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
    const { durationMinutes, allDay, start, end } = parsed as Record<string, unknown>
    return {
      durationMinutes: typeof durationMinutes === 'number' ? durationMinutes : undefined,
      allDay: allDay === true,
      start: typeof start === 'string' ? start : undefined,
      end: typeof end === 'string' ? end : undefined,
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
 * It also wires drag/drop across the calendar boundary (both modes — time grid
 * and month):
 *
 * - **drop-from-outside** from a same-page palette *outside the grid*, via two
 *   transports: a Pragmatic `draggable` palette item (carrying
 *   {@link ExternalDragPayload} as element data, handled by the element monitor
 *   with a true-extent preview), or a plain native `draggable="true"` element
 *   (carrying it as JSON on the {@link EXTERNAL_MIME} type, handled by delegated
 *   HTML5 `dragover`/`drop` listeners on the root with a single-slot/day preview).
 *   Either way a drop calls `store.dropExternal` (in `'day'`/month mode a drop
 *   with no `start`/`end` template becomes a whole-day event on the dropped day);
 * - **drag-out** (every mode): each event also exposes its data on the native
 *   `dataTransfer` (so an external HTML5 dropzone can read it) and reports
 *   `store.eventDragStart` when its drag begins.
 *
 * Returns a cleanup that disconnects the observer, stops the monitor, removes the
 * native listeners, and releases every per-element binding.
 */
export function bindCalendarDnd<TEvent>({ root, store, mode }: BindCalendarDndOptions<TEvent>): () => void {
  const dropAttr = DROP_ATTR[mode]
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
    bindings.set(
      element,
      dropTargetForElements({
        element,
        getData: () => ({
          bcDropTarget: element.getAttribute(dropAttr),
          // The owning resource column (resource grids), read from the nearest
          // ancestor; `null` in a plain grid. Reported as the landing resourceId.
          bcResourceId: element.closest(`[${RESOURCE_ATTR}]`)?.getAttribute(RESOURCE_ATTR) ?? null,
        }),
      }),
    )
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
    // Live preview: as a drag crosses into a new slot/cell, recompute the proposed
    // bounds so the view can render the resulting extent. Three in-window sources:
    // a **Pragmatic** outside item (true extent, payload readable mid-drag), a
    // **resize** edge (true extent), and a plain **move** (the dragged event's
    // shifted bounds).
    onDropTargetChange({ source, location }) {
      const target = location.current.dropTargets[0]?.data.bcDropTarget
      // A Pragmatic outside item (palette) carries a readable payload mid-drag, so
      // its preview shows the true extent — in both modes (time + month).
      const external = source.data[EXTERNAL_DATA_KEY]
      if (external != null && typeof external === 'object') {
        if (typeof target !== 'string') {
          store.clearDragPreview()
          return
        }
        const { durationMinutes, start, end } = external as ExternalDragPayload
        store.previewExternal({ target, mode, durationMinutes, start, end })
        return
      }
      const edge = source.data.bcResizeEdge
      const id = source.data.bcEventId
      // No edge → a plain event-body move; show where it would land.
      if (edge !== 'start' && edge !== 'end') {
        if (typeof id !== 'string' || typeof target !== 'string') {
          store.clearDragPreview()
          return
        }
        store.previewMove({ id, target, mode })
        return
      }
      if (typeof id !== 'string' || typeof target !== 'string') {
        store.clearDragPreview()
        return
      }
      store.previewResize({ id, edge, target, mode })
    },
    onDrop({ source, location }) {
      const dropData = location.current.dropTargets[0]?.data
      const target = dropData?.bcDropTarget
      // Landing resource column (resource grids only); a DOM attr → always a string.
      const rawResourceId = dropData?.bcResourceId
      const resourceId = typeof rawResourceId === 'string' ? rawResourceId : undefined
      // A Pragmatic outside item (palette) creates an event; branch first.
      const external = source.data[EXTERNAL_DATA_KEY]
      if (external != null && typeof external === 'object') {
        if (typeof target !== 'string') {
          store.clearDragPreview()
          return
        }
        const { durationMinutes, allDay, start, end } = external as ExternalDragPayload
        store.dropExternal({ target, mode, durationMinutes, allDay, start, end, resourceId }) // clears the preview itself
        return
      }
      const id = source.data.bcEventId
      // A resize handle carries its edge; the event body does not — branch on it.
      const edge = source.data.bcResizeEdge
      if (typeof id !== 'string' || typeof target !== 'string') {
        // Dropped outside every cell — abandon any in-flight preview (move or resize).
        store.clearDragPreview()
        return
      }
      if (edge === 'start' || edge === 'end') {
        store.resizeEvent({ id, edge, target, mode, resourceId }) // clears the preview itself
        return
      }
      store.moveEvent({ id, target, mode, resourceId }) // clears the preview itself
    },
  })

  // Native HTML5 drag-from-outside (a plain `draggable="true"` palette item on the
  // same page, *outside the grid*). Pragmatic can't help here: its element adapter
  // only tracks its own `draggable()` sources, and its *external* adapter means
  // "from outside the browser window" (files, other tabs) — it explicitly ignores
  // drags that started inside the document. So we attach plain delegated HTML5
  // listeners to the root: find the hovered slot via `closest`, gate on our MIME,
  // and `preventDefault` to accept the drop. Per the HTML5 spec the payload is in
  // protected mode during the drag (only media *types* are readable), so the live
  // preview is a single landing slot/day until the drop reveals the payload. Wired
  // in both modes — `'time'` (slot drop) and `'day'` (month-cell drop).
  const carriesPayload = (event: DragEvent): boolean =>
    event.dataTransfer != null && Array.from(event.dataTransfer.types).includes(EXTERNAL_MIME)
  const slotInstant = (event: DragEvent): string | null =>
    (event.target as Element | null)?.closest<HTMLElement>(`[${dropAttr}]`)?.getAttribute(dropAttr) ?? null
  const slotResourceId = (event: DragEvent): string | undefined =>
    (event.target as Element | null)?.closest<HTMLElement>(`[${RESOURCE_ATTR}]`)?.getAttribute(RESOURCE_ATTR) ?? undefined

  // Only re-set the preview when the hovered slot changes (dragover fires rapidly).
  let lastPreviewInstant: string | null = null
  const onNativeDragOver = (event: DragEvent): void => {
    if (!carriesPayload(event)) return
    const target = slotInstant(event)
    if (target == null) {
      if (lastPreviewInstant !== null) {
        store.clearDragPreview()
        lastPreviewInstant = null
      }
      return
    }
    // Accept the drop on this slot (and show the copy cursor).
    event.preventDefault()
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
    if (target !== lastPreviewInstant) {
      store.previewExternal({ target, mode }) // single-slot/day highlight at the hovered cell
      lastPreviewInstant = target
    }
  }
  const onNativeDrop = (event: DragEvent): void => {
    if (!carriesPayload(event)) return
    lastPreviewInstant = null
    const target = slotInstant(event)
    if (target == null) {
      store.clearDragPreview()
      return
    }
    event.preventDefault()
    const payload = parseExternalPayload(event.dataTransfer?.getData(EXTERNAL_MIME) ?? null)
    store.dropExternal({
      target,
      mode,
      durationMinutes: payload?.durationMinutes,
      allDay: payload?.allDay,
      start: payload?.start,
      end: payload?.end,
      resourceId: slotResourceId(event),
    })
  }
  const onNativeDragLeave = (event: DragEvent): void => {
    // Clear once the pointer leaves the root entirely (not on inner-element hops).
    const to = event.relatedTarget as Node | null
    if (to == null || !root.contains(to)) {
      lastPreviewInstant = null
      store.clearDragPreview()
    }
  }
  root.addEventListener('dragover', onNativeDragOver)
  root.addEventListener('drop', onNativeDrop)
  root.addEventListener('dragleave', onNativeDragLeave)

  return () => {
    observer.disconnect()
    stopMonitor()
    root.removeEventListener('dragover', onNativeDragOver)
    root.removeEventListener('drop', onNativeDrop)
    root.removeEventListener('dragleave', onNativeDragLeave)
    store.clearDragPreview()
    for (const release of bindings.values()) release()
    bindings.clear()
  }
}
