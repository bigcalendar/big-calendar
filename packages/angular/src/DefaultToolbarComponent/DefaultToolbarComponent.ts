import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core'
import { BUILTIN_VIEWS, Navigate } from '@big-calendar/core'
import type { NavigateDirection, ViewKey } from '@big-calendar/core'
import { injectCalendar } from '../CalendarProvider/injectCalendar'

const BUILTIN = new Set<string>(BUILTIN_VIEWS)

/**
 * Default toolbar rendered by `<bc-calendar>` when `[toolbar]="true"`.
 *
 * Displays previous / today / next navigation buttons, the current date label,
 * and a view-switcher button group. All text is sourced from the context's
 * resolved messages so it respects any `[messages]` override.
 *
 * Can be used standalone inside a `<bc-calendar-provider>` if you want the
 * toolbar without the calendar views:
 *
 * ```html
 * <bc-calendar-provider [localizer]="localizer" [events]="events">
 *   <bc-default-toolbar />
 *   <!-- custom view here -->
 * </bc-calendar-provider>
 * ```
 */
@Component({
  selector: 'bc-default-toolbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bc-toolbar">
      <div class="bc-toolbar-group">
        <button type="button" class="bc-btn" (click)="navigate(prev)">
          {{ messages.previous }}
        </button>
        <button type="button" class="bc-btn" (click)="navigate(today)">
          {{ messages.today }}
        </button>
        <button type="button" class="bc-btn" (click)="navigate(next)">
          {{ messages.next }}
        </button>
      </div>

      <span class="bc-toolbar-label">{{ label() }}</span>

      <div class="bc-toolbar-group">
        @for (option of views(); track option) {
          <button
            type="button"
            class="bc-btn"
            [attr.aria-pressed]="option === view()"
            (click)="setView(option)"
          >{{ viewLabel(option) }}</button>
        }
      </div>
    </div>
  `,
})
export class DefaultToolbarComponent {
  private readonly ctx = injectCalendar()
  private readonly destroyRef = inject(DestroyRef)

  readonly label = signal('')
  readonly view = signal<ViewKey>('month')
  readonly views = signal<ViewKey[]>([])

  readonly prev: NavigateDirection = Navigate.PREVIOUS
  readonly today: NavigateDirection = Navigate.TODAY
  readonly next: NavigateDirection = Navigate.NEXT

  get messages() {
    return this.ctx.messages
  }

  constructor() {
    const cleanups: (() => void)[] = []

    effect(() => {
      const store = this.ctx.storeSignal()
      if (!store) return
      cleanups.push(store.label.subscribe((l) => this.label.set(l)))
      cleanups.push(store.view.subscribe((v) => this.view.set(v)))
      cleanups.push(store.enabledViews.subscribe((vs) => this.views.set(vs)))
    })

    this.destroyRef.onDestroy(() => cleanups.forEach((fn) => fn()))
  }

  navigate(direction: NavigateDirection): void {
    this.ctx.storeSignal()?.navigate({ direction })
  }

  setView(view: ViewKey): void {
    this.ctx.storeSignal()?.setView({ view })
  }

  viewLabel(key: ViewKey): string {
    if (BUILTIN.has(key)) {
      const msgs = this.ctx.messages
      return (msgs[key as keyof typeof msgs] as string | undefined) ?? key
    }
    return key
  }
}
