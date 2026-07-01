import { ChangeDetectionStrategy, Component, Input, ViewChild } from '@angular/core'
import type { ElementRef } from '@angular/core'
import type { AfterViewInit, OnDestroy } from '@angular/core'
import type { FloatingPlacement } from '@big-calendar/core/utils'
import { positionFloating } from '@big-calendar/core/utils'

let _nextId = 0

interface PopoverElement extends HTMLDivElement {
  showPopover: () => void
  hidePopover: () => void
}

/**
 * Tooltip that uses the browser Popover API in `manual` mode and positions via
 * `positionFloating` from `@big-calendar/core/utils`.
 *
 * Shows on hover/focus, hides on pointer-leave/blur, toggles on click.
 * The inner `ng-content` becomes the hovered/focused trigger; `[label]` is the
 * tooltip text. For richer tooltip content use `<bc-popover>` instead.
 *
 * @example
 * ```html
 * <bc-tooltip label="Dismiss">
 *   <button type="button" aria-label="Dismiss">✕</button>
 * </bc-tooltip>
 * ```
 */
@Component({
  selector: 'bc-tooltip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      #anchor
      class="bc-tooltip-anchor"
      style="display: inline-flex"
      [attr.aria-describedby]="id"
      (pointerenter)="show()"
      (pointerleave)="hide()"
      (focus)="show()"
      (blur)="hide()"
      (click)="toggle()"
    >
      <ng-content />
      <div
        #tip
        [id]="id"
        role="tooltip"
        popover="manual"
        class="bc-tooltip"
      >{{ label }}</div>
    </span>
  `,
})
export class BcTooltipComponent implements AfterViewInit, OnDestroy {
  /** Tooltip text to display. */
  @Input({ required: true }) label!: string
  /** Floating placement relative to the anchor. */
  @Input() placement: FloatingPlacement = 'top'

  @ViewChild('anchor') private anchorRef!: ElementRef<HTMLSpanElement>
  @ViewChild('tip') private tipRef!: ElementRef<PopoverElement>

  readonly id = `bc-tooltip-${++_nextId}`
  private isOpen = false

  ngAfterViewInit(): void {
    // Nothing to wire — Popover API is declarative
  }

  ngOnDestroy(): void {
    try { this.tipRef?.nativeElement?.hidePopover?.() } catch { /* ignore */ }
  }

  show(): void {
    if (this.isOpen) return
    this.isOpen = true
    const tip = this.tipRef?.nativeElement
    if (!tip) return
    try { tip.showPopover?.() } catch { /* API not available */ }
    void this.reposition()
  }

  hide(): void {
    if (!this.isOpen) return
    this.isOpen = false
    try { this.tipRef?.nativeElement?.hidePopover?.() } catch { /* ignore */ }
  }

  toggle(): void {
    if (this.isOpen) this.hide()
    else this.show()
  }

  private async reposition(): Promise<void> {
    const anchor = this.anchorRef?.nativeElement
    const floating = this.tipRef?.nativeElement
    if (!anchor || !floating) return
    const { x, y } = await positionFloating(anchor, floating, { placement: this.placement })
    floating.style.position = 'fixed'
    floating.style.left = `${x}px`
    floating.style.top = `${y}px`
    floating.style.bottom = 'auto'
    floating.style.right = 'auto'
    floating.style.margin = '0'
  }
}
