import { wrapAccessor } from '@big-calendar/core'
import type { EventId } from '@big-calendar/core'
import { useCallback, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useCalendarContext } from '../CalendarProvider'

/** What {@link useKeyboardDnd} returns for the time-grid root. */
export interface KeyboardDnd {
  /**
   * Capture-phase key handler for the time-grid root. It must run on
   * `onKeyDownCapture` so it sees the key **before** the focused `EventButton`
   * (whose Space = open) and the roving hooks, letting it claim Space for pick-up
   * and the arrows for moving a grabbed event.
   */
  onKeyDownCapture: (e: ReactKeyboardEvent) => void
  /** Latest screen-reader announcement; render it in a polite live region. */
  announcement: string
}

/**
 * Keyboard-accessible event drag ("grab") for the time grid (§a11y). A modal,
 * pointer-free move/resize driven entirely from the keyboard, layered over the
 * existing event roving:
 *
 * - **Space** on a focused **timed** event picks it up (and is swallowed, so it
 *   doesn't also "open" the event — Enter still does that).
 * - while grabbed: **↑/↓** move it a slot earlier/later, **←/→** move it a day;
 *   **Shift+↓ / Shift+↑** grow / shrink its end edge a slot.
 * - **Enter / Space** drops it (fires `onEventDrop`, or `onEventResize` for a
 *   pure resize); **Escape** cancels and restores it.
 *
 * Core owns the bounds math + which callback fires ({@link CalendarStore.grabEvent}
 * and friends); this hook only translates keys and announces each step. The
 * proposed extent is shown via `store.dragPreview` (the same dashed box a pointer
 * resize uses), set by the grab actions. Only timed events (inside `.bc-time-body`)
 * are grabbable; the all-day row and other views are untouched this slice.
 */
export function useKeyboardDnd<TEvent = unknown>(): KeyboardDnd {
  const { store } = useCalendarContext<TEvent>()
  const { localizer, step } = store
  const [announcement, setAnnouncement] = useState('')

  // Build the "<title>, <day> <from> to <to>" description from the live grab
  // bounds (read after the action so it reflects the new position).
  const describe = useCallback(
    (id: EventId, prefix: string): string => {
      const grab = store.keyboardDrag.peek()
      if (grab == null) return prefix
      const event = store.getEvent({ id })
      const name = (event != null ? wrapAccessor(store.accessors.title)(event) : '') ?? ''
      const day = localizer.format({ value: grab.start, format: 'dayHeader' })
      const from = localizer.format({ value: grab.start, format: 'time' })
      const to = localizer.format({ value: grab.end, format: 'time' })
      return `${prefix} ${name}, ${day} ${from} to ${to}`.trim()
    },
    [store, localizer],
  )

  const onKeyDownCapture = useCallback(
    (e: ReactKeyboardEvent) => {
      const grab = store.keyboardDrag.peek()

      // Not grabbing yet: Space picks up the focused timed event.
      if (grab == null) {
        if (e.key !== ' ') return
        const el = e.target instanceof Element ? e.target.closest<HTMLElement>('[data-bc-event]') : null
        // Timed events only — the all-day row isn't grabbable this slice.
        if (el == null || el.closest('.bc-time-body') == null) return
        const id = el.dataset.bcEvent
        if (!id || !store.grabEvent({ id })) return
        e.preventDefault()
        e.stopPropagation() // don't also "open" the event or rove focus
        setAnnouncement(
          describe(
            id,
            'Picked up. Arrow keys move, Shift with Up or Down resizes, Enter drops, Escape cancels.',
          ),
        )
        return
      }

      // Grabbed: claim the navigation keys.
      const id = grab.id
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          e.stopPropagation()
          if (e.shiftKey) store.grabResize({ minutes: -step })
          else store.grabMove({ minutes: -step })
          setAnnouncement(describe(id, ''))
          break
        case 'ArrowDown':
          e.preventDefault()
          e.stopPropagation()
          if (e.shiftKey) store.grabResize({ minutes: step })
          else store.grabMove({ minutes: step })
          setAnnouncement(describe(id, ''))
          break
        case 'ArrowLeft':
          e.preventDefault()
          e.stopPropagation()
          if (!e.shiftKey) {
            store.grabMove({ days: -1 })
            setAnnouncement(describe(id, ''))
          }
          break
        case 'ArrowRight':
          e.preventDefault()
          e.stopPropagation()
          if (!e.shiftKey) {
            store.grabMove({ days: 1 })
            setAnnouncement(describe(id, ''))
          }
          break
        case 'Enter':
        case ' ': {
          e.preventDefault()
          e.stopPropagation()
          const message = describe(id, 'Dropped.')
          store.grabCommit()
          setAnnouncement(message)
          break
        }
        case 'Escape':
          e.preventDefault()
          e.stopPropagation()
          store.grabCancel()
          setAnnouncement('Move cancelled.')
          break
        default:
          break
      }
    },
    [store, step, describe],
  )

  return { onKeyDownCapture, announcement }
}
