import { LitElement, html } from 'lit'
import { customElement } from 'lit/decorators.js'
import { ContextConsumer } from '@lit/context'
import { calendarContext } from '../CalendarController/calendarContext'
import type { CalendarContextValue } from '../CalendarController/calendarContext'
import { CalendarDndController } from './CalendarDndController'

/**
 * Wrapper element that enables event drag-to-move and resize for the calendar.
 *
 * Place this element **inside** `<bc-calendar>` wrapping the view elements.
 * It consumes the calendar context provided by `<bc-calendar>` and activates
 * `CalendarDndController` once the store is ready. Rebinds automatically when
 * the active view changes.
 *
 * `@big-calendar/dnd` is an optional peer dependency — if absent the element
 * renders its slot without activating any drag behaviour.
 *
 * @example
 * ```html
 * <bc-calendar .localizer=${loc} .events=${events} .onEventDrop=${onDrop}>
 *   <bc-calendar-dnd>
 *     <div class="bc-calendar">
 *       <bc-default-toolbar></bc-default-toolbar>
 *       <bc-month-view></bc-month-view>
 *       <bc-time-grid-view></bc-time-grid-view>
 *       <bc-agenda-view></bc-agenda-view>
 *     </div>
 *   </bc-calendar-dnd>
 * </bc-calendar>
 * ```
 */
@customElement('bc-calendar-dnd')
export class BcCalendarDndElement extends LitElement {
  override createRenderRoot() {
    return this
  }

  private _dndController = new CalendarDndController(this, () => this)

  constructor() {
    super()
    // ContextConsumer registers itself via host.addController() and stays alive
    // through the host's controller list — no need to retain a reference here.
    new ContextConsumer(this, {
      context: calendarContext,
      subscribe: true,
      callback: (value: CalendarContextValue | undefined) => {
        if (value?.store) this._dndController.setContext(value)
      },
    })
  }

  override render() {
    return html`<slot></slot>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'bc-calendar-dnd': BcCalendarDndElement
  }
}
