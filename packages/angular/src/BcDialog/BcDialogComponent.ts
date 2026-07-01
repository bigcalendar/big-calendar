import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core'
import type { ElementRef } from '@angular/core'
import type { OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core'

/**
 * Wraps the native `<dialog>` element for use in Angular templates.
 *
 * - Opens as a modal (`showModal()`) when `[open]` becomes `true`.
 * - Fires `(bcClose)` when the dialog is closed (escape key, native close event, or programmatic close).
 * - Restores focus to the previously focused element on close.
 *
 * @example
 * ```html
 * <bc-dialog [open]="isOpen" (bcClose)="isOpen = false" aria-label="Event detail">
 *   <h2>Event title</h2>
 *   <button type="button" (click)="isOpen = false">Close</button>
 * </bc-dialog>
 * ```
 */
@Component({
  selector: 'bc-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog
      #dialogEl
      [class]="className || 'bc-dialog'"
      [attr.aria-label]="ariaLabel || null"
      [attr.aria-labelledby]="ariaLabelledby || null"
    >
      @if (open) { <ng-content /> }
    </dialog>
  `,
})
export class BcDialogComponent implements OnInit, OnChanges, OnDestroy {
  /** Whether the dialog is open. */
  @Input() open = false
  /** CSS class override (default `'bc-dialog'`). */
  @Input() className?: string
  /** `aria-label` for the dialog element. */
  @Input('aria-label') ariaLabel?: string
  /** `aria-labelledby` for the dialog element. */
  @Input('aria-labelledby') ariaLabelledby?: string

  /** Emitted when the dialog closes (escape key, `close()` call, or native close event). */
  @Output() readonly bcClose = new EventEmitter<void>()

  @ViewChild('dialogEl') private dialogEl!: ElementRef<HTMLDialogElement>

  private restoreFocus: HTMLElement | null = null
  private handleCloseEvent = (): void => this.bcClose.emit()

  ngOnInit(): void {
    // Initial open state is handled by ngOnChanges on first run
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!('open' in changes)) return
    const dialog = this.dialogEl?.nativeElement
    if (!dialog) return

    if (this.open) {
      this.restoreFocus =
        document.activeElement instanceof HTMLElement ? document.activeElement : null
      if (typeof dialog.showModal === 'function' && !dialog.open) {
        dialog.addEventListener('close', this.handleCloseEvent)
        dialog.showModal()
      }
    } else {
      if (typeof dialog.close === 'function' && dialog.open) {
        dialog.close()
      }
      dialog.removeEventListener('close', this.handleCloseEvent)
      this.restoreFocus?.focus()
    }
  }

  ngOnDestroy(): void {
    const dialog = this.dialogEl?.nativeElement
    dialog?.removeEventListener('close', this.handleCloseEvent)
    if (dialog?.open) dialog.close()
  }
}
