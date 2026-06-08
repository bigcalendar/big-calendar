import {
  draggable,
  dropTargetForElements,
  monitorForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import type { EventId, MoveMode, ResizeEdge } from '@big-calendar/core'

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
 * Returns a cleanup that disconnects the observer, stops the drop monitor, and
 * releases every per-element binding.
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
        getData: () => ({ bcDropTarget: element.getAttribute(dropAttr) }),
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
    onDrop({ source, location }) {
      const id = source.data.bcEventId
      const target = location.current.dropTargets[0]?.data.bcDropTarget
      if (typeof id !== 'string' || typeof target !== 'string') return
      // A resize handle carries its edge; the event body does not — branch on it.
      const edge = source.data.bcResizeEdge
      if (edge === 'start' || edge === 'end') {
        store.resizeEvent({ id, edge, target })
        return
      }
      store.moveEvent({ id, target, mode })
    },
  })

  return () => {
    observer.disconnect()
    stopMonitor()
    for (const release of bindings.values()) release()
    bindings.clear()
  }
}
