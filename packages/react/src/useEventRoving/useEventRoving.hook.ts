import { useCallback, useEffect, useRef, useState } from 'react'
import type { FocusEvent as ReactFocusEvent, KeyboardEvent as ReactKeyboardEvent } from 'react'

/** Arrow keys that step forward / backward through the event buttons. */
const STEP: Record<string, 1 | -1 | undefined> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
}

/** What {@link useEventRoving} returns for the view root. */
export interface EventRoving {
  /** Attach to the view root that contains every event button. */
  containerRef: (node: HTMLElement | null) => void
  /** Arrow handler that moves among the event buttons. */
  onKeyDown: (e: ReactKeyboardEvent) => void
  /** Focus sync — keeps the single tab stop on the focused event button. */
  onFocusCapture: (e: ReactFocusEvent) => void
}

/**
 * The events roving-tabindex group (§8.2): the view's event buttons (`EventButton`,
 * marked `data-bc-event`) become **one** tab stop, with the arrow keys moving
 * focus among them — the second of the two bounded tab stops (the slot grid is the
 * other, {@link useRovingSelection}). Enter / Space / F2 stay on the button itself.
 *
 * Event buttons are scattered across per-week / per-column / all-day containers, so
 * there is no single React parent to thread a `tabIndex` prop through. Instead this
 * hook attaches at the **view root** and owns the buttons' `tabIndex` imperatively:
 * after each render it walks the `[data-bc-event]` buttons in DOM order and makes
 * exactly one tabbable (the focused one, else the first). `EventButton` renders no
 * `tabIndex` of its own, so React never fights these writes.
 */
export function useEventRoving(): EventRoving {
  const container = useRef<HTMLElement | null>(null)
  const [activeKey, setActiveKey] = useState<string | null>(null)

  const containerRef = useCallback((node: HTMLElement | null) => {
    container.current = node
  }, [])

  const buttons = (): HTMLElement[] =>
    Array.from(container.current?.querySelectorAll<HTMLElement>('[data-bc-event]') ?? [])

  // Roving tabindex: exactly one event button is in the tab order (the active one,
  // or the first if the active button is gone). Runs after every render so adding
  // or removing events re-establishes the single tab stop.
  useEffect(() => {
    const list = buttons()
    if (list.length === 0) return
    const active = list.find((b) => b.dataset.bcEvent === activeKey) ?? list[0]!
    for (const b of list) b.tabIndex = b === active ? 0 : -1
  })

  const onKeyDown = useCallback((e: ReactKeyboardEvent) => {
    const step = STEP[e.key]
    if (step === undefined) return
    const current =
      e.target instanceof Element ? e.target.closest<HTMLElement>('[data-bc-event]') : null
    if (current == null) return
    const list = buttons()
    const next = list[list.indexOf(current) + step]
    e.preventDefault() // own the arrows even at an end (no surface scroll)
    if (next == null) return
    next.focus()
    setActiveKey(next.dataset.bcEvent ?? null)
  }, [])

  const onFocusCapture = useCallback((e: ReactFocusEvent) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-bc-event]')
    if (btn != null && container.current?.contains(btn)) setActiveKey(btn.dataset.bcEvent ?? null)
  }, [])

  return { containerRef, onKeyDown, onFocusCapture }
}
