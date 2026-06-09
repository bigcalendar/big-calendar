import { wrapAccessor } from '@big-calendar/core'
import type { EventId, MoveMode } from '@big-calendar/core'
import { useCallback, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useCalendarContext } from '../CalendarProvider'

/** Options for {@link useKeyboardDnd}. */
export interface KeyboardDndOptions {
  /**
   * Which surface drives the grab. `'time'` (time grid) steps by **slots/minutes**
   * (↑/↓) and days (←/→); `'day'` (month) steps by whole **days** (←/→) and weeks
   * (↑/↓). Picks the grabbable container, the step sizes, and the announcement
   * wording.
   */
  mode: MoveMode
}

/** What {@link useKeyboardDnd} returns for a view root. */
export interface KeyboardDnd {
  /**
   * Capture-phase key handler for the view root. It must run on
   * `onKeyDownCapture` so it sees the key **before** the focused `EventButton`
   * (whose Space = open) and the roving hooks, letting it claim Space for pick-up
   * and the arrows for moving a grabbed event.
   */
  onKeyDownCapture: (e: ReactKeyboardEvent) => void
  /** Latest screen-reader announcement; render it in a polite live region. */
  announcement: string
}

/**
 * Keyboard-accessible event drag ("grab"), shared by the time grid and the month
 * grid (§a11y). A modal, pointer-free move/resize driven entirely from the
 * keyboard, layered over the existing event roving:
 *
 * - **Space** on a focused event in the active surface picks it up (and is
 *   swallowed, so it doesn't also "open" the event — Enter still does that).
 * - while grabbed (**`'time'`**): **↑/↓** move it a slot earlier/later, **←/→**
 *   move it a day; **Shift+↓ / Shift+↑** grow / shrink its end edge a slot.
 * - while grabbed (**`'day'`**): **←/→** move it ±1 day, **↑/↓** move it ±1 week;
 *   **Shift+←/→** grow / shrink its end edge a day, **Shift+↑/↓** a week.
 * - **Enter / Space** drops it (fires `onEventDrop`, or `onEventResize` for a
 *   pure resize); **Escape** cancels and restores it.
 *
 * Core owns the bounds math + which callback fires ({@link CalendarStore.grabEvent}
 * and friends); this hook only translates keys and announces each step. The
 * proposed extent is shown via `store.dragPreview` (the dashed box / day-cell band
 * the pointer drag uses), set by the grab actions. Only events inside the active
 * surface (`.bc-time-body` for `'time'`, `.bc-month-grid` for `'day'`) are grabbable.
 */
export function useKeyboardDnd<TEvent = unknown>({ mode }: KeyboardDndOptions): KeyboardDnd {
  const { store } = useCalendarContext<TEvent>()
  const { localizer, step } = store
  const [announcement, setAnnouncement] = useState('')

  // The grabbable container + the wording differ by surface.
  const gridSelector = mode === 'time' ? '.bc-time-body' : '.bc-month-grid'
  const pickupHint =
    mode === 'time'
      ? 'Picked up. Arrow keys move. Shift+Up/Down resizes end. Shift+Alt+Up/Down resizes start. Enter drops, Escape cancels.'
      : 'Picked up. Arrow keys move. Shift+arrows resizes end. Shift+Alt+arrows resizes start. Enter drops, Escape cancels.'

  // Build the description from the live grab bounds (read after the action so it
  // reflects the new position): a time range for the time grid, a date range for
  // the month grid.
  const describe = useCallback(
    (id: EventId, prefix: string): string => {
      const grab = store.keyboardDrag.peek()
      if (grab == null) return prefix
      const event = store.getEvent({ id })
      const name = (event != null ? wrapAccessor(store.accessors.title)(event) : '') ?? ''
      if (mode === 'time') {
        const day = localizer.format({ value: grab.start, format: 'dayColumnHeader' })
        const from = localizer.format({ value: grab.start, format: 'time' })
        const to = localizer.format({ value: grab.end, format: 'time' })
        return `${prefix} ${name}, ${day} ${from} to ${to}`.trim()
      }
      const startDate = localizer.format({ value: grab.start, format: 'agendaDate' })
      const endDate = localizer.format({ value: grab.end, format: 'agendaDate' })
      const span = localizer.isSameDate({ a: grab.start, b: grab.end }) ? startDate : `${startDate} to ${endDate}`
      return `${prefix} ${name}, ${span}`.trim()
    },
    [store, localizer, mode],
  )

  const onKeyDownCapture = useCallback(
    (e: ReactKeyboardEvent) => {
      const grab = store.keyboardDrag.peek()

      // Not grabbing yet: Space picks up the focused event in the active surface.
      if (grab == null) {
        if (e.key !== ' ') return
        const el = e.target instanceof Element ? e.target.closest<HTMLElement>('[data-bc-event]') : null
        if (el == null || el.closest(gridSelector) == null) return
        const id = el.dataset.bcEvent
        if (!id || !store.grabEvent({ id })) return
        e.preventDefault()
        e.stopPropagation() // don't also "open" the event or rove focus
        setAnnouncement(describe(id, pickupHint))
        return
      }

      // Grabbed: drop / cancel are the same on every surface.
      const id = grab.id
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        e.stopPropagation()
        const message = describe(id, 'Dropped.')
        store.grabCommit()
        setAnnouncement(message)
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        store.grabCancel()
        setAnnouncement('Move cancelled.')
        return
      }
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return

      // Claim the arrows so they don't also rove focus.
      e.preventDefault()
      e.stopPropagation()
      if (mode === 'time') {
        // ↑/↓ step a slot; Shift resizes end, Shift+Alt resizes start; ←/→ move a day.
        if (e.key === 'ArrowUp') {
          if (e.shiftKey && e.altKey) store.grabResize({ minutes: -step, edge: 'start' })
          else if (e.shiftKey) store.grabResize({ minutes: -step })
          else store.grabMove({ minutes: -step })
        } else if (e.key === 'ArrowDown') {
          if (e.shiftKey && e.altKey) store.grabResize({ minutes: step, edge: 'start' })
          else if (e.shiftKey) store.grabResize({ minutes: step })
          else store.grabMove({ minutes: step })
        } else if (e.key === 'ArrowLeft') {
          if (!e.shiftKey) store.grabMove({ days: -1 })
        } else if (!e.shiftKey) {
          store.grabMove({ days: 1 })
        }
      } else {
        // ←/→ step a day, ↑/↓ step a week; Shift resizes end, Shift+Alt resizes start.
        if (e.key === 'ArrowLeft') {
          if (e.shiftKey && e.altKey) store.grabResize({ days: -1, edge: 'start' })
          else if (e.shiftKey) store.grabResize({ days: -1 })
          else store.grabMove({ days: -1 })
        } else if (e.key === 'ArrowRight') {
          if (e.shiftKey && e.altKey) store.grabResize({ days: 1, edge: 'start' })
          else if (e.shiftKey) store.grabResize({ days: 1 })
          else store.grabMove({ days: 1 })
        } else if (e.key === 'ArrowUp') {
          if (e.shiftKey && e.altKey) store.grabResize({ days: -7, edge: 'start' })
          else if (e.shiftKey) store.grabResize({ days: -7 })
          else store.grabMove({ days: -7 })
        } else if (e.shiftKey && e.altKey) {
          store.grabResize({ days: 7, edge: 'start' })
        } else if (e.shiftKey) {
          store.grabResize({ days: 7 })
        } else {
          store.grabMove({ days: 7 })
        }
      }
      setAnnouncement(describe(id, ''))
    },
    [store, step, describe, mode, gridSelector, pickupHint],
  )

  return { onKeyDownCapture, announcement }
}
