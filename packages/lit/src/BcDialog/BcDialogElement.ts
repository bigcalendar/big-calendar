import { LitElement, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'

/**
 * Wraps the native `<dialog>` element for use in Lit templates.
 *
 * - Opens as a modal (`showModal()`) when `open` becomes `true`.
 * - Fires a `bc-close` CustomEvent when the dialog is closed.
 * - Restores focus to the previously focused element on close.
 *
 * @example
 * ```html
 * <bc-dialog ?open=${isOpen} @bc-close=${() => { isOpen = false }}>
 *   <h2>Event detail</h2>
 *   <button type="button" @click=${() => { isOpen = false }}>Close</button>
 * </bc-dialog>
 * ```
 */
@customElement('bc-dialog')
export class BcDialogElement extends LitElement {
  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  /** Whether the dialog is open. */
  @property({ type: Boolean }) open = false
  /** CSS class applied to the inner `<dialog>` (default `'bc-dialog'`). */
  @property({ attribute: 'dialog-class' }) dialogClass?: string
  /** `aria-label` text for the inner `<dialog>` element. */
  @property({ attribute: 'dialog-label' }) dialogLabel?: string
  /** `aria-labelledby` for the inner `<dialog>` element. */
  @property({ attribute: 'dialog-labelledby' }) dialogLabelledby?: string

  private _dialogEl: HTMLDialogElement | null = null
  private _restoreFocus: HTMLElement | null = null

  private _handleClose = (): void => {
    this.dispatchEvent(new CustomEvent('bc-close', { bubbles: true, composed: true }))
  }

  override updated(changed: Map<string | number | symbol, unknown>): void {
    super.updated(changed)
    if (!changed.has('open')) return
    const dialog = this.querySelector<HTMLDialogElement>('dialog')
    if (!dialog) return
    this._dialogEl = dialog

    if (this.open) {
      this._restoreFocus =
        document.activeElement instanceof HTMLElement ? document.activeElement : null
      if (typeof dialog.showModal === 'function' && !dialog.open) {
        dialog.addEventListener('close', this._handleClose)
        dialog.showModal()
      }
    } else {
      if (typeof dialog.close === 'function' && dialog.open) {
        dialog.close()
      }
      dialog.removeEventListener('close', this._handleClose)
      this._restoreFocus?.focus()
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    const dialog = this._dialogEl
    dialog?.removeEventListener('close', this._handleClose)
    if (dialog?.open) dialog.close()
  }

  override render() {
    return html`
      <dialog
        class=${this.dialogClass ?? 'bc-dialog'}
        aria-label=${this.dialogLabel ?? ''}
        aria-labelledby=${this.dialogLabelledby ?? ''}
      >
        ${this.open ? html`<slot></slot>` : ''}
      </dialog>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'bc-dialog': BcDialogElement
  }
}
