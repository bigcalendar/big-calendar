import type { SegmentRows } from '../views/segments.type'

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

/** One day's time column: its window bounds and the events laid out in it. */
export interface TimeGridColumn<TEvent> {
  date: string
  min: string
  max: string
  /** Foreground timed events, packed by the day-layout algorithm. */
  events: PositionedEvent<TEvent>[]
  /** Background events, rendered full-width behind the foreground (`left: 0, width: 1`). */
  backgroundEvents: PositionedEvent<TEvent>[]
}

/**
 * The derived time-grid view (day / week / work-week): one column per visible
 * day plus the all-day header row of segments. Pure — derives from its args.
 */
export interface TimeGridViewModel<TEvent> {
  days: string[]
  columns: TimeGridColumn<TEvent>[]
  allDay: SegmentRows<TEvent>
}
