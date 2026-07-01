import type { ReactiveControllerHost } from 'lit'
import { effect } from '@preact/signals-core'
import { Views } from '@big-calendar/core'
import type { CalendarStore, MoveMode, ViewKey } from '@big-calendar/core'
import { bindCalendarDnd } from '@big-calendar/dnd'
import type { CalendarContextValue } from '../CalendarController/calendarContext'

function moveModeForView(view: ViewKey): MoveMode | null {
  if (view === Views.MONTH) return 'day'
  if (
    view === Views.WEEK ||
    view === Views.WORK_WEEK ||
    view === Views.DAY
  )
    return 'time'
  return null
}

/**
 * Lit ReactiveController that enables event drag-to-move and resize for the
 * calendar container. Wraps `bindCalendarDnd` from `@big-calendar/dnd`.
 *
 * Rebinds automatically when the active view changes. Must be attached to a
 * host element that contains the calendar grid in its subtree.
 *
 * `@big-calendar/dnd` is an optional peer dependency — if absent, the
 * `bindCalendarDnd` import is tree-shaken and this controller is a no-op.
 *
 * @example
 * ```ts
 * class MyCalendar extends LitElement {
 *   private _dnd = new CalendarDndController(this, () => this)
 *
 *   // After context is available:
 *   // this._dnd.setContext(ctx)
 * }
 * ```
 */
export class CalendarDndController {
  private _store: CalendarStore | null = null
  private _root: HTMLElement | null = null
  private _dndCleanup: (() => void) | null = null
  private _disposes: (() => void)[] = []

  constructor(
    private readonly host: ReactiveControllerHost & HTMLElement,
    private readonly getRoot?: () => HTMLElement,
  ) {
    host.addController(this)
  }

  hostConnected(): void {
    // root defaults to the host element itself
    this._root = this.getRoot ? this.getRoot() : this.host
  }

  hostDisconnected(): void {
    this._teardownAll()
  }

  /**
   * Call this when the calendar context becomes available (after context
   * consumer receives a value). Safe to call multiple times — tears down
   * existing bindings before establishing new ones.
   */
  setContext(ctx: CalendarContextValue): void {
    this._teardownAll()
    const store = ctx.store
    if (!store) return
    this._store = store

    this._disposes.push(
      effect(() => {
        const view = store.view.value
        this._rebind(view)
      }),
    )
  }

  /**
   * Manually set the root element to scan for drag/drop targets.
   * Useful when the calendar grid is rendered inside a shadow root or wrapper.
   */
  setRoot(el: HTMLElement): void {
    this._root = el
    const view = this._store?.view.value
    if (view) this._rebind(view)
  }

  private _rebind(view: ViewKey): void {
    this._dndCleanup?.()
    this._dndCleanup = null

    const mode = moveModeForView(view)
    if (mode == null || !this._store || !this._root) return

    this._store.dndEnabled.value = true
    this._dndCleanup = bindCalendarDnd({
      root: this._root,
      store: this._store,
      mode,
    })
  }

  private _teardownAll(): void {
    this._disposes.forEach((d) => d())
    this._disposes = []
    this._dndCleanup?.()
    this._dndCleanup = null
    if (this._store) this._store.dndEnabled.value = false
    this._store = null
  }
}
