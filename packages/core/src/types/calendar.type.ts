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
