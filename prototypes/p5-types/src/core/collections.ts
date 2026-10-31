// Reactive, id-indexed collections (D-57, D-58). When passed, the collection is the source of truth.
import type { CalendarEvent, EventSource, Resource } from './data.ts'
import type { EventId, ResourceId, SourceId } from './values.ts'

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

export type EventCollection<TMeta = unknown> = Collection<
  CalendarEvent<TMeta>,
  EventId
>
export type ResourceCollection<TMeta = unknown> = Collection<
  Resource<TMeta>,
  ResourceId
>
export type SourceCollection<TMeta = unknown> = Collection<
  EventSource<TMeta>,
  SourceId
>

export declare function createEventCollection<TMeta = unknown>(
  rows?: Iterable<CalendarEvent<TMeta>>,
): EventCollection<TMeta>
export declare function createResourceCollection<TMeta = unknown>(
  rows?: Iterable<Resource<TMeta>>,
): ResourceCollection<TMeta>
export declare function createSourceCollection<TMeta = unknown>(
  rows?: Iterable<EventSource<TMeta>>,
): SourceCollection<TMeta>

/** What `events`, `backgroundEvents`, `resources` and `sources` accept (D-57). */
export type DataInput<TRow extends { id: TId }, TId> =
  Iterable<TRow> | Collection<TRow, TId>
