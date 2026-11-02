// Reactive, id-indexed collections (D-57, D-58). When passed, the collection is the source of truth.
import type { CalendarEvent, EventSource, Resource } from './data.type'
import type { EventId, ResourceId, SourceId } from './values.type'

/** A reactive, id-indexed collection (D-57, D-58). When passed as an input, it is the single source of truth. */
export interface Collection<TRow extends { id: TId }, TId> extends Iterable<
  Readonly<TRow>
> {
  readonly size: number
  get(id: TId): Readonly<TRow> | undefined
  has(id: TId): boolean
  /** Inserts or replaces the row with the same id. */
  upsert(row: TRow): void
  /** Shallow-merges fields into an existing row. `id` can't change. */
  patch(id: TId, fields: Partial<Omit<TRow, 'id'>>): void
  remove(id: TId): void
}

/** A collection of events, from `createEventCollection`. */
export type EventCollection<TMeta = unknown> = Collection<
  CalendarEvent<TMeta>,
  EventId
>
/** A collection of resources, from `createResourceCollection`. */
export type ResourceCollection<TMeta = unknown> = Collection<
  Resource<TMeta>,
  ResourceId
>
/** A collection of event sources, from `createSourceCollection`. */
export type SourceCollection<TMeta = unknown> = Collection<
  EventSource<TMeta>,
  SourceId
>

/** What `events`, `backgroundEvents`, `resources` and `sources` accept (D-57). */
export type DataInput<TRow extends { id: TId }, TId> =
  Iterable<TRow> | Collection<TRow, TId>
