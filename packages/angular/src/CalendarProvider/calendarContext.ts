import type { CalendarStore, Messages } from '@big-calendar/core'
import { InjectionToken } from '@angular/core'
import type { Signal } from '@angular/core'

/**
 * Angular equivalent of the Vue/React CalendarComponents map.
 * Slot customization in Angular uses ng-template inputs on individual view
 * components directly; this type is a placeholder for the context shape.
 */
export type CalendarComponents = Record<string, unknown>

/**
 * Shared calendar state injected by `CalendarProviderComponent` and consumed by
 * every descendant that calls {@link injectCalendar}. Mirrors the React and Vue
 * adapter contexts for API parity.
 *
 * - `store` — the reactive store; read signal values via `toAngularSignal`.
 * - `components` — optional per-slot component overrides (Task 11-5).
 * - `messages` — resolved UI strings (defaults merged with any overrides).
 * - `descriptionIds` — ids of the visually-hidden instruction elements that
 *   slot cells and event buttons reference via `aria-describedby`.
 */
export interface CalendarContextValue<TEvent = unknown, TResource = unknown> {
  readonly store: CalendarStore<TEvent, TResource>
  /**
   * Angular `Signal<CalendarStore | null>` that starts `null` and becomes
   * non-null after `CalendarProviderComponent`'s first effect run.
   * View composables (`injectMonthView`, etc.) subscribe to this signal so
   * they can reactively bridge preact signals once the store is available —
   * avoiding the timing race where child components are constructed before
   * the parent's store-creation effect has run.
   */
  readonly storeSignal: Signal<CalendarStore<TEvent, TResource> | null>
  readonly components: CalendarComponents
  readonly messages: Messages
  readonly descriptionIds: { selection: string; event: string }
}

/**
 * Angular `InjectionToken` for the calendar context. Typed so that
 * `inject(CALENDAR_TOKEN)` returns `CalendarContextValue` without a cast.
 */
export const CALENDAR_TOKEN = new InjectionToken<CalendarContextValue>('CalendarContext')
