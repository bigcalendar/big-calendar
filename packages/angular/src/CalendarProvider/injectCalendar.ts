import { inject } from '@angular/core'
import { CALENDAR_TOKEN } from './calendarContext'
import type { CalendarContextValue } from './calendarContext'

/**
 * Inject the shared calendar context provided by the nearest ancestor
 * `<bc-calendar-provider>`.
 *
 * Throws if called outside a provider — same contract as Vue's
 * `useCalendarContext()` and React's `useCalendarContext()`.
 *
 * @example
 * ```ts
 * @Component({ ... })
 * export class MyViewComponent {
 *   private readonly _calendar = injectCalendar()
 *   private readonly _view = toAngularSignal(this._calendar.store.view)
 * }
 * ```
 */
export function injectCalendar<
  TEvent = unknown,
  TResource = unknown,
>(): CalendarContextValue<TEvent, TResource> {
  const context = inject(CALENDAR_TOKEN, { optional: true })
  if (context === null) {
    throw new Error(
      'injectCalendar() must be called within a <bc-calendar-provider> component tree.',
    )
  }
  return context as CalendarContextValue<TEvent, TResource>
}
