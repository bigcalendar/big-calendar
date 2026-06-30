import { LitElement, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import type { FloatingPlacement } from '@big-calendar/core/utils'
import { positionFloating } from '@big-calendar/core/utils'

let _nextId = 0

/**
 * Popover panel using the browser Popover API, positioned via `positionFloating`
 * from `@big-calendar/core/utils`.
 *
 * The first slotted element with `slot="trigger"` is auto-wired as the
 * popover trigger. The remaining slot content is the popover panel body.
 *
 * @example
 * ```html
 * <bc-popover placement="bottom-start">
 *   <button type="button" slot="trigger">Click to open</button>
 *   <div class="my-menu">Menu content</div>
 * </bc-popover>
 * ```
 */
@customElement('bc-popover')
export class BcPopoverElement extends LitElement {
  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  /** Floating placement relative to the trigger. */
  @property() placement: FloatingPlacement = 'bottom-start'
  /** CSS class applied to the popover panel (default `'bc-popover'`). */
  @property({ attribute: 'popover-class' }) popoverClass?: string
  /** Match the panel width to the trigger width. */
  @property({ type: Boolean, attribute: 'same-width' }) sameWidth = false

  private readonly _panelId: string
  private _isOpen = false
  private _panelEl: HTMLDivElement | null = null
  private _triggerEl: HTMLElement | null = null

  constructor() {
    super()
    this._panelId = `bc-popover-${++_nextId}`
  }

  override firstUpdated(): void {
    this._panelEl = this.querySelector<HTMLDivElement>(`#${this._panelId}`)
    // Find trigger: first child element not the panel
    const triggerSlot = this.querySelector<HTMLElement>('[slot="trigger"]')
    this._triggerEl = triggerSlot
    if (triggerSlot) {
      triggerSlot.setAttribute('popovertarget', this._panelId)
      triggerSlot.setAttribute('aria-haspopup', 'dialog')
      triggerSlot.setAttribute('aria-controls', this._panelId)
      triggerSlot.setAttribute('aria-expanded', 'false')
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    const panel = this._panelEl as (HTMLDivElement & { hidePopover?: () => void }) | null
    try { panel?.hidePopover?.() } catch { /* ignore */ }
  }

  private _onToggle(event: Event): void {
    const newState = (event as Event & { newState: string }).newState
    this._isOpen = newState === 'open'
    if (this._triggerEl) {
      this._triggerEl.setAttribute('aria-expanded', String(this._isOpen))
    }
    if (this._isOpen) void this._reposition()
    this.requestUpdate()
  }

  private async _reposition(): Promise<void> {
    const anchor = this._triggerEl
    const floating = this._panelEl
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

  override render() {
    return html`
      <slot name="trigger"></slot>
      <div
        id=${this._panelId}
        popover="auto"
        class=${this.popoverClass ?? 'bc-popover'}
        @toggle=${(e: Event) => this._onToggle(e)}
      >
        ${this._isOpen ? html`<slot></slot>` : ''}
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'bc-popover': BcPopoverElement
  }
}
