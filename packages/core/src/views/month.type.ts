/**
 * One event's placement within a single week row of the month grid.
 *
 * `left`/`right` are 1-based day columns within the week (`1`–`7`); `span` is
 * how many day columns the event covers. A segment is always clamped to its
 * week, so a multi-week event yields one segment per week it touches.
 */
export interface MonthSegment<TEvent> {
  event: TEvent
  span: number
  left: number
  right: number
}

/**
 * A single week of the month grid: its seven day-start strings, the event
 * segments stacked into non-overlapping rows (`levels`), and any segments that
 * didn't fit under the row's limit (`extra` → the "+N more" overflow).
 */
export interface MonthWeek<TEvent> {
  days: string[]
  levels: MonthSegment<TEvent>[][]
  extra: MonthSegment<TEvent>[]
}

/** The derived month view: the padded grid split into weeks of laid-out events. */
export interface MonthViewModel<TEvent> {
  weeks: MonthWeek<TEvent>[]
}
