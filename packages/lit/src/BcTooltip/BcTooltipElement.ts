import { LitElement, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import type { FloatingPlacement } from '@big-calendar/core/utils'
import { positionFloating } from '@big-calendar/core/utils'

let _nextId = 0

interface PopoverElement extends HTMLDivElement {
  showPopover: () => void
  hidePopover: () => void
}

/**
 * Tooltip using the browser Popover API in `manual` mode, positioned via
 * `positionFloating` from `@big-calendar/core/utils`.
 *
 * Shows on hover/focus, hides on pointer-leave/blur, toggles on click.
 * The slot content is the hovered/focused trigger; `label` is the tooltip text.
 *
 * @example
 * ```html
 * <bc-tooltip label="Dismiss">
 *   <button type="button" aria-label="Dismiss">✕</button>
 * </bc-tooltip>
 * ```
 */
@customElement('bc-tooltip')
export class BcTooltipElement extends LitElement {
  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    return this
  }

  /** Tooltip text to display. Required. */
  @property() label!: string
  /** Floating placement relative to the anchor. */
  @property() placement: FloatingPlacement = 'top'

  private readonly _tipId: string
  private _isOpen = false
  private _anchorEl: HTMLElement | null = null
  private _tipEl: PopoverElement | null = null

  constructor() {
    super()
    this._tipId = `bc-tooltip-${++_nextId}`
  }

  override firstUpdated(): void {
    this._anchorEl = this.querySelector<HTMLElement>('.bc-tooltip-anchor')
    this._tipEl = this.querySelector<PopoverElement>(`#${this._tipId}`)
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    try { this._tipEl?.hidePopover?.() } catch { /* ignore */ }
  }

  private _show(): void {
    if (this._isOpen) return
    this._isOpen = true
    const tip = this._tipEl
    if (!tip) return
    try { tip.showPopover?.() } catch { /* API not available */ }
    void this._reposition()
  }

  private _hide(): void {
    if (!this._isOpen) return
    this._isOpen = false
    try { this._tipEl?.hidePopover?.() } catch { /* ignore */ }
  }

  private _toggle(): void {
    if (this._isOpen) this._hide()
    else this._show()
  }

  private async _reposition(): Promise<void> {
    const anchor = this._anchorEl
    const floating = this._tipEl
    if (!anchor || !floating) return
    const { x, y } = await positionFloating(anchor, floating, { placement: this.placement })
    floating.style.position = 'fixed'
    floating.style.left = `${x}px`
    floating.style.top = `${y}px`
    floating.style.bottom = 'auto'
    floating.style.right = 'auto'
    floating.style.margin = '0'
  }

  override render() {
    return html`
      <span
        class="bc-tooltip-anchor"
        style="display: inline-flex"
        aria-describedby=${this._tipId}
        @pointerenter=${() => this._show()}
        @pointerleave=${() => this._hide()}
        @focus=${() => this._show()}
        @blur=${() => this._hide()}
        @click=${() => this._toggle()}
      >
        <slot></slot>
        <div
          id=${this._tipId}
          role="tooltip"
          popover="manual"
          class="bc-tooltip"
        >${this.label}</div>
      </span>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'bc-tooltip': BcTooltipElement
  }
}
