/**
 * One event clamped to a single row of days and expressed as day columns.
 * `left`/`right` are 1-based columns within the row; `span` is the column count.
 * Used by the month grid (one row per week) and the time-grid all-day header
 * (a single row across all visible days).
 */
export interface EventSegment<TEvent> {
  event: TEvent
  span: number
  left: number
  right: number
}

/**
 * Segments stacked into non-overlapping rows. `levels` are the rendered rows;
 * `extra` holds whatever spilled past the row limit (the "+N more" overflow).
 */
export interface SegmentRows<TEvent> {
  levels: EventSegment<TEvent>[][]
  extra: EventSegment<TEvent>[]
}
