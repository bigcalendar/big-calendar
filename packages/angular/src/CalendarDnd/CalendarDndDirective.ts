import {
  DestroyRef,
  Directive,
  ElementRef,
  effect,
  inject,
  signal,
} from '@angular/core'
import { Views } from '@big-calendar/core'
import type { MoveMode, ViewKey } from '@big-calendar/core'
import { bindCalendarDnd } from '@big-calendar/dnd'
import { injectCalendar } from '../CalendarProvider/injectCalendar'

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
 * Enable event drag-to-move and resize for the calendar container.
 * Wraps `bindCalendarDnd` from `@big-calendar/dnd`.
 *
 * Apply to any element that wraps the calendar grid. The directive scans the
 * subtree for `[data-bc-event]` drag sources and the drop cells the view
 * components render. Rebinds automatically when the active view changes.
 *
 * **`@big-calendar/dnd` is an optional peer dependency.** If it is absent the
 * directive is a no-op (the `bindCalendarDnd` import is tree-shaken).
 *
 * @example
 * ```html
 * <bc-calendar-provider ...>
 *   <div calendarDnd>
 *     <bc-calendar [toolbar]="false" />
 *   </div>
 * </bc-calendar-provider>
 * ```
 */
@Directive({
  selector: '[calendarDnd]',
  standalone: true,
})
export class CalendarDndDirective {
  private readonly ctx = injectCalendar()
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef)
  private readonly destroyRef = inject(DestroyRef)

  private dndCleanup: (() => void) | null = null
  private readonly _view = signal<ViewKey | null>(null)
  private readonly signalCleanups: (() => void)[] = []

  constructor() {
    // Bridge the store's view signal to Angular once the store is ready.
    effect(() => {
      const store = this.ctx.storeSignal()
      if (!store) return
      this.signalCleanups.push(store.view.subscribe((v) => this._view.set(v)))
    })

    // Re-bind pointer DnD whenever the view changes.
    effect(() => {
      const view = this._view()
      const store = this.ctx.storeSignal()
      if (!view || !store) return

      this.dndCleanup?.()
      this.dndCleanup = null

      const mode = moveModeForView(view)
      if (mode == null) return

      const root = this.el.nativeElement
      store.dndEnabled.value = true
      this.dndCleanup = bindCalendarDnd({ root, store, mode })
    })

    this.destroyRef.onDestroy(() => {
      this.signalCleanups.forEach((fn) => fn())
      this.dndCleanup?.()
      const store = this.ctx.storeSignal()
      if (store) store.dndEnabled.value = false
    })
  }
}
