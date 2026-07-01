import type { EventSegment } from './segments.type'

/**
 * One event's placement within a single week row of the month grid: a
 * 1-based day-column span (1–7). Alias of the shared {@link EventSegment}.
 */
export type MonthSegment<TEvent> = EventSegment<TEvent>

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
