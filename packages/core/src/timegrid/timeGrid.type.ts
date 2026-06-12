import type { ResourceId } from '../types/calendar.type'
import type { SegmentRows } from '../views/segments.type'

/** Controls how resources are grouped in the time grid. */
export type ResourceLayoutMode = 'resource' | 'day'

/**
 * A timed event placed in a day column. Geometry is all fractions of the
 * column (`0..1`): `top`/`height` from the slot metrics, `left`/`width` from the
 * day-layout algorithm. `zIndex` rises with paint order.
 */
export interface PositionedEvent<TEvent> {
  event: TEvent
  top: number
  height: number
  left: number
  width: number
  zIndex: number
}

/**
 * A background event segment placed in one day column. Geometry fractions are
 * the same as `PositionedEvent`. `isStart`/`isEnd` flag whether the original
 * event begins/ends on this column's date, controlling which corners are
 * rounded when an event spans multiple day columns.
 */
export interface PositionedBgEvent<TEvent> extends PositionedEvent<TEvent> {
  /** True when the original event's start date falls on this column's date. */
  isStart: boolean
  /** True when the original event's end date falls on this column's date. */
  isEnd: boolean
}

/**
 * One day's time column: its window bounds and the events laid out in it. When
 * the grid has resources, `resourceId` is the resource this column belongs to
 * (the column is the intersection of one day and one resource); it is `null` in
 * the plain, resource-less grid.
 */
export interface TimeGridColumn<TEvent> {
  date: string
  /** Owning resource id, or `null` in a resource-less grid. */
  resourceId: ResourceId | null
  min: string
  max: string
  /** Foreground timed events, packed by the day-layout algorithm. */
  events: PositionedEvent<TEvent>[]
  /** Background events, packed by the same algorithm as foreground events. */
  backgroundEvents: PositionedBgEvent<TEvent>[]
}

/**
 * One resource's slice of the time grid: its own day columns (one per visible
 * day, holding only that resource's events) and its own all-day lane. Only
 * present when the calendar is given a `resources` array.
 */
export interface TimeGridResourceGroup<TEvent> {
  resourceId: ResourceId
  /** Resolved resource display title (for the resource header). */
  resourceTitle: string
  /** One column per visible day, filtered to this resource's events. */
  columns: TimeGridColumn<TEvent>[]
  /** This resource's all-day header segments, laid out across the visible days. */
  allDay: SegmentRows<TEvent>
}

/**
 * One (day × resource) cell in the day-major layout: the time column for this
 * day filtered to this resource's events, plus the resource's all-day segments
 * scoped to this single day.
 */
export interface TimeGridDayResourceCell<TEvent> {
  resourceId: ResourceId
  resourceTitle: string
  column: TimeGridColumn<TEvent>
  /** All-day segments for this resource on this specific day (single-day scope). */
  allDay: SegmentRows<TEvent>
}

/**
 * One day's slice in the day-major layout: an ordered list of per-resource
 * cells (timed column + single-day all-day segments).
 */
export interface TimeGridDayGroup<TEvent> {
  date: string
  /** One cell per resource, in resource-list order. */
  cells: TimeGridDayResourceCell<TEvent>[]
}

/**
 * The derived time-grid view (day / week / work-week): one column per visible
 * day plus the all-day header row of segments. Pure — derives from its args.
 *
 * Without resources: `columns`/`allDay` hold the grid; `resources` and
 * `dayGroups` are both `null`.
 *
 * With resources and `resourceLayout:'resource'` (default): `resources` holds
 * one group per resource (each group contains all visible days). The flat
 * `columns`/`allDay` and `dayGroups` are empty/null.
 *
 * With resources and `resourceLayout:'day'`: `dayGroups` holds one group per
 * visible day (each group contains one cell per resource with a single-day
 * column and scoped all-day segments). The flat `columns`/`allDay` and
 * `resources` are empty/null.
 */
export interface TimeGridViewModel<TEvent> {
  days: string[]
  columns: TimeGridColumn<TEvent>[]
  allDay: SegmentRows<TEvent>
  /** Resource-major groups (one per resource, all days), or `null`. */
  resources: TimeGridResourceGroup<TEvent>[] | null
  /** Day-major groups (one per day, all resources per day), or `null`. */
  dayGroups: TimeGridDayGroup<TEvent>[] | null
}
