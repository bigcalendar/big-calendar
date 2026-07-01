import { wrapAccessor } from '@big-calendar/core'
import type { EventId, MoveMode } from '@big-calendar/core'
import { shallowRef } from 'vue'
import type { ShallowRef } from 'vue'
import { useCalendarContext } from '../CalendarProvider'

/** Return value of {@link useKeyboardDnd}. */
export interface KeyboardDnd {
  /** Capture-phase key handler for the view root. Must run on `@keydown.capture`. */
  onKeydownCapture: (e: KeyboardEvent) => void
  /** Latest screen-reader announcement; render in a polite `role="status"` region. */
  announcement: ShallowRef<string>
}

/**
 * Vue port of the React `useKeyboardDnd` hook (§10-9).
 *
 * Keyboard-accessible event drag ("grab") for the time grid (`'time'`) and the
 * month grid (`'day'`). Space picks up the focused event; arrows move/resize it;
 * Enter drops, Escape cancels. Announcements go to a live region the caller renders.
 */
export function useKeyboardDnd({ mode }: { mode: MoveMode }): KeyboardDnd {
  const { store } = useCalendarContext()
  const { localizer, step } = store
  const announcement = shallowRef('')

  const gridSelector = mode === 'time' ? '.bc-time-body' : '.bc-month-grid'
  const pickupHint =
    mode === 'time'
      ? 'Picked up. Arrow keys move. Shift+Up/Down resizes end. Shift+Alt+Up/Down resizes start. Enter drops, Escape cancels.'
      : 'Picked up. Arrow keys move. Shift+arrows resizes end. Shift+Alt+arrows resizes start. Enter drops, Escape cancels.'

  const describe = (id: EventId, prefix: string): string => {
    const grab = store.keyboardDrag.peek()
    if (grab == null) return prefix
    const event = store.getEvent({ id })
    const name = (event != null ? wrapAccessor(store.accessors.title)(event as never) : '') ?? ''
    if (mode === 'time') {
      const day = localizer.format({ value: grab.start, format: 'dayColumnHeader' })
      const from = localizer.format({ value: grab.start, format: 'time' })
      const to = localizer.format({ value: grab.end, format: 'time' })
      return `${prefix} ${name}, ${day} ${from} to ${to}`.trim()
    }
    const startDate = localizer.format({ value: grab.start, format: 'agendaDate' })
    const endDate = localizer.format({ value: grab.end, format: 'agendaDate' })
    const span = localizer.isSameDate({ a: grab.start, b: grab.end })
      ? startDate
      : `${startDate} to ${endDate}`
    return `${prefix} ${name}, ${span}`.trim()
  }

  const onKeydownCapture = (e: KeyboardEvent): void => {
    const grab = store.keyboardDrag.peek()

    if (grab == null) {
      if (e.key !== ' ') return
      const el = e.target instanceof Element ? e.target.closest<HTMLElement>('[data-bc-event]') : null
      if (el == null || el.closest(gridSelector) == null) return
      const id = el.dataset.bcEvent
      if (!id || !store.grabEvent({ id })) return
      e.preventDefault()
      e.stopPropagation()
      announcement.value = describe(id, pickupHint)
      return
    }

    const id = grab.id
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      e.stopPropagation()
      const message = describe(id, 'Dropped.')
      store.grabCommit()
      announcement.value = message
      return
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      store.grabCancel()
      announcement.value = 'Move cancelled.'
      return
    }
    if (
      e.key !== 'ArrowUp' &&
      e.key !== 'ArrowDown' &&
      e.key !== 'ArrowLeft' &&
      e.key !== 'ArrowRight'
    )
      return

    e.preventDefault()
    e.stopPropagation()
    if (mode === 'time') {
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
    announcement.value = describe(id, '')
  }

  return { onKeydownCapture, announcement }
}
