import { LitElement, html } from 'lit'
import { customElement } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { ContextConsumer } from '@lit/context'
import { effect } from '@preact/signals-core'
import { BUILTIN_VIEWS, Navigate } from '@big-calendar/core'
import type { CalendarStore, NavigateDirection, ViewKey } from '@big-calendar/core'
import { calendarContext } from '../CalendarController/calendarContext'
import type { CalendarContextValue } from '../CalendarController/calendarContext'

const BUILTIN = new Set<string>(BUILTIN_VIEWS)

@customElement('bc-default-toolbar')
export class DefaultToolbarElement extends LitElement {
  override createRenderRoot() {
    return this
  }

  private _label = ''
  private _view: ViewKey = 'month'
  private _views: ViewKey[] = []
  private _store: CalendarStore | null = null
  private _disposes: (() => void)[] = []

  private _ctx = new ContextConsumer(this, {
    context: calendarContext,
    subscribe: true,
    callback: (value: CalendarContextValue | undefined) => {
      if (value) this._onContextAvailable(value)
    },
  })

  private _onContextAvailable(ctx: CalendarContextValue): void {
    this._disposes.forEach((d) => d())
    this._disposes = []
    const store = ctx.store
    if (!store) return
    this._store = store

    this._disposes.push(
      effect(() => {
        this._label = store.label.value
        this.requestUpdate()
      }),
    )
    this._disposes.push(
      effect(() => {
        this._view = store.view.value
        this.requestUpdate()
      }),
    )
    this._disposes.push(
      effect(() => {
        this._views = store.enabledViews.value
        this.requestUpdate()
      }),
    )
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback()
    this._disposes.forEach((d) => d())
    this._disposes = []
    this._store = null
  }

  private _navigate(direction: NavigateDirection): void {
    this._store?.navigate({ direction })
  }

  private _setView(view: ViewKey): void {
    this._store?.setView({ view })
  }

  private _viewLabel(key: ViewKey): string {
    const msgs = this._ctx.value?.messages
    if (!msgs) return key
    if (BUILTIN.has(key)) {
      return (msgs[key as keyof typeof msgs] as string | undefined) ?? key
    }
    return key
  }

  override render() {
    const msgs = this._ctx.value?.messages
    return html`
      <div class="bc-toolbar">
        <div class="bc-toolbar-group">
          <button type="button" class="bc-btn" @click=${() => this._navigate(Navigate.PREVIOUS)}>
            ${msgs?.previous ?? 'Back'}
          </button>
          <button type="button" class="bc-btn" @click=${() => this._navigate(Navigate.TODAY)}>
            ${msgs?.today ?? 'Today'}
          </button>
          <button type="button" class="bc-btn" @click=${() => this._navigate(Navigate.NEXT)}>
            ${msgs?.next ?? 'Next'}
          </button>
        </div>

        <span class="bc-toolbar-label">${this._label}</span>

        <div class="bc-toolbar-group">
          ${this._views.map((option) => html`
            <button
              type="button"
              class=${classMap({ 'bc-btn': true })}
              aria-pressed=${option === this._view}
              @click=${() => this._setView(option)}
            >${this._viewLabel(option)}</button>
          `)}
        </div>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'bc-default-toolbar': DefaultToolbarElement
  }
}
