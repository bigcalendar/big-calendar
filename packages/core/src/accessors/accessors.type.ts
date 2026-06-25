import type { EventId, ResourceId } from '../types/calendar.type'

/** Derives a value from a data object. */
export type AccessorFn<TData, TResult> = (data: TData) => TResult

/**
 * A configurable accessor: either a property key on the data object or a
 * function that derives the value. Mirrors v1's string-or-function accessors,
 * the mechanism that lets `core` read arbitrary event/resource shapes.
 */
export type Accessor<TData, TResult> = string | AccessorFn<TData, TResult>

/** A resolved accessor, always callable, that returns `null` when unresolved. */
export type WrappedAccessor<TData, TResult> = (data: TData) => TResult | null

/**
 * The full set of accessors `core` uses to normalize arbitrary event and
 * resource shapes into the engine's vocabulary.
 *
 * `id`/`title`/`tooltip`/`start`/`end`/`allDay`/`resource` read from an event;
 * `resourceId`/`resourceTitle` read from a resource object. `start`/`end`
 * resolve to RFC 3339/9557 **strings** — never a `Date` (§4.1).
 */
export interface Accessors<TEvent, TResource> {
  /** Stable event identity (v1 `eventIdAccessor`). */
  id: Accessor<TEvent, EventId>
  /** Display title of an event. */
  title: Accessor<TEvent, string>
  /** Hover/aria tooltip text (v1 default: the title). */
  tooltip: Accessor<TEvent, string>
  /** Event start as an RFC 3339/9557 string. */
  start: Accessor<TEvent, string>
  /** Event end as an RFC 3339/9557 string. */
  end: Accessor<TEvent, string>
  /** Whether the event spans whole days. */
  allDay: Accessor<TEvent, boolean>
  /** The resource id(s) an event belongs to (v1 `resourceAccessor`). */
  resource: Accessor<TEvent, ResourceId | ResourceId[]>
  /** A resource object's own id (v1 `resourceIdAccessor`). */
  resourceId: Accessor<TResource, ResourceId>
  /** A resource object's display title (v1 `resourceTitleAccessor`). */
  resourceTitle: Accessor<TResource, string>
  /** Optional event type label (e.g. `'meeting'`, `'holiday'`). Returns `null` when the field is absent. */
  type: Accessor<TEvent, string>
  /** Optional resource type label. Returns `null` when the field is absent. */
  resourceType: Accessor<TResource, string>
  /** Whether the event may be dragged. Returning `false` blocks drag; `null` falls back to draggable. */
  draggable: Accessor<TEvent, boolean>
  /** Whether the event may be resized. Returning `false` blocks resize; `null` falls back to resizable. */
  resizable: Accessor<TEvent, boolean>
}
