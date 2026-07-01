import type { CalendarConfig, ViewKey } from '@big-calendar/core'

/**
 * Props accepted by the Svelte `useCalendarStore` function and the
 * `<CalendarProvider>` component. Mirrors the React adapter's `CalendarProps`
 * for API parity (§10-2).
 *
 * Supports hybrid controlled / uncontrolled mode:
 * - Omit `view`/`date` to run **uncontrolled** (store owns them, seeded from
 *   `defaultView`/`defaultDate`).
 * - Pass `view`/`date` to run **controlled** (calendar reflects the prop;
 *   wire `onView`/`onNavigate` to update them externally).
 * - `events`/`backgroundEvents`/`resources` are data inputs and always sync.
 */
export interface CalendarProps<TEvent = unknown, TResource = unknown>
  extends Omit<CalendarConfig<TEvent, TResource>, 'view' | 'date' | 'enabledViews'> {
  /** Initial view (uncontrolled). Ignored when `view` is set. */
  defaultView?: ViewKey | undefined
  /** Initial focus date (uncontrolled). Ignored when `date` is set. */
  defaultDate?: string | undefined
  /** Controlled view. */
  view?: ViewKey | undefined
  /** Controlled focus date (RFC 3339/9557). */
  date?: string | undefined
  /**
   * Which view keys to show in the toolbar and allow navigation to. Defaults to
   * all built-in views plus any custom keys in `viewDefinitions`.
   */
  views?: ViewKey[] | undefined
}
