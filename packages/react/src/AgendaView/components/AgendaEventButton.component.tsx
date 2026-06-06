import type { KeyboardEvent, MouseEvent } from 'react'
import { useEffect, useRef } from 'react'
import { useCalendarContext } from '../../CalendarProvider'

/** Pointer click/double-click disambiguation window (ms) — matches EventButton (§8.2). */
const DOUBLE_CLICK_MS = 250

/** Props for {@link AgendaEventButton}: the original event and its resolved title. */
interface AgendaEventButtonProps<TEvent> {
  /** The original event object (passed back to the callbacks). */
  event: TEvent
  /** Resolved title — the button's (or span's) text. */
  title: string
}

/**
 * The agenda's interactive event title. Unlike the box views' shared
 * {@link EventButton}, the agenda has **no** selection, drag or resize — so this
 * is a much thinner wrapper. It renders the title (`.bc-agenda-event`) as a real
 * `<button>` **only when the app wired at least one event handler** (click /
 * double-click / right / middle, via `hasEventHandler`); otherwise it is a plain,
 * non-interactive `<span>`. The button is styled to read as a link (an action,
 * not navigation).
 *
 * When interactive it wires:
 * - **click** → `onEventClick`, **double-click** → `onEventDoubleClick`,
 *   disambiguated by a {@link DOUBLE_CLICK_MS} timer so they never both fire;
 * - **Enter / Space** → primary, **F2** → the keyboard double-click equivalent
 *   (advertised via `aria-keyshortcuts`);
 * - **right-click** (`contextmenu`, also the keyboard Menu key) →
 *   `onEventRightClick`; **middle-click** (`auxclick`, button 1) →
 *   `onEventMiddleClick`. Both receive the DOM event so the app can position a
 *   menu / `preventDefault`.
 *
 * There is no `aria-selected` (the agenda selects nothing) and no
 * `aria-describedby`: the shared event instructions describe the grids'
 * arrow-roving model, which the agenda — a natural tab-order list — does not use.
 */
function AgendaEventButton<TEvent>({ event, title }: AgendaEventButtonProps<TEvent>) {
  const { onEventClick, onEventDoubleClick, onEventRightClick, onEventMiddleClick, hasEventHandler } =
    useCalendarContext<TEvent>()

  // A pending single-click timer; a double-click cancels it before it fires.
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (clickTimer.current !== null) clearTimeout(clickTimer.current)
    },
    [],
  )

  // No interaction wired → a plain, non-interactive label.
  if (!hasEventHandler) return <span className="bc-agenda-event">{title}</span>

  const primary = () => onEventClick(event)
  const secondary = () => onEventDoubleClick(event)

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

  return (
    <button
      type="button"
      className="bc-agenda-event"
      aria-keyshortcuts="Enter Space F2"
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      onContextMenu={(e: MouseEvent<HTMLButtonElement>) => onEventRightClick(event, e)}
      onAuxClick={(e: MouseEvent<HTMLButtonElement>) => {
        if (e.button === 1) onEventMiddleClick(event, e)
      }}
    >
      {title}
    </button>
  )
}

export default AgendaEventButton
