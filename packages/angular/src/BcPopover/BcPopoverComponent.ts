import {
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  Directive,
  ElementRef,
  inject,
  Input,
  ViewChild,
} from '@angular/core'
import type { AfterViewInit, OnDestroy } from '@angular/core'
import type { FloatingPlacement } from '@big-calendar/core/utils'
import { positionFloating } from '@big-calendar/core/utils'

let _nextId = 0

/**
 * Directive applied to the trigger element inside `<bc-popover>`.
 * The host element receives `popovertarget`, `aria-haspopup`, `aria-expanded`,
 * and `aria-controls` attributes automatically when the popover initializes.
 *
 * @example
 * ```html
 * <bc-popover>
 *   <button type="button" bcPopoverTrigger>Open</button>
 *   <p>Popover content</p>
 * </bc-popover>
 * ```
 */
@Directive({
  selector: '[bcPopoverTrigger]',
  standalone: true,
})
export class BcPopoverTriggerDirective {
  readonly el = inject<ElementRef<HTMLElement>>(ElementRef)
}

/**
 * Popover panel using the browser Popover API positioned via `positionFloating`
 * from `@big-calendar/core/utils`.
 *
 * Place any trigger element inside the popover with the `bcPopoverTrigger`
 * directive. The component auto-wires `popovertarget` / `aria-*` attributes and
 * repositions the panel on open.
 *
 * @example
 * ```html
 * <bc-popover placement="bottom-start">
 *   <button type="button" bcPopoverTrigger>Click to open</button>
 *   <div class="my-menu">Menu content</div>
 * </bc-popover>
 * ```
 */
@Component({
  selector: 'bc-popover',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BcPopoverTriggerDirective],
  template: `
    <ng-content select="[bcPopoverTrigger]" />
    <div
      #panel
      [id]="id"
      popover="auto"
      [class]="className || 'bc-popover'"
      (toggle)="onToggle($event)"
    >
      @if (isOpen) { <ng-content /> }
    </div>
  `,
})
export class BcPopoverComponent implements AfterViewInit, OnDestroy {
  /** Floating placement relative to the trigger. */
  @Input() placement: FloatingPlacement = 'bottom-start'
  /** CSS class override (default `'bc-popover'`). */
  @Input() className?: string
  /** Match the panel width to the trigger width. */
  @Input() sameWidth = false

  @ContentChild(BcPopoverTriggerDirective) trigger?: BcPopoverTriggerDirective
  @ViewChild('panel') private panelRef!: ElementRef<HTMLDivElement>

  readonly id = `bc-popover-${++_nextId}`
  isOpen = false

  ngAfterViewInit(): void {
    const triggerEl = this.trigger?.el.nativeElement
    if (triggerEl) {
      triggerEl.setAttribute('popovertarget', this.id)
      triggerEl.setAttribute('aria-haspopup', 'dialog')
      triggerEl.setAttribute('aria-controls', this.id)
      triggerEl.setAttribute('aria-expanded', 'false')
    }
  }

  ngOnDestroy(): void {
    const panel = this.panelRef?.nativeElement as (HTMLDivElement & { hidePopover?: () => void }) | undefined
    try { panel?.hidePopover?.() } catch { /* ignore if already closed */ }
  }

  onToggle(event: Event): void {
    const newState = (event as Event & { newState: string }).newState
    this.isOpen = newState === 'open'
    const triggerEl = this.trigger?.el.nativeElement
    if (triggerEl) triggerEl.setAttribute('aria-expanded', String(this.isOpen))
    if (this.isOpen) void this.reposition()
  }

  private async reposition(): Promise<void> {
    const anchor = this.trigger?.el.nativeElement
    const floating = this.panelRef?.nativeElement
    if (!anchor || !floating) return
    const { x, y } = await positionFloating(anchor, floating, { placement: this.placement })
    floating.style.position = 'fixed'
    floating.style.left = `${x}px`
    floating.style.top = `${y}px`
    floating.style.bottom = 'auto'
    floating.style.right = 'auto'
    floating.style.margin = '0'
    if (this.sameWidth) {
      floating.style.inlineSize = `${anchor.getBoundingClientRect().width}px`
    }
  }
}
