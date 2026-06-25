import type { Accessor, Accessors, WrappedAccessor } from './accessors.type'

/**
 * Read a single value off `data` using an {@link Accessor}.
 *
 * - function accessor → `field(data)`
 * - string accessor → `data[field]` when `data` is a non-null object that owns
 *   the key
 * - anything else → `null`
 *
 * Returns `null` (never `undefined`) when nothing resolves, matching v1's
 * `accessor` so downstream null-checks stay uniform.
 */
export function accessor<TData, TResult>(args: {
  data: TData
  field: Accessor<TData, TResult>
}): TResult | null {
  const { data, field } = args

  if (typeof field === 'function') return field(data)

  if (typeof field === 'string' && typeof data === 'object' && data !== null && field in data) {
    return (data as Record<string, unknown>)[field] as TResult
  }

  return null
}

/** Bind an {@link Accessor} to a reusable function: `wrapAccessor(field)(data)`. */
export function wrapAccessor<TData, TResult>(
  field: Accessor<TData, TResult>,
): WrappedAccessor<TData, TResult> {
  return (data: TData) => accessor({ data, field })
}

/**
 * Default accessor field names. These match v1's `Calendar` defaults exactly so
 * existing event/resource shapes keep working: note `tooltip` falls back to the
 * title field and `resourceId` reads the resource's own `id`.
 */
export const DEFAULT_ACCESSORS = {
  id: 'id',
  title: 'title',
  tooltip: 'title',
  start: 'start',
  end: 'end',
  allDay: 'allDay',
  resource: 'resourceId',
  resourceId: 'id',
  resourceTitle: 'title',
  type: 'type',
  resourceType: 'resourceType',
  draggable: 'draggable',
  resizable: 'resizable',
} as const satisfies Record<keyof Accessors<unknown, unknown>, string>

/**
 * Merge caller overrides over {@link DEFAULT_ACCESSORS}, yielding a complete
 * accessor set. String defaults are valid accessors for any data shape, so the
 * widening to `Accessors<TEvent, TResource>` is sound.
 */
export function resolveAccessors<TEvent, TResource>(
  overrides?: Partial<Accessors<TEvent, TResource>>,
): Accessors<TEvent, TResource> {
  return { ...DEFAULT_ACCESSORS, ...overrides } as Accessors<TEvent, TResource>
}
