import {
  draggable,
  dropTargetForElements,
  monitorForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import type { EventId, MoveMode } from '@big-calendar/core'

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
  /** Commit a drop: core recomputes the bounds and fires `onEventDrop`. */
  moveEvent(args: { id: EventId; target: string; mode: MoveMode }): void
}

/**
 * Attribute the React (or any) adapter already stamps on an event element so it
 * becomes a drag source. The value is the event's accessor id.
 */
const EVENT_ATTR = 'data-bc-event'
/**
 * Attribute on a drop target (a month day cell today) carrying the target date
 * as an ISO string — the same `data-date` the grid uses for slot selection.
 */
const DROP_ATTR = 'data-date'

/** Options for {@link bindCalendarDnd}. */
export interface BindCalendarDndOptions<TEvent> {
  /** The calendar root to scan for drag sources / drop targets. */
  root: HTMLElement
  /** The store whose `moveEvent` action receives the committed drop. */
  store: DndStore<TEvent>
  /**
   * How a drop's `data-date` is interpreted by `store.moveEvent`. `'day'` for the
   * month grid (whole-day shift). Time-grid (`'time'`) drops — which need the
   * slot instant, not just the day — are wired in a later slice.
   */
  mode: MoveMode
}

/**
 * Wire event drag-to-move for one calendar, framework-neutrally, on top of
 * Pragmatic Drag and Drop. It binds every `[data-bc-event]` element under `root`
 * as a drag source (gated by `store.isDraggable`) and every `[data-date]`
 * element as a drop target, then on drop calls `store.moveEvent` — core owns the
 * date-math, so every adapter behaves identically. A `MutationObserver` keeps
 * the bindings in sync as the view re-renders.
 *
 * Returns a cleanup that disconnects the observer, stops the drop monitor, and
 * releases every per-element binding.
 */
export function bindCalendarDnd<TEvent>({ root, store, mode }: BindCalendarDndOptions<TEvent>): () => void {
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

  const bindDropTarget = (element: HTMLElement): void => {
    if (bindings.has(element)) return
    bindings.set(
      element,
      dropTargetForElements({
        element,
        getData: () => ({ bcDropDate: element.getAttribute(DROP_ATTR) }),
      }),
    )
  }

  const scan = (): void => {
    root.querySelectorAll<HTMLElement>(`[${EVENT_ATTR}]`).forEach(bindDraggable)
    root.querySelectorAll<HTMLElement>(`[${DROP_ATTR}]`).forEach(bindDropTarget)
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
      const target = location.current.dropTargets[0]?.data.bcDropDate
      if (typeof id !== 'string' || typeof target !== 'string') return
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
