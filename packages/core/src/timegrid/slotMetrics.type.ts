/**
 * One event's vertical placement in a day column, plus the raw minute offsets
 * used to detect overlaps. `top`/`height` are fractions of the column (`0..1`);
 * `start`/`end` are minutes from the grid's `min`. `startDate`/`endDate` are the
 * event's times clamped to the visible `[min, max]` window.
 */
export interface SlotRange {
  top: number
  height: number
  start: number
  end: number
  startDate: string
  endDate: string
}

/**
 * Derived geometry for a single day's time column. Maps event times to vertical
 * fractions and exposes the slot boundaries. Pure: built once from `min`/`max`/
 * `step`/`timeslots`, then queried.
 */
export interface SlotMetrics {
  readonly min: string
  readonly max: string
  readonly step: number
  readonly timeslots: number
  readonly numSlots: number
  readonly totalMin: number
  /** Slot boundary times, oldest first, including the closing boundary. */
  readonly slots: string[]
  /** Vertical placement of an event's `[start, end]`, clamped to `[min, max]`. */
  getRange(args: { start: string; end: string; ignoreMin?: boolean; ignoreMax?: boolean }): SlotRange
  /** Fraction (`0..1`) down the column for a moment in time (the "now" line). */
  getCurrentTimePosition(date: string): number
}
