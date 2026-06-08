import type { BuiltinViewKey } from '../constants/views.constant'

/**
 * A view identifier. The built-in keys (`month`/`week`/`work_week`/`day`/
 * `agenda`) keep their literal autocomplete; the `(string & {})` arm admits
 * custom view keys registered through the view registry (`views` config). The
 * cost of this widening is that each core seam (`viewRange`/`navigateDate`/
 * `viewLabel`/`buildViewModel`) loses exhaustive-`switch` safety and needs a
 * runtime `default` that consults the registry (or throws for an unknown key).
 *
 * The `(string & {})` arm admits arbitrary keys while preserving the built-in
 * literals for autocomplete (a plain `| string` would collapse the union).
 */
export type ViewKey = BuiltinViewKey | (string & {})

/** Stable identity for an event. */
export type EventId = string | number

/** Stable identity for a resource. */
export type ResourceId = string | number

/**
 * The visible day-range for the current date + view, as day-start strings.
 *
 * `days` is every day shown, in order; `firstVisibleDay`/`lastVisibleDay` are
 * its bounds (for month this is the padded grid; for work-week, weekends are
 * dropped). All values are floored to the start of the day.
 */
export interface VisibleRange {
  firstVisibleDay: string
  lastVisibleDay: string
  days: string[]
}
