import type { BuiltinViewKey } from '../constants/views.constant'

/**
 * A view identifier. Today this is exactly the built-in set; the view registry
 * (a later Phase 2 task) widens it to admit custom view keys.
 */
export type ViewKey = BuiltinViewKey

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
