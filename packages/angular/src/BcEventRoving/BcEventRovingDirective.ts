import {
  Directive,
  ElementRef,
  HostListener,
  inject,
} from '@angular/core'
import type { AfterViewChecked } from '@angular/core'

const STEP: Record<string, 1 | -1 | undefined> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
}

/**
 * Manages the event-button roving tabindex group for calendar views.
 *
 * Apply to the view root element (or the element that parents all event
 * buttons). All `[data-bc-event]` buttons inside become a single tab stop:
 * exactly one carries `tabIndex=0`, the rest `-1`. Arrow keys move focus
 * linearly through the list (document order).
 *
 * Tabindices are synced after every change-detection cycle so newly rendered
 * or removed events are always in step.
 *
 * @example
 * ```html
 * <div class="bc-month-grid" bcEventRoving>
 *   <button data-bc-event="evt-1" ...>...</button>
 *   <button data-bc-event="evt-2" ...>...</button>
 * </div>
 * ```
 */
@Directive({
  selector: '[bcEventRoving]',
  standalone: true,
})
export class BcEventRovingDirective implements AfterViewChecked {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef)
  private activeKey: string | null = null

  ngAfterViewChecked(): void {
    this.syncTabIndices()
  }

  @HostListener('keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    const step = STEP[e.key]
    if (step === undefined) return
    const target = e.target instanceof Element ? e.target : null
    const current = target?.closest<HTMLElement>('[data-bc-event]') ?? null
    if (current == null) return
    const list = this.buttons()
    const next = list[list.indexOf(current) + step]
    e.preventDefault()
    if (next == null) return
    next.focus()
    this.activeKey = next.dataset['bcEvent'] ?? null
  }

  @HostListener('focusin', ['$event'])
  onFocusIn(e: FocusEvent): void {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-bc-event]')
    if (btn != null && this.el.nativeElement.contains(btn)) {
      this.activeKey = btn.dataset['bcEvent'] ?? null
    }
  }

  private buttons(): HTMLElement[] {
    return Array.from(
      this.el.nativeElement.querySelectorAll<HTMLElement>('[data-bc-event]'),
    )
  }

  private syncTabIndices(): void {
    const list = this.buttons()
    if (list.length === 0) return
    const active =
      list.find((b) => b.dataset['bcEvent'] === this.activeKey) ?? list[0]!
    for (const b of list) b.tabIndex = b === active ? 0 : -1
  }
}
