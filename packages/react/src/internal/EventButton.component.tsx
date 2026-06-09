import { wrapAccessor } from '@big-calendar/core'
import type { ResizeEdge } from '@big-calendar/core'
import type { CSSProperties, KeyboardEvent, MouseEvent, PointerEvent, ReactNode } from 'react'
import { useEffect, useRef } from 'react'
import { useCalendarContext } from '../CalendarProvider'
import { useSignalValue } from './useSignalValue'

/** Pointer click/double-click disambiguation window (ms) — see §8.2. */
const DOUBLE_CLICK_MS = 250

/**
 * Props for {@link EventButton}: the original event plus its accessible-name
 * parts, the view's box `className`/`style`, and the (overridable) presentational
 * content rendered inside the button.
 */
export interface EventButtonProps<TEvent> {
  /** The original event object (passed back to the callbacks). */
  event: TEvent
  /** Resolved title, for the accessible name. */
  title: string
  /** Formatted time, appended to the accessible name when present. */
  time?: string | undefined
  /** The view's box class (`bc-event` or `bc-segment`). */
  className: string
  /** Inline geometry custom properties from the view's geometry helper. */
  style?: CSSProperties | undefined
  /**
   * Which resize-edge handles to render. Time-grid timed events pass both
   * (`['start','end']` → top/bottom strips); month segments pass only the edges
   * that fall in this week row (a multi-week event shows `start` on its first row
   * and `end` on its last). Handles are emitted only when the event is also
   * resizable (`store.isResizable`); the DnD layer (`@big-calendar/dnd`) binds
   * them via their `data-bc-resize` edge, and CSS orients them (vertical inside a
   * `.bc-event`, horizontal inside a `.bc-segment`).
   */
  resizeEdges?: readonly ResizeEdge[] | undefined
  /** Presentational event content (the overridable slot). */
  children: ReactNode
}

/**
 * The one shared interactive wrapper for a calendar event (§8.2). Renders a real
 * `<button>` carrying `data-bc-event` so slot selection can detect "over an
 * event", and centralizes event interaction in a single place instead of
 * duplicating it across Month / TimeGrid / Agenda:
 *
 * - **click** (pointer) selects the event (`store.selectEvent`) and fires
 *   `onEventClick`; **double-click** also selects and fires
 *   `onEventDoubleClick`. The two are disambiguated by a
 *   {@link DOUBLE_CLICK_MS} timer so they never both fire.
 *   Behaviour is core-owned via `store.eventHandlers`; this component only routes
 *   DOM events and composes the selection side-effect (grid views select).
 * - **right-click** (`contextmenu`, also the keyboard Menu key) fires
 *   `onEventRightClick`; **middle-click** (`auxclick`, button 1) fires
 *   `onEventMiddleClick`. Both receive the **native** DOM event; the app decides
 *   whether to `preventDefault` (e.g. to replace the native context menu). Each
 *   listener is attached **only when its handler is provided**
 *   (`store.eventHandlers.hasRightClick` / `hasMiddleClick`) — omit the
 *   right-click handler and the browser's native context menu is left untouched.
 * - **keyboard**: Enter / Space = primary (select + `onEventClick`); **F2** =
 *   secondary (select + `onEventDoubleClick`) — there is no keyboard
 *   double-click, so F2 is the WCAG-2.1.1 parity key. Keys are advertised via
 *   `aria-keyshortcuts`.
 * - selected state is exposed with `aria-selected`.
 * - `pointerdown` propagation is stopped so an event interaction never also
 *   starts a slot selection on the surface beneath.
 *
 * The overridable event slot is the button's presentational content; button
 * semantics + a11y live here, once.
 */
export default function EventButton<TEvent>({
  event,
  title,
  time,
  className,
  style,
  resizeEdges,
  children,
}: EventButtonProps<TEvent>) {
  const { store, descriptionIds } = useCalendarContext<TEvent>()
  const { eventHandlers } = store
  const id = wrapAccessor(store.accessors.id)(event)
  const selectedId = useSignalValue(store.selected)
  const isSelected = id != null && selectedId === id
  // Marked while this event is held in a keyboard grab (drives the lifted style +
  // `aria-grabbed`). `keyboardDrag` stays `null` outside a grab, so this subscription
  // only re-renders event buttons while a grab is actually in flight.
  const grab = useSignalValue(store.keyboardDrag)
  // String-compare so a numeric accessor id and a DOM-sourced id still match.
  const isGrabbed = id != null && grab != null && String(grab.id) === String(id)
  // Resize handles render only for the requested edges and when the event allows it.
  const edges: readonly ResizeEdge[] = resizeEdges != null && store.isResizable(event) ? resizeEdges : []

  // A pending single-click timer; a double-click cancels it before it fires.
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (clickTimer.current !== null) clearTimeout(clickTimer.current)
    },
    [],
  )

  // Grid views select the event on either gesture; core fires its callback (if
  // configured). The agenda composes neither (it has no selection) — see
  // AgendaEventButton.
  const select = () => {
    if (id != null) store.selectEvent({ id })
  }
  const primary = () => {
    select()
    eventHandlers.click(event)
  }
  const secondary = () => {
    select()
    eventHandlers.doubleClick(event)
  }

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    // Keyboard-synthesized clicks (Enter/Space) report detail 0 — handled in
    // onKeyDown so they're immediate (no double-click delay) and never debounced.
    if (e.detail === 0) return
    if (clickTimer.current !== null) return // second click of a double — let dblclick run
    clickTimer.current = setTimeout(() => {
      clickTimer.current = null
      primary()
    }, DOUBLE_CLICK_MS)
  }

  const handleDoubleClick = () => {
    if (clickTimer.current !== null) {
      clearTimeout(clickTimer.current)
      clickTimer.current = null
    }
    secondary()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      primary()
    } else if (e.key === 'F2') {
      e.preventDefault()
      secondary()
    }
  }

  const accessibleName = time ? `${title}, ${time}` : title

  return (
    <button
      type="button"
      className={isGrabbed ? `${className} bc-event-grabbed` : className}
      style={style}
      data-bc-event={id == null ? '' : String(id)}
      aria-selected={isSelected}
      aria-grabbed={isGrabbed || undefined}
      aria-label={accessibleName || undefined}
      aria-keyshortcuts="Enter Space F2"
      aria-describedby={descriptionIds.event}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      onContextMenu={
        eventHandlers.hasRightClick
          ? (e: MouseEvent<HTMLButtonElement>) => eventHandlers.rightClick(event, e.nativeEvent)
          : undefined
      }
      onAuxClick={
        eventHandlers.hasMiddleClick
          ? (e: MouseEvent<HTMLButtonElement>) => {
              if (e.button === 1) eventHandlers.middleClick(event, e.nativeEvent)
            }
          : undefined
      }
      onPointerDown={(e: PointerEvent<HTMLButtonElement>) => e.stopPropagation()}
    >
      {children}
      {edges.map((edge) => (
        <span
          key={edge}
          className={`bc-resize-handle bc-resize-handle-${edge}`}
          data-bc-resize={edge}
          aria-hidden="true"
        />
      ))}
    </button>
  )
}
