import { Injectable, inject, signal } from '@angular/core'
import type { Signal } from '@angular/core'
import { CALENDAR_TOKEN } from '../CalendarProvider/calendarContext'
import { wrapAccessor } from '@big-calendar/core'
import type { EventId, MoveMode } from '@big-calendar/core'

/**
 * Injectable service that provides keyboard-accessible event drag for Angular
 * calendar views. Equivalent to Vue's `useKeyboardDnd()` composable.
 *
 * Provide it at the component level (either in `CalendarProviderComponent`'s
 * injector or the consuming component). Call `onKeydownCapture(event)` from a
 * `(keydown.capture)` binding on the view root; render `announcement()` in a
 * `role="status"` live-region for screen readers.
 *
 * Must be provided inside a `<bc-calendar-provider>` tree so that
 * `CALENDAR_TOKEN` is resolvable.
 *
 * @example
 * ```ts
 * @Component({
 *   providers: [CalendarDndService],
 *   template: `
 *     <div role="status" class="bc-sr-only">{{ dnd.announcement() }}</div>
 *     <div class="bc-month-grid" (keydown.capture)="dnd.onKeydownCapture($event)">
 *       <!-- event buttons with data-bc-event="..." -->
 *     </div>
 *   `,
 * })
 * export class MyView {
 *   readonly dnd = inject(CalendarDndService)
 *   constructor() { dnd.setMode('day') }
 * }
 * ```
 */
@Injectable()
export class CalendarDndService {
  private readonly ctx = inject(CALENDAR_TOKEN, { optional: true })

  private mode: MoveMode = 'day'
  private readonly _announcement = signal('')

  /** Latest screen-reader announcement. Render in a `role="status"` element. */
  readonly announcement: Signal<string> = this._announcement.asReadonly()

  /** Set the drag mode before the view renders. */
  setMode(mode: MoveMode): void {
    this.mode = mode
  }

  /** Bind to `(keydown.capture)` on the view root element. */
  onKeydownCapture(e: KeyboardEvent): void {
    const store = this.ctx?.storeSignal()
    if (!store) return

    const grab = store.keyboardDrag.peek()
    const gridSelector =
      this.mode === 'time' ? '.bc-time-body' : '.bc-month-grid'

    if (grab == null) {
      if (e.key !== ' ') return
      const el =
        e.target instanceof Element
          ? e.target.closest<HTMLElement>('[data-bc-event]')
          : null
      if (el == null || el.closest(gridSelector) == null) return
      const id = el.dataset['bcEvent']
      if (!id || !store.grabEvent({ id })) return
      e.preventDefault()
      e.stopPropagation()
      const hint =
        this.mode === 'time'
          ? 'Picked up. Arrow keys move. Shift+Up/Down resizes end. Shift+Alt+Up/Down resizes start. Enter drops, Escape cancels.'
          : 'Picked up. Arrow keys move. Shift+arrows resizes end. Shift+Alt+arrows resizes start. Enter drops, Escape cancels.'
      this._announcement.set(this.describe(store, id, hint))
      return
    }

    const id = grab.id
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      e.stopPropagation()
      const message = this.describe(store, id, 'Dropped.')
      store.grabCommit()
      this._announcement.set(message)
      return
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      store.grabCancel()
      this._announcement.set('Move cancelled.')
      return
    }

    const isArrow = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)
    if (!isArrow) return

    e.preventDefault()
    e.stopPropagation()

    const { step } = store

    if (this.mode === 'time') {
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
      } else {
        if (!e.shiftKey) store.grabMove({ days: 1 })
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
      } else {
        if (e.shiftKey && e.altKey) store.grabResize({ days: 7, edge: 'start' })
        else if (e.shiftKey) store.grabResize({ days: 7 })
        else store.grabMove({ days: 7 })
      }
    }

    this._announcement.set(this.describe(store, id, ''))
  }

  private describe(store: ReturnType<NonNullable<typeof this.ctx>['storeSignal']>, id: EventId, prefix: string): string {
    const grab = store?.keyboardDrag.peek()
    if (grab == null || !store) return prefix
    const event = store.getEvent({ id })
    const name =
      (event != null
        ? (wrapAccessor(store.accessors.title)(event as never) ?? '')
        : '') as string

    if (this.mode === 'time') {
      const day = store.localizer.format({ value: grab.start, format: 'dayColumnHeader' })
      const from = store.localizer.format({ value: grab.start, format: 'time' })
      const to = store.localizer.format({ value: grab.end, format: 'time' })
      return `${prefix} ${name}, ${day} ${from} to ${to}`.trim()
    }
    const startDate = store.localizer.format({ value: grab.start, format: 'agendaDate' })
    const endDate = store.localizer.format({ value: grab.end, format: 'agendaDate' })
    const span = store.localizer.isSameDate({ a: grab.start, b: grab.end })
      ? startDate
      : `${startDate} to ${endDate}`
    return `${prefix} ${name}, ${span}`.trim()
  }
}
